import { aiChat, hasAiProvider } from "./aiClient";

const PHRASES: [RegExp, string][] = [
  [/\bhelped build\b/gi, "Built"],
  [/\bhelped create\b/gi, "Created"],
  [/\bhelped design\b/gi, "Designed"],
  [/\bhelped develop\b/gi, "Developed"],
  [/\bhelped launch\b/gi, "Launched"],
  [/\bhelped ship\b/gi, "Shipped"],
  [/\bhelped (?:with|in)\s+/gi, "Delivered "],
  [/\bworked on\b/gi, "Built"],
  [/\bresponsible for\b/gi, "Owned"],
  [/\binvolved in\b/gi, "Delivered"],
  [/\bassisted (?:with|in)?\s+/gi, "Supported "],
  [/\bparticipated in\b/gi, "Contributed to"],
  [/\bhandled\b/gi, "Managed"],
  [/\bdid\b/gi, "Completed"],
  [/\bwas responsible for\b/gi, "Owned"],
  [/\bvery\s+/gi, ""],
  [/\breally\s+/gi, ""],
  [/\betc\.?/gi, ""],
];

function improveLine(line: string): string {
  let result = line.trim();
  if (result.startsWith("-") || result.startsWith("•") || result.startsWith("*")) {
    const marker = result[0];
    result = result.slice(1).trim();
    for (const [pattern, replacement] of PHRASES) {
      result = result.replace(pattern, replacement);
    }
    result = result.replace(/ {2,}/g, " ").trim();
    const first = result.charAt(0).toUpperCase() + result.slice(1);
    return `${marker} ${first}`;
  }
  return line;
}

export interface ImproveResult {
  improvedResume: string;
  changes: string[];
}

function heuristicImprove(resumeText: string): ImproveResult {
  const lines = resumeText.replace(/\r\n/g, "\n").split("\n");
  const improved = lines.map((line) => (line.startsWith("-") || line.startsWith("•") || line.startsWith("*") ? improveLine(line) : line));
  return {
    improvedResume: improved.join("\n"),
    changes: [
      "Replaced weak verbs with strong action verbs on bullet lines.",
      "Removed filler words such as very, really, and etc.",
      "Kept every fact unchanged — no numbers or claims were invented.",
    ],
  };
}

async function aiImprove(resumeText: string, jobDescription: string): Promise<ImproveResult> {
  const system = `You are an expert ATS resume editor. Rewrite the weak or vague parts of the resume only.
Rules:
- Never invent employers, titles, degrees, dates, numbers, or skills.
- Strengthen action verbs, remove filler, and tighten wording.
- If a bullet has no measurable result, do NOT invent one; leave the fact unchanged.
- Return JSON: {"improvedResume": string, "changes": string[]}`;

  const user = `Job description:\n"""\n${jobDescription.trim().slice(0, 8000)}\n"""\n\nResume:\n"""\n${resumeText.trim().slice(0, 16000)}\n"""`;

  const content = await aiChat({
    system,
    user,
    temperature: 0.2,
    json: true,
  });
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(content) as Record<string, unknown>;
  } catch {
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
    raw = JSON.parse(fenced?.[1] ?? content) as Record<string, unknown>;
  }
  const improvedResume = typeof raw.improvedResume === "string" ? raw.improvedResume.trim() : "";
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
