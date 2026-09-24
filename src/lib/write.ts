import type { UserProfile } from "./store";
import type { TailorResult } from "./tailor";
import { improveResume } from "./improve";
import type { ResumeStyle } from "./resumeStyle";
import { hasAiProvider } from "./aiClient";
import { buildUserBrief, buildWriteSystem } from "./resumePrompt";
import { generateResume } from "./resumeGeneration";

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
  /** An existing resume to strengthen, when the candidate has one. */
  currentResume?: string;
  /** Posting to aim at, when the candidate picked a target. */
  jobDescription?: string;
}

/** Everything the candidate said, laid out so the model can tell the parts apart. */
function notesBrief(input: WriteResumeInput): string {
  return [
    "Experience:",
    input.experience.trim() || "(none given)",
    "",
    "Projects:",
    input.projects.trim() || "(none given)",
    "",
    "Education:",
    input.education.trim() || "(none given)",
    "",
    "Skills:",
    input.skills.trim() || input.profile?.skills?.join(", ") || "(none given)",
  ].join("\n");
}

async function aiWrite(input: WriteResumeInput): Promise<TailorResult> {
  const style = input.style || "executive";
  const material = [
    input.currentResume?.trim()
      ? `Existing resume (source of truth — keep its real employers, titles, dates and numbers):\n${input.currentResume.trim().slice(0, 20000)}`
      : "",
    `Notes the candidate typed (extra detail to fold in):\n${notesBrief(input)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const startedAt = Date.now();
  const generated = await generateResume(
    buildWriteSystem(style),
    buildUserBrief({
      style,
      name: input.name,
      targetRole: input.targetRole,
      targetCompany: input.targetCompany,
      jobDescription: input.jobDescription,
      candidateMaterial: material,
      profile: input.profile,
      sectionLabel: "Source material:",
    }),
    startedAt,
  );

  return {
    tailoredResume: generated.resume,
    changes: generated.changes,
    addedKeywords: generated.addedKeywords,
    notes: generated.notes,
    engine: "ai",
  };
}

function cleanBlock(value: string): string[] {
  return value
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*·]\s*/, "").trim())
    .filter(Boolean);
}

function asBullets(value: string): string[] {
  const lines = cleanBlock(value);
  const expanded = lines.flatMap((line) =>
    // One long paragraph of notes is common; split it on sentence ends so the
    // draft does not arrive as a single wall of text.
    line.length > 220 ? line.split(/(?<=[.!?])\s+/).filter(Boolean) : [line],
  );
  return expanded.map((line) => `- ${line.charAt(0).toUpperCase()}${line.slice(1)}`);
}

/**
 * The no-provider draft: honest about what it is, built only from what the
 * candidate supplied, and free of the bracketed placeholders that made the old
 * template look unfinished.
 */
function heuristicWrite(input: WriteResumeInput): TailorResult {
  const profile = input.profile;
  const skills = (input.skills || profile?.skills?.join(", ") || "").trim();
  const name = input.name.trim();
  const role = input.targetRole.trim() || "Target Role";
  const style = input.style || "executive";
  const headings: Record<string, string> = {
    summary: style === "classic" ? "PROFESSIONAL PROFILE" : style === "modern" ? "PROFILE" : "SUMMARY",
    skills: style === "classic" ? "AREAS OF EXPERTISE" : style === "modern" ? "CAPABILITIES" : "CORE SKILLS",
    experience: style === "classic" ? "WORK EXPERIENCE" : style === "modern" ? "IMPACT & EXPERIENCE" : "EXPERIENCE",
    projects: style === "modern" ? "SELECTED WORK" : "PROJECTS",
  };

  const sections: string[] = [];
  if (name) sections.push(name.toUpperCase());

  const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
  const years = profile?.yearsExperience != null ? `${profile.yearsExperience}+ years` : "";
  const location = profile?.location?.trim();
  sections.push(
    `${headings.summary}\n${[role, years, location ? `based in ${location}` : ""].filter(Boolean).join(" · ")}. ` +
      `Experience across ${skillList.slice(0, 4).join(", ") || "the skills listed below"}. ` +
      "Draft built from your own notes — tighten each line and add the numbers only you can supply.",
  );

  if (skillList.length) sections.push(`${headings.skills}\n${skillList.join(" · ")}`);

  const experience = input.experience.trim() || input.currentResume?.trim() || "";
  if (experience) sections.push(`${headings.experience}\n${asBullets(experience).join("\n")}`);

  if (input.projects.trim()) sections.push(`${headings.projects}\n${asBullets(input.projects).join("\n")}`);

  const education = input.education.trim();
  if (education) sections.push(`EDUCATION\n${cleanBlock(education).join("\n")}`);

  return {
    tailoredResume: sections.join("\n\n"),
    changes: [
      `Structured your notes into a ${role} resume.`,
      "Kept every fact as you wrote it — nothing was added.",
      skillList.length ? `Listed the skills you supplied (${skillList.slice(0, 6).join(", ")}).` : "No skills were supplied.",
    ],
    addedKeywords: skillList.slice(0, 8),
    notes:
      "No AI provider is configured on this deployment (AI_API_KEY), so this is the built-in draft, not a rewrite. Add a key in Settings or the host's environment variables for the full writer.",
    engine: "heuristic",
  };
}

export async function writeResume(input: WriteResumeInput): Promise<TailorResult> {
  if (hasAiProvider()) {
    try {
      return await aiWrite(input);
    } catch (err) {
      console.error("[write-resume] AI call failed, using the built-in draft:", err);
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
