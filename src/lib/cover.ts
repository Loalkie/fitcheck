import type { UserProfile } from "./store";
import { aiChat, hasAiProvider } from "./aiClient";

export interface CoverInput {
  jobDescription: string;
  resumeText: string;
  company?: string;
  role?: string;
  profile?: UserProfile | null;
}

const AI_PROMPT = `You are a professional US cover-letter writer. Write a concise, sincere 3-paragraph cover letter (180-260 words) for the job described below.

Rules:
- Use the candidate's real background only. Never invent skills, companies, or numbers.
- Reference 2-3 specific requirements from the job description that the candidate can actually support.
- Keep a warm but professional tone. No clichés like "I am writing to express my interest".
- Return ONLY the cover letter text, no preamble, no sign-off block beyond "Sincerely,\n[Your name]".
- If you don't know the candidate's name, use "[Your name]".`;

async function aiCover(input: CoverInput): Promise<string> {
  const user = `Job: ${input.role || "the role"}${input.company ? ` at ${input.company}` : ""}\n\nJob description:\n"""\n${input.jobDescription.trim().slice(0, 8000)}\n"""\n\nCandidate resume:\n"""\n${input.resumeText.trim().slice(0, 8000)}\n"""\n\nCandidate background (if any):\n${JSON.stringify(input.profile ?? {})}`;

  return aiChat({
    system: AI_PROMPT,
    user,
    temperature: 0.7,
  });
}

function pickKeywords(jd: string, words: string[]): string[] {
  const lower = jd.toLowerCase();
  return words.filter((w) => lower.includes(w.toLowerCase())).slice(0, 3);
}

function heuristicCover(input: CoverInput): string {
  const p = input.profile;
  const role = input.role || "this role";
  const company = input.company || "your company";
  const years = p?.yearsExperience != null ? `${p.yearsExperience} year${p.yearsExperience === 1 ? "" : "s"}` : "relevant";
  const skills = (p?.skills ?? []).slice(0, 6);
  const matched = pickKeywords(input.jobDescription, skills.length ? skills : ["Python", "JavaScript", "SQL", "Leadership"]);
  const skillLine = matched.length ? `I bring hands-on experience with ${matched.join(", ")}.` : `I bring the skills and experience this role requires.`;
  const edu = p?.educationLevel ? ` I hold a ${p.educationLevel}${p.fieldOfStudy ? ` in ${p.fieldOfStudy}` : ""}.` : "";

  return `Dear Hiring Manager,

I'm excited to apply for the ${role} position${company === "your company" ? "" : ` at ${company}`}. With ${years} of experience, I've focused on delivering measurable results — and this role aligns directly with the work I do best.

${skillLine} In my most recent work, I've taken ownership end to end: scoping the problem, building and shipping the solution, and measuring the outcome. I'm equally comfortable working independently and collaborating across teams.

I'd love to bring this to ${company}. Thank you for your time and consideration — I'm happy to share more detail on any of the above.

Sincerely,
[Your name]`;
}

export async function generateCoverLetter(input: CoverInput): Promise<string> {
  if (hasAiProvider()) {
    try {
      return await aiCover(input);
    } catch (err) {
      console.error("[cover] AI call failed, using template:", err);
    }
  }
  return heuristicCover(input);
}
