import type { UserProfile } from "./store";
import { improveResume } from "./improve";
import type { ResumeStyle } from "./resumeStyle";
import { aiChat, hasAiProvider } from "./aiClient";

export interface TailorInput {
  resumeText: string;
  jobDescription: string;
  company?: string;
  role?: string;
  profile?: UserProfile | null;
  style?: ResumeStyle;
}

export interface TailorResult {
  tailoredResume: string;
  changes: string[];
  addedKeywords: string[];
  notes: string;
  engine: "ai" | "heuristic";
}

const SYSTEM_PROMPT = `You are an executive US resume writer and ATS specialist. Rewrite and strengthen the candidate's existing resume for the specific company and role described.

Rules:
- Keep only facts already present in the resume or profile. Never invent employers, titles, degrees, metrics, or skills.
- Do not infer protected characteristics (age, race, gender, disability, veteran status, national origin, religion, family status).
- Preserve real education, internships, work experience, and projects. You may reorder, tighten, and add measurable framing only when the source supports it.
- Optimize for ATS by using the target role's language naturally. Do not stuff every keyword.
- Make bullets outcome-oriented: what was done, how, and the result.
- Use a confident, senior tone. Avoid student-like phrasing such as "looking for an opportunity", "eager to learn", or "helped with".
- Lead bullets with strong action verbs and emphasize ownership, scope, and business impact.
- Never include the target company name in the resume. Tailor the resume to the role and industry, but keep it employer-agnostic.
- Use standard sections in this order: Targeted Profile, Core Skills, Experience, Projects, Education. If a section is missing from the source, omit it.
- Return a single JSON object with exactly these fields:
{
  "tailoredResume": string,       // the rewritten resume, using \n for line breaks
  "changes": string[],             // 4-7 bullet descriptions of what was improved and why
  "addedKeywords": string[],       // target keywords now reflected more clearly
  "notes": string                  // one short caution or next step for the candidate
}`;

function parseJsonObject(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) return JSON.parse(fenced[1]) as Record<string, unknown>;
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
    }
    throw new Error("Could not parse model output as JSON");
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());
}

async function aiTailor(input: TailorInput): Promise<TailorResult> {
  const user = [
    `Target: ${input.role || "the role"}${input.company ? ` at ${input.company}` : ""}`,
    `Resume style: ${input.style || "executive"}`,
    "",
    "Job description:",
    '"""',
    input.jobDescription.trim().slice(0, 12000),
    '"""',
    "",
    "Candidate profile:",
    JSON.stringify(input.profile ?? {}),
    "",
    "Current resume:",
    '"""',
    input.resumeText.trim().slice(0, 20000),
    '"""',
  ].join("\n");

  const content = await aiChat({
    system: SYSTEM_PROMPT,
    user,
    temperature: 0.3,
    json: true,
  });

  const raw = parseJsonObject(content);
  const tailoredResume = typeof raw.tailoredResume === "string" ? raw.tailoredResume.trim() : "";
  if (tailoredResume.length < 100) throw new Error("Model returned an incomplete resume");
  return {
    tailoredResume,
    changes: asStringArray(raw.changes),
    addedKeywords: asStringArray(raw.addedKeywords),
    notes: typeof raw.notes === "string" ? raw.notes.trim() : "",
    engine: "ai",
  };
}

function keywordHits(jd: string, words: string[]): string[] {
  const lower = jd.toLowerCase();
  return words
    .filter((word) => lower.includes(word.toLowerCase()))
    .slice(0, 8);
}

function heuristicTailor(input: TailorInput): TailorResult {
  const p = input.profile;
  const role = input.role || "the target role";
  const company = input.company || "the company";
  const style = input.style || "executive";
  const profileSkills = p?.skills ?? [];
  const matched = keywordHits(input.jobDescription, [
    ...profileSkills,
    "Python",
    "TypeScript",
    "JavaScript",
    "React",
    "Next.js",
    "Node.js",
    "SQL",
    "AWS",
    "Docker",
    "Kubernetes",
    "Machine Learning",
    "LLMs",
    "AI Agents",
    "MCP",
    "Prompt Engineering",
    "RAG",
    "PyTorch",
    "Data Analysis",
    "A/B Testing",
    "Figma",
    "Product Strategy",
    "Agile",
    "Communication",
    "Leadership",
  ]);

  const summary = [
    `${role} with ${p?.yearsExperience != null ? `${p.yearsExperience}+ years` : "proven"} experience delivering measurable outcomes`,
    p?.fieldOfStudy ? `, backed by ${p.educationLevel || "a degree"}${p.fieldOfStudy ? ` in ${p.fieldOfStudy}` : ""}` : "",
    `. Demonstrated strength in ${matched.length ? matched.join(", ") : "technical delivery, stakeholder alignment, and execution"}.`,
  ]
    .join("")
    .replace(/\s+/g, " ")
    .trim();

  const sections: string[] = [];
  sections.push("[Your name]");
  sections.push("[City, State] · [email] · [LinkedIn]\n");
  sections.push(style === "classic" ? "PROFESSIONAL PROFILE" : style === "modern" ? "TARGETED PROFILE" : style === "ats" ? "SUMMARY" : "TARGETED PROFILE");
  sections.push(summary + "\n");
  sections.push(style === "classic" ? "AREAS OF EXPERTISE" : style === "modern" ? "CAPABILITIES" : style === "ats" ? "CORE SKILLS" : "CORE COMPETENCIES");
  sections.push((p?.skills?.length ? p.skills : matched).slice(0, 14).join(" · ") + "\n");
  sections.push(style === "classic" ? "WORK EXPERIENCE & PROJECTS" : style === "modern" ? "IMPACT & EXPERIENCE" : style === "ats" ? "EXPERIENCE" : "PROFESSIONAL EXPERIENCE");
  sections.push(
    input.resumeText.trim().length
      ? input.resumeText.trim().replace(/\r\n/g, "\n").slice(0, 5000)
      : "Add your existing resume text here.",
  );

  const edu = p?.educationLevel
    ? [
        p.educationLevel,
        p.fieldOfStudy ? ` in ${p.fieldOfStudy}` : "",
        p.school ? ` · ${p.school}` : "",
        p.gradYear ? ` · ${p.gradYear}` : "",
      ].join("")
    : "";
  if (edu) {
    sections.push("\nEDUCATION");
    sections.push(edu);
  }

  if (p?.internships?.length) {
    sections.push("\nINTERNSHIPS");
    sections.push(p.internships.map((i) => `- ${i}`).join("\n"));
  }

  const addedKeywords = matched;
  return {
    tailoredResume: sections.join("\n"),
    changes: [
      `Repositioned the profile toward ${role}${company !== "the company" ? ` at ${company}` : ""}.`,
      matched.length
        ? `Surfaced target language: ${matched.slice(0, 5).join(", ")}.`
        : "Kept your original experience intact; add the role's keywords only where they are genuinely supported.",
      "Grouped skills into a scannable ATS-friendly section.",
      p?.internships?.length ? "Preserved internships as their own section." : "Left education and experience untouched for you to verify.",
    ],
    addedKeywords,
    notes: "Heuristic demo — verify every claim, then save this as a resume version before applying.",
    engine: "heuristic",
  };
}

export async function tailorResume(input: TailorInput): Promise<TailorResult> {
  if (hasAiProvider()) {
    try {
      return await aiTailor(input);
    } catch (err) {
      console.error("[tailor] AI call failed, using heuristic fallback:", err);
    }
  }
  const base = heuristicTailor(input);
  try {
    const improved = await improveResume(base.tailoredResume, input.jobDescription);
    return {
      ...base,
      tailoredResume: improved.improvedResume,
      changes: [...base.changes, ...improved.changes.slice(0, 2)],
    };
  } catch {
    return base;
  }
}
