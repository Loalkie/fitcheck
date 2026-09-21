import type { AnalysisResult, AnalyzeInput, KeywordMatch, ResumeOptimization, RiskItem } from "./types";
import { aiChat } from "./aiClient";

const SYSTEM_PROMPT = `You are a senior US technical recruiter and resume analyst using DeepSeek. Compare the candidate's resume against the job description and produce an honest, evidence-based fit report.

Rules:
- Score strictly using this weighted rubric:
  - Skill match: 40%
  - Experience relevance: 30%
  - Education / hard requirements: 15%
  - Keyword coverage: 15%
- Be accurate and specific. Only claim a skill is "matched" when the resume shows real evidence (a project, job duty, tool, or concrete result). Never inflate.
- Treat a missing keyword as a capability OR wording gap, never instruct candidates to fabricate experience.
- Compare the original resume against the target JD and find specific sentences that can be reworded more
  strongly. Put each one into "optimizations" with its section, before/after text, and the reason. Only
  improve what already exists in the resume; never invent facts, metrics, or experience.
- Do NOT infer or mention protected characteristics (age, race, gender, disability, veteran status, national origin, religion, family status). Never include them in the output.
- Do not invent any experience that is not in the resume. Only rephrase, reorder, or highlight what already exists.
- Scores are advisory reference only, not a hiring decision.
- Respond with a single JSON object only, matching the schema exactly. No markdown fences, no commentary outside the JSON.`;

const JSON_SCHEMA = `{
  "score": number,
  "match_level": "Strong" | "Moderate" | "Weak",
  "missing_skills": string[],
  "matched_skills": string[],
  "experience_gap": string,
  "optimizations": [
    {
      "section": "工作经历 - 字节跳动",
      "before": "负责提升了系统性能",
      "after": "通过引入 Redis 缓存，将接口响应时间降低了 40%",
      "reason": "缺少量化成果，建议补充具体数字"
    }
  ]
}`;

function buildUserPrompt(input: AnalyzeInput): string {
  return `Job description:\n"""\n${input.jobDescription.trim()}\n"""\n\nResume:\n"""\n${input.resumeText.trim().slice(0, 20000)}\n"""\n\nReturn ONLY a JSON object matching this schema exactly:\n${JSON_SCHEMA}`;
}

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());
}

function asKeywordArray(value: unknown): KeywordMatch[] {
  if (!Array.isArray(value)) return [];
  const out: KeywordMatch[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const term = typeof obj.term === "string" ? obj.term.trim() : "";
    if (!term) continue;
    const level: KeywordMatch["level"] =
      obj.level === "must-have" ? "must-have" : "nice-to-have";
    const evidence = typeof obj.evidence === "string" ? obj.evidence.trim() : undefined;
    out.push(evidence ? { term, level, evidence } : { term, level });
  }
  return out;
}

function asRiskArray(value: unknown): RiskItem[] {
  if (!Array.isArray(value)) return [];
  const out: RiskItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const title = typeof obj.title === "string" ? obj.title.trim() : "";
    if (!title) continue;
    const severity: RiskItem["severity"] =
      obj.severity === "high" || obj.severity === "medium" ? obj.severity : "low";
    const detail = typeof obj.detail === "string" ? obj.detail.trim() : "";
    out.push({ severity, title, detail });
  }
  return out;
}

function asOptimizations(value: unknown): ResumeOptimization[] {
  if (!Array.isArray(value)) return [];
  const out: ResumeOptimization[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const section = typeof obj.section === "string" ? obj.section.trim() : "";
    const before = typeof obj.before === "string" ? obj.before.trim() : "";
    const after = typeof obj.after === "string" ? obj.after.trim() : "";
    const reason = typeof obj.reason === "string" ? obj.reason.trim() : "";
    if (!before && !after && !section) continue;
    out.push({ section, before, after, reason });
  }
  return out;
}

function parseJsonObject(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    // Strip markdown code fences if present.
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

function coerceResult(raw: Record<string, unknown>): AnalysisResult {
  const overall = clampScore(raw.score);
  const skills = clampScore(raw.score);
  const experience = clampScore(raw.score);
  const education = clampScore(raw.score);
  const ats = clampScore(raw.score);
  const matchedSkills = asStringArray(raw.matched_skills);
  const missingSkills = asStringArray(raw.missing_skills);
  const suggestions = asStringArray(raw.actionable_suggestions);
  const optimizations = asOptimizations(raw.optimizations);
  const experienceGap = typeof raw.experience_gap === "string" ? raw.experience_gap.trim() : "";
  const matchLevel = typeof raw.match_level === "string" ? raw.match_level.trim() : "Moderate";

  return {
    overallScore: overall,
    skillsScore: skills,
    experienceScore: experience,
    educationScore: education,
    atsScore: ats,
    matchedKeywords: matchedSkills.map((term) => ({ term, level: "must-have" as const, evidence: "" })),
    unmatchedKeywords: missingSkills.map((term) => ({ term, level: "must-have" as const })),
    strengths: [`Match level: ${matchLevel}`, ...matchedSkills.slice(0, 3).map((s) => `Matched skill: ${s}`)],
    risks: experienceGap ? [{ severity: "medium" as const, title: "Experience gap", detail: experienceGap }] : [],
    suggestions,
    optimizations,
    candidateProfile: {
      summary: matchLevel,
      education: [],
      experience: [],
      projects: [],
      skills: matchedSkills,
    },
    engine: "ai",
  };
}

export async function analyzeWithAI(input: AnalyzeInput): Promise<AnalysisResult> {
  const content = await aiChat({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(input),
    temperature: 0.2,
    json: true,
  });
  return coerceResult(parseJsonObject(content));
}
