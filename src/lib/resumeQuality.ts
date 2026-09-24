import { BANNED_PHRASES } from "./keywords";

/**
 * Models drift back toward resume cliches no matter how the prompt is worded.
 * The linter finds those drift marks in the returned draft, and the formatter
 * normalises the plain-text shape the rest of the app expects.
 */

export interface DraftIssue {
  rule: string;
  detail: string;
}

/** A trailing ", -ing …" clause that restates the bullet instead of adding a fact. */
const TAIL_CLAUSE =
  /,\s+(?:and\s+)?(?:enabling|ensuring|improving|fostering|streamlining|enhancing|allowing|helping|driving|supporting|facilitating|contributing to|leading to|resulting in|showcasing|demonstrating|automating|reducing|increasing|expanding|delivering|building|creating|managing|developing)\b/i;

/**
 * The general shape behind all of those verbs: a bullet that ends in ", <verb>ing
 * …". The list above catches the common ones anywhere in the line; this catches
 * the rest at the end, where a fact should be instead.
 */
const TRAILING_GERUND = /,\s+(?:and\s+)?[a-z]+ing\b[^.!?]*[.!?]?$/i;

const PLACEHOLDER =
  /\[(?:your name|name|city,?\s*state|city|state|email|e-mail|phone|linkedin|github|website|company|employer|date|dates|month year|year|n\/a|xxx+)\]/i;

const WEAK_OPENING =
  /^[-•*]?\s*(?:helped|worked on|responsible for|assisted|involved in|participated in|handled|tasked with|duties included)\b/i;

const KNOWN_HEADINGS = [
  "SUMMARY",
  "PROFILE",
  "TARGETED PROFILE",
  "PROFESSIONAL PROFILE",
  "OBJECTIVE",
  "CORE SKILLS",
  "CORE COMPETENCIES",
  "AREAS OF EXPERTISE",
  "CAPABILITIES",
  "TECHNICAL SKILLS",
  "SKILLS",
  "EXPERIENCE",
  "PROFESSIONAL EXPERIENCE",
  "WORK EXPERIENCE",
  "IMPACT & EXPERIENCE",
  "SELECTED WORK",
  "PROJECTS",
  "SELECTED PROJECTS",
  "EDUCATION",
  "CERTIFICATIONS",
  "INTERNSHIPS",
  "AWARDS",
  "VOLUNTEER",
];

/**
 * True when a bullet ends on a decorative ", -ing …" clause instead of a fact.
 * The audit uses this too, so pasted resumes get the same criticism.
 */
export function hasDecorativeTail(bullet: string): boolean {
  const match = TRAILING_GERUND.exec(bullet.trim().replace(/^[-•*·]\s+/, ""));
  if (!match) return false;
  return !/\d/.test(match[0]);
}

function bulletLines(text: string): string[] {
  return text
    .split(/\n+/)
    .filter((line) => /^\s*[-•*·]\s+/.test(line))
    .map((line) => line.replace(/^\s*[-•*·]\s+/, "").trim());
}

function firstOpener(bullet: string): string {
  return (bullet.split(/\s+/)[0] ?? "").toLowerCase().replace(/[^a-z]/g, "");
}

/** Everything one draft can be pulled up on, in the order a reader would notice. */
export function lintResume(text: string): DraftIssue[] {
  const issues: DraftIssue[] = [];
  const lines = text.split("\n");

  for (const phrase of BANNED_PHRASES) {
    const pattern = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    const line = lines.find((candidate) => pattern.test(candidate));
    if (line) {
      issues.push({ rule: "banned phrase", detail: `"${phrase}" appears in: ${line.trim().slice(0, 120)}` });
    }
  }

  for (const line of lines) {
    const isBullet = /^\s*[-•*·]\s+/.test(line);
    if (TAIL_CLAUSE.test(line) || (isBullet && hasDecorativeTail(line))) {
      issues.push({ rule: "trailing -ing clause", detail: line.trim().slice(0, 140) });
    }
  }

  for (const line of lines) {
    if (PLACEHOLDER.test(line)) {
      issues.push({ rule: "placeholder left in", detail: line.trim().slice(0, 100) });
    }
  }

  for (const line of lines) {
    if (WEAK_OPENING.test(line.trim())) {
      issues.push({ rule: "weak bullet opener", detail: line.trim().slice(0, 120) });
    }
  }

  const bullets = bulletLines(text);
  const openers = new Map<string, number>();
  for (const bullet of bullets) {
    const opener = firstOpener(bullet);
    if (opener) openers.set(opener, (openers.get(opener) ?? 0) + 1);
  }
  for (const [opener, count] of openers) {
    if (count > 1) {
      issues.push({ rule: "repeated verb", detail: `"${opener}" opens ${count} bullets` });
    }
  }

  for (const bullet of bullets) {
    const words = bullet.split(/\s+/).length;
    if (words > 34) issues.push({ rule: "bullet too long", detail: `${words} words: ${bullet.slice(0, 100)}` });
  }

  if (/\*\*|_{2}|`/.test(text)) {
    issues.push({ rule: "markdown in a plain-text resume", detail: "**bold**, __underline__ or backticks found" });
  }

  return issues.slice(0, 12);
}

/** Normalises the plain-text resume shape: bullets, headings, spacing, no placeholders. */
export function formatResume(text: string): string {
  const withoutFences = text
    .replace(/\r\n?/g, "\n")
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/^\s*[-=]{3,}\s*$/gm, "");

  const cleaned = withoutFences
    .split("\n")
    .map((rawLine) => {
      let line = rawLine.replace(/[ \t]+$/, "").replace(/\*\*/g, "").replace(/__/g, "").replace(/`/g, "");
      // Bullets arrive as anything from "•" to "– " depending on the model.
      line = line.replace(/^(\s*)[•▪◦·*–]\s+/, "$1- ");
      line = line.replace(/^(\s*)\*\s+/, "$1- ");
      line = line.replace(/\t/g, " ");
      line = line.replace(/^\s*#+\s*/, "");

      const heading = KNOWN_HEADINGS.find((name) => line.trim().toUpperCase() === name);
      if (heading) return heading;

      if (PLACEHOLDER.test(line)) {
        // Drop the placeholder segment; keep whatever real content shares the line.
        line = line
          .replace(new RegExp(PLACEHOLDER.source, "gi"), "")
          .replace(/[|·•]\s*(?=[|·•])/g, "")
          .replace(/^[\s|·•,\-]+|[\s|·•,\-]+$/g, "")
          .replace(/\s{2,}/g, " ");
      }
      return line;
    })
    .join("\n");

  return cleaned.replace(/\n{3,}/g, "\n\n").replace(/^\n+|\n+$/g, "");
}

/** Violations worth one repair pass: the cheap lint, without the nitpicks. */
export function seriousIssues(issues: DraftIssue[]): DraftIssue[] {
  const seriousRules = new Set(["banned phrase", "trailing -ing clause", "placeholder left in", "weak bullet opener"]);
  return issues.filter((issue) => seriousRules.has(issue.rule));
}

export function describeIssues(issues: DraftIssue[]): string[] {
  return issues.map((issue) => `${issue.rule} — ${issue.detail}`);
}
