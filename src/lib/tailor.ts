import type { UserProfile } from "./store";
import { improveResume } from "./improve";
import type { ResumeStyle } from "./resumeStyle";
import { hasAiProvider } from "./aiClient";
import { analyseKeywords } from "./keywords";
import { buildTailorSystem, buildUserBrief } from "./resumePrompt";
import { generateResume } from "./resumeGeneration";
import { keywordGapNote, manualPassNote } from "./resumeQuality";

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

async function aiTailor(input: TailorInput): Promise<TailorResult> {
  const style = input.style || "executive";
  const generated = await generateResume(
    buildTailorSystem(style),
    buildUserBrief({
      style,
      targetRole: input.role,
      targetCompany: input.company,
      jobDescription: input.jobDescription,
      candidateMaterial: input.resumeText.trim().slice(0, 20000),
      profile: input.profile,
      sectionLabel: "Current resume (source of truth):",
    }),
    Date.now(),
  );

  const { missing } = analyseKeywords(input.jobDescription, input.resumeText);
  const notes = [
    generated.notes,
    keywordGapNote(missing, generated.notes),
    manualPassNote(generated.remainingIssues),
  ]
    .filter(Boolean)
    .join(" ");

  return {
    tailoredResume: generated.resume,
    changes: generated.changes,
    addedKeywords: generated.addedKeywords.length ? generated.addedKeywords : analyseKeywords(input.jobDescription, input.resumeText).shared,
    notes,
    engine: "ai",
  };
}

const SECTION_PATTERN =
  /^(summary|profile|objective|skills|core skills|technical skills|experience|work experience|professional experience|employment|projects?|education|internships?|certifications?|awards?)$/i;

/**
 * Without an AI provider this cannot rewrite anything honestly, so it does the
 * two things a script can do: keep the candidate's own resume intact and show
 * which posting terms it already covers. No invented prose, no placeholders.
 */
function heuristicTailor(input: TailorInput): TailorResult {
  const profile = input.profile;
  const role = input.role?.trim() || "the target role";
  const style = input.style || "executive";
  const resumeText = input.resumeText.replace(/\r\n?/g, "\n").trim();
  const lines = resumeText.split("\n");
  const firstContentLine = lines.find((line) => line.trim().length > 0)?.trim() ?? "";
  const looksLikeName =
    firstContentLine.length > 1 &&
    firstContentLine.length < 48 &&
    firstContentLine.split(/\s+/).length <= 5 &&
    !/[·|@\d]|http/i.test(firstContentLine) &&
    firstContentLine === firstContentLine.toUpperCase();
  const nameLine = looksLikeName ? firstContentLine : "";
  const body = looksLikeName ? lines.slice(lines.indexOf(firstContentLine) + 1).join("\n").trim() : resumeText;

  const lowerResume = resumeText.toLowerCase();
  const ownedSkills = (profile?.skills ?? []).filter((skill) => lowerResume.includes(skill.toLowerCase()));
  const { shared, missing } = analyseKeywords(input.jobDescription, resumeText);
  const proof = (ownedSkills.length ? ownedSkills : shared).slice(0, 6);
  const years = profile?.yearsExperience != null ? `${profile.yearsExperience}+ years of experience.` : "";
  const hasSkillsSection = lines.some((line) => /^(core skills|technical skills|skills|areas of expertise|capabilities)$/i.test(line.trim()));

  const sections: string[] = [];
  if (nameLine) sections.push(nameLine);
  sections.push(
    `${style === "classic" ? "PROFESSIONAL PROFILE" : style === "ats" ? "SUMMARY" : "TARGETED PROFILE"}\n` +
      [`Focused on ${role}.`, years, proof.length ? `Working strengths shown in the resume: ${proof.join(", ")}.` : ""]
        .filter(Boolean)
        .join(" "),
  );
  if (proof.length && !hasSkillsSection) {
    sections.push(`${style === "classic" ? "AREAS OF EXPERTISE" : style === "ats" ? "CORE SKILLS" : "CORE COMPETENCIES"}\n${proof.join(" · ")}`);
  }
  if (body) sections.push(body);

  return {
    tailoredResume: sections.join("\n\n"),
    changes: [
      `Kept your resume exactly as written and aimed the framing at ${role}.`,
      shared.length
        ? `This posting already overlaps with your resume on: ${shared.slice(0, 6).join(", ")}.`
        : "No shared vocabulary was found between the posting and your resume — add the terms you can honestly claim.",
      proof.length ? "Surfaced the skills your resume already demonstrates." : "Left the skills section as you wrote it.",
    ],
    addedKeywords: shared.slice(0, 8),
    notes: [
      "No AI provider is configured on this deployment (AI_API_KEY), so nothing was rewritten — this is your own text with a target line on top.",
      missing.length ? `The posting also asks for ${missing.slice(0, 5).join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
    engine: "heuristic",
  };
}

export async function tailorResume(input: TailorInput): Promise<TailorResult> {
  if (hasAiProvider()) {
    try {
      return await aiTailor(input);
    } catch (err) {
      console.error("[tailor] AI call failed, using the built-in draft:", err);
    }
  }
  const base = heuristicTailor(input);
  try {
    const improved = await improveResume(base.tailoredResume, `${input.role ?? ""} ${input.company ?? ""}`);
    return {
      ...base,
      tailoredResume: improved.improvedResume,
      changes: [...base.changes, ...improved.changes.slice(0, 2)],
    };
  } catch {
    return base;
  }
}
