import { aiChat, hasAiProvider } from "./aiClient";
import { BANNED_PHRASES } from "./keywords";
import { formatResume } from "./resumeQuality";

/**
 * The polish pass: same rules the writer follows, applied to text that already
 * exists — including text pasted in from somewhere else.
 */

const REPLACEMENTS: [RegExp, string][] = [
  [/\bhelped build\b/gi, "Built"],
  [/\bhelped create\b/gi, "Created"],
  [/\bhelped design\b/gi, "Designed"],
  [/\bhelped develop\b/gi, "Developed"],
  [/\bhelped launch\b/gi, "Launched"],
  [/\bhelped ship\b/gi, "Shipped"],
  [/\bhelped (?:with|in)\s+/gi, "Delivered "],
  [/\bworked on\b/gi, "Built"],
  [/\bwas responsible for\b/gi, "Owned"],
  [/\bresponsible for\b/gi, "Owned"],
  [/\bwas tasked with\b/gi, "Owned"],
  [/\bduties included\b/gi, "Owned"],
  [/\binvolved in\b/gi, "Delivered"],
  [/\bparticipated in\b/gi, "Contributed to"],
  [/\bassisted (?:with|in)?\s*/gi, "Supported "],
  [/\bhandled\b/gi, "Managed"],
  [/\butiliz(?:e|ed|ing)\b/gi, "used"],
  [/\bleverag(?:e|ed|ing)\b/gi, "applied"],
  [/\bspearheaded\b/gi, "Led"],
  [/\bvery\s+/gi, ""],
  [/\breally\s+/gi, ""],
  [/\betc\.?/gi, ""],
];

/** A tail clause with no number in it is decoration, not a result. */
const FACT_FREE_TAIL =
  /,\s+(?:enabling|ensuring|improving|fostering|streamlining|enhancing|allowing|helping|driving|supporting|facilitating|contributing to|showcasing|demonstrating)\b[^.!?\d]*$/i;

function improveLine(line: string): string {
  const marker = /^\s*[-•*·]\s+/.exec(line)?.[0] ?? "";
  if (!marker) return line;
  let result = line.slice(marker.length).trim();
  for (const [pattern, replacement] of REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  result = result.replace(FACT_FREE_TAIL, "").replace(/ {2,}/g, " ").trim();
  result = result.replace(/[;,]\s*$/, "");
  const cased = result.charAt(0).toUpperCase() + result.slice(1);
  return `- ${cased}`;
}

export interface ImproveResult {
  improvedResume: string;
  changes: string[];
}

function heuristicImprove(resumeText: string): ImproveResult {
  const lines = resumeText.replace(/\r\n?/g, "\n").split("\n");
  const improved = lines.map((line) => (/(^|\s)[-•*·]\s+/.test(line) ? improveLine(line) : line));
  return {
    improvedResume: formatResume(improved.join("\n")),
    changes: [
      "Replaced weak openers (helped, worked on, responsible for) with strong verbs.",
      "Removed filler words and decorative trailing clauses.",
      "Kept every fact unchanged — no numbers or claims were invented.",
    ],
  };
}

async function aiImprove(resumeText: string, jobDescription: string): Promise<ImproveResult> {
  const system = `You are a ruthless ATS resume editor working on a resume the candidate already wrote.

Rules:
- Never invent employers, titles, dates, numbers, tools, or skills, and never make a role sound more senior.
- Open every bullet with a distinct strong past-tense verb; never reuse an opener inside the same role.
- Bullet shape: [verb] + [what] + [how] + [result the source already states]. One line, 14-28 words.
- Delete decoration and any trailing ", -ing …" clause that adds no fact. If the clause carries a number or a real result, keep it as part of the bullet instead.
- Banned words: ${BANNED_PHRASES.join(", ")}.
- Keep the candidate's own section order, headings, employers, titles, and dates exactly as written, and keep placeholders out of the text.
- Return JSON only: {"improvedResume": string, "changes": string[]} where changes lists 3-6 concrete edits.`;

  const user = `Job description:\n"""\n${jobDescription.trim().slice(0, 8000)}\n"""\n\nResume:\n"""\n${resumeText.trim().slice(0, 16000)}\n"""`;

  const content = await aiChat({ system, user, temperature: 0.25, json: true, maxTokens: 4096 });
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(content) as Record<string, unknown>;
  } catch {
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
    raw = JSON.parse(fenced?.[1] ?? content) as Record<string, unknown>;
  }
  const improvedResume = typeof raw.improvedResume === "string" ? formatResume(raw.improvedResume) : "";
  if (improvedResume.length < 40) throw new Error("Model returned an incomplete resume");
  return {
    improvedResume,
    changes: Array.isArray(raw.changes)
      ? raw.changes.filter((v): v is string => typeof v === "string").map((v) => v.trim())
      : [],
  };
}

export async function improveResume(resumeText: string, jobDescription = ""): Promise<ImproveResult> {
  if (hasAiProvider()) {
    try {
      return await aiImprove(resumeText, jobDescription);
    } catch (err) {
      console.error("[improve] AI call failed, using heuristic fallback:", err);
    }
  }
  return heuristicImprove(resumeText);
}
