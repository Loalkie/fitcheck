import type { UserProfile } from "./store";
import type { TailorResult } from "./tailor";
import { improveResume } from "./improve";
import type { ResumeStyle } from "./resumeStyle";
import { aiChat, hasAiProvider } from "./aiClient";

export interface WriteResumeInput {
  name: string;
  targetRole: string;
  targetCompany?: string;
  experience: string;
  projects: string;
  education: string;
  skills: string;
  profile?: UserProfile | null;
  style?: ResumeStyle;
}

const SYSTEM_PROMPT = `You are an executive US resume writer. Build a polished, ATS-friendly, senior-level resume from the candidate's raw notes.

Rules:
- Use only the facts provided. Never invent employers, titles, degrees, dates, metrics, or skills.
- If a section is empty, omit it rather than guessing.
- Turn rough notes into concise, outcome-oriented bullets: what was done, how, and the result when stated.
- Use a confident, experienced tone. Avoid student-like phrasing such as "looking for an opportunity", "eager to learn", or "helped with".
- Lead bullets with strong action verbs and emphasize ownership, scope, and business impact.
- Never include the target company name in the resume. Tailor the resume to the role and industry, but keep it employer-agnostic.
- Use standard sections in this order: Summary, Core Skills, Experience, Projects, Education.
- Return a single JSON object with exactly these fields:
{
  "tailoredResume": string,
  "changes": string[],
  "addedKeywords": string[],
  "notes": string
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

async function aiWrite(input: WriteResumeInput): Promise<TailorResult> {
  const user = [
    `Name: ${input.name || "Candidate"}`,
    `Target role: ${input.targetRole || "the target role"}`,
    `Resume style: ${input.style || "executive"}`,
    input.targetCompany ? `Target company: ${input.targetCompany}` : "",
    "",
    "Profile:",
    JSON.stringify(input.profile ?? {}),
    "",
    "Experience notes:",
    input.experience || "(none)",
    "",
    "Project notes:",
    input.projects || "(none)",
    "",
    "Education:",
    input.education || "(none)",
    "",
    "Skills:",
    input.skills || "(none)",
  ]
    .filter(Boolean)
    .join("\n");

  const content = await aiChat({
    system: SYSTEM_PROMPT,
    user,
    temperature: 0.3,
    json: true,
  });
  const raw = parseJsonObject(content);
  const tailoredResume = typeof raw.tailoredResume === "string" ? raw.tailoredResume.trim() : "";
  if (tailoredResume.length < 60) throw new Error("Model returned an incomplete resume");
  return {
    tailoredResume,
    changes: asStringArray(raw.changes),
    addedKeywords: asStringArray(raw.addedKeywords),
    notes: typeof raw.notes === "string" ? raw.notes.trim() : "",
    engine: "ai",
  };
}

function cleanBlock(value: string): string[] {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function heuristicWrite(input: WriteResumeInput): TailorResult {
  const p = input.profile;
  const skills = (input.skills || p?.skills?.join(", ") || "").trim();
  const name = input.name.trim() || "[Your name]";
  const role = input.targetRole.trim() || "Target Role";
  const style = input.style || "executive";
  const sections: string[] = [];

  sections.push(name);
  sections.push("[City, State] · [email] · [LinkedIn]\n");
  sections.push(style === "classic" ? "PROFESSIONAL PROFILE" : style === "ats" ? "SUMMARY" : style === "modern" ? "PROFILE" : "SUMMARY");
  sections.push(
    `${role} with ${p?.yearsExperience != null ? `${p.yearsExperience}+ years` : "proven"} experience delivering measurable business outcomes. Strong background in ${skills ? skills.split(",").slice(0, 4).join(", ") : "product development, stakeholder alignment, and technical delivery"}. Adept at turning ambiguous requirements into shipped, evaluated results.`,
  );

  if (skills) {
    sections.push(`\n${style === "classic" ? "AREAS OF EXPERTISE" : style === "modern" ? "CAPABILITIES" : style === "ats" ? "CORE SKILLS" : "CORE COMPETENCIES"}`);
    sections.push(skills.split(",").map((s) => s.trim()).filter(Boolean).join(" · "));
  }

  if (input.experience.trim()) {
    sections.push(`\n${style === "classic" ? "WORK EXPERIENCE" : style === "modern" ? "IMPACT & EXPERIENCE" : style === "ats" ? "EXPERIENCE" : "PROFESSIONAL EXPERIENCE"}`);
    sections.push(cleanBlock(input.experience).map((line) => (line.startsWith("-") ? line : `- ${line}`)).join("\n"));
  }

  if (input.projects.trim()) {
    sections.push(`\n${style === "classic" ? "PROJECTS" : style === "modern" ? "SELECTED WORK" : style === "ats" ? "PROJECTS" : "SELECTED PROJECTS"}`);
    sections.push(cleanBlock(input.projects).map((line) => (line.startsWith("-") ? line : `- ${line}`)).join("\n"));
  }

  const edu =
    input.education.trim() ||
    [p?.educationLevel, p?.fieldOfStudy ? ` in ${p.fieldOfStudy}` : "", p?.school ? ` · ${p.school}` : "", p?.gradYear ? ` · ${p.gradYear}` : ""]
      .filter(Boolean)
      .join(" ");
  if (edu) {
    sections.push("\nEDUCATION");
    sections.push(edu);
  }

  if (p?.internships?.length) {
    sections.push("\nINTERNSHIPS");
    sections.push(p.internships.map((i) => `- ${i}`).join("\n"));
  }

  return {
    tailoredResume: sections.join("\n"),
    changes: [
      `Built a clean ${role} resume from the notes provided.`,
      "Created a scannable Summary and Skills section.",
      input.experience.trim() ? "Turned rough experience notes into a bullet-style section." : "No experience provided — add your most relevant roles.",
      "Kept education and internships separate for ATS readability.",
    ],
    addedKeywords: skills ? skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8) : [],
    notes: "Heuristic draft — replace placeholders and verify every claim before applying.",
    engine: "heuristic",
  };
}

export async function writeResume(input: WriteResumeInput): Promise<TailorResult> {
  if (hasAiProvider()) {
    try {
      return await aiWrite(input);
    } catch (err) {
      console.error("[write-resume] AI call failed, using heuristic fallback:", err);
    }
  }
  const base = heuristicWrite(input);
  try {
    const improved = await improveResume(base.tailoredResume, `${input.targetRole} ${input.targetCompany ?? ""}`);
    return {
      ...base,
      tailoredResume: improved.improvedResume,
      changes: [...base.changes, ...improved.changes.slice(0, 2)],
    };
  } catch {
    return base;
  }
}
