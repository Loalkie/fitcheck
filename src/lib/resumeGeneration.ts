import { aiChat } from "./aiClient";
import { REPAIR_SYSTEM, buildRepairUser } from "./resumePrompt";
import { describeIssues, formatResume, lintResume, seriousIssues, type DraftIssue } from "./resumeQuality";

export interface GeneratedResume {
  resume: string;
  changes: string[];
  addedKeywords: string[];
  notes: string;
  /** What the linter still found after the repair pass, for logging and notes. */
  remainingIssues: DraftIssue[];
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

function parseJsonObject(content: string): Record<string, unknown> | null {
  const trimmed = content.trim();
  const candidates = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1]);
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) candidates.push(trimmed.slice(firstBrace, lastBrace + 1));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
      // try the next shape
    }
  }
  return null;
}

const JSON_RETRY_HINT =
  "Your previous reply could not be parsed. Reply with the JSON object only — no markdown fence, no commentary before or after it, and no trailing comma.";

/** One retry, because a truncated or fenced reply is a formatting slip, not a bad answer. */
async function chatJson(system: string, user: string): Promise<Record<string, unknown>> {
  const first = await aiChat({ system, user, temperature: 0.35, json: true, maxTokens: 4096 });
  const parsed = parseJsonObject(first);
  if (parsed) return parsed;

  const second = await aiChat({
    system,
    user: `${user}\n\n${JSON_RETRY_HINT}`,
    temperature: 0.2,
    json: true,
    maxTokens: 4096,
  });
  const retried = parseJsonObject(second);
  if (retried) return retried;
  throw new Error("Model returned invalid JSON twice");
}

async function repairDraft(draft: string, issues: DraftIssue[]): Promise<string | null> {
  try {
    const raw = await aiChat({
      system: REPAIR_SYSTEM,
      user: buildRepairUser(draft, describeIssues(issues)),
      temperature: 0.2,
      json: true,
      maxTokens: 4096,
    });
    const parsed = parseJsonObject(raw);
    const repaired = typeof parsed?.resume === "string" ? parsed.resume.trim() : "";
    if (repaired.length < draft.length * 0.55) return null;
    return formatResume(repaired);
  } catch (err) {
    console.error("[resume] repair pass failed, keeping the draft:", err);
    return null;
  }
}

/**
 * Generates a resume, then cleans it up: the model output is normalised, linted
 * for the cliches that make a resume read as machine-written, and repaired once
 * when the draft trips those rules. The repair is skipped when the first call
 * already ate the time budget, so a slow provider still returns a draft.
 */
export async function generateResume(system: string, user: string, startedAt = Date.now()): Promise<GeneratedResume> {
  const raw = await chatJson(system, user);
  let resume = formatResume(typeof raw.tailoredResume === "string" ? raw.tailoredResume : "");
  if (resume.length < 120) throw new Error("Model returned an incomplete resume");

  let issues = lintResume(resume);
  const serious = seriousIssues(issues);
  const withinBudget = Date.now() - startedAt < 20_000;
  if (serious.length >= 2 && withinBudget) {
    const repaired = await repairDraft(resume, serious);
    if (repaired && repaired.length >= 120) {
      resume = repaired;
      issues = lintResume(resume);
    }
  }

  const notes = typeof raw.notes === "string" ? raw.notes.trim() : "";
  return {
    resume,
    changes: asStringArray(raw.changes),
    addedKeywords: asStringArray(raw.addedKeywords),
    notes,
    remainingIssues: issues,
  };
}
