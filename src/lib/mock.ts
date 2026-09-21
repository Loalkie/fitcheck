import type {
  AnalysisResult,
  AnalyzeInput,
  CandidateProfile,
  KeywordMatch,
  RequirementLevel,
  RiskItem,
} from "./types";

// A broad US tech + AI/agent lexicon used as a deterministic fallback when no
// AI key is configured. It keeps the tool fully functional in demo mode.
const SKILL_LEXICON = [
  // AI / LLM / agents
  "AI", "LLM", "Large Language Model", "Generative AI", "GenAI", "Machine Learning",
  "Deep Learning", "NLP", "Agents", "AI Agents", "Agentic", "Autonomous Agents",
  "MCP", "Model Context Protocol", "Vibe Coding", "Claude Code", "Cursor",
  "GitHub Copilot", "Replit", "Lovable", "v0", "ChatGPT", "Claude", "GPT-4",
  "OpenAI API", "Anthropic", "RAG", "Retrieval-Augmented Generation",
  "Vector Database", "Embeddings", "Prompt Engineering", "Fine-tuning", "Evals",
  "Function Calling", "Tool Use", "LangChain", "LlamaIndex", "Hugging Face",
  "LoRA", "Distillation", "Agent Workflow", "Multi-agent", "Autogen",
  // Automation / workflows
  "Workflow Automation", "n8n", "Zapier", "Make", "Automation", "Scripting",
  "Data Pipeline", "ETL", "API Integration", "Webhooks",
  // Programming & web
  "Python", "TypeScript", "JavaScript", "React", "Next.js", "Node.js",
  "SQL", "PostgreSQL", "GraphQL", "REST", "Docker", "Kubernetes", "AWS",
  "GCP", "Azure", "CI/CD", "Git", "FastAPI", "Flask", "Django", "Tailwind",
  // Data / infra
  "Pandas", "NumPy", "Data Analysis", "A/B Testing", "Analytics", "BigQuery",
  "Snowflake", "Terraform", "Linux", "Redis", "Kafka",
  // Product / content
  "Technical Writing", "Documentation", "Content Creation", "Technical Validation",
  "Prototyping", "Rapid Prototyping", "Product", "MVP", "User Research",
];

const REQUIREMENT_HEADINGS =
  /requirements|qualifications|what you.{0,16}(need|have|bring)|minimum qualifications|must.?have|who you are|you have|we'?re looking for|to succeed|about you/i;

const NICE_TO_HAVE_HEADINGS =
  /nice.?to.?have|preferred|bonus|plus|even better|it'?s a plus/i;

const SECTION_BREAK_HEADINGS =
  /responsibilities|what you.{0,16}do|about (the|this|us|our)|benefits|compensation|salary|perks|equal opportunity|eeo|why join|how you'?ll|what we offer/i;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stem(word: string): string {
  let w = word.toLowerCase();
  if (w.length <= 4) return w;
  w = w
    .replace(/ies$/, "y")
    .replace(/sses$/, "ss")
    .replace(/s$/, "")
    .replace(/ied$/, "y")
    .replace(/(ed|ing)$/, "")
    .replace(/ion$/, "e")
    .replace(/ate$/, "at")
    .replace(/al$/, "")
    .replace(/e$/, "");
  return w;
}

function makeStemSet(text: string): Set<string> {
  const tokens = text.toLowerCase().match(/[a-z0-9][a-z0-9+'.-]*/g) || [];
  const set = new Set<string>();
  for (const token of tokens) {
    const s = stem(token);
    if (s) set.add(s);
  }
  return set;
}

function phraseMatches(set: Set<string>, term: string): boolean {
  const words = (term.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length >= 3);
  if (words.length === 0) return false;
  return words.every((w) => set.has(stem(w)));
}

function includesTerm(text: string, term: string): boolean {
  const t = term.trim();
  if (!t) return false;
  const hasLeadingAlnum = /[A-Za-z0-9]/.test(t[0]);
  const hasTrailingAlnum = /[A-Za-z0-9]/.test(t[t.length - 1]);
  let pattern = escapeRegExp(t);
  if (hasLeadingAlnum) pattern = `(^|[^A-Za-z0-9])${pattern}`;
  if (hasTrailingAlnum) pattern = `${pattern}([^A-Za-z0-9]|$)`;
  if (new RegExp(pattern, "i").test(text)) return true;
  return phraseMatches(makeStemSet(text), t);
}

function evidenceSnippet(text: string, term: string): string | undefined {
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return undefined;
  const start = Math.max(0, idx - 55);
  const end = Math.min(text.length, idx + term.length + 55);
  const snip = text.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "…" : ""}${snip}${end < text.length ? "…" : ""}`;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function classifyJd(jd: string): { required: string; nice: string } {
  let mode: "required" | "nice" | null = null;
  const required: string[] = [];
  const nice: string[] = [];
  for (const raw of jd.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (REQUIREMENT_HEADINGS.test(line)) {
      mode = "required";
      continue;
    }
    if (NICE_TO_HAVE_HEADINGS.test(line)) {
      mode = "nice";
      continue;
    }
    if (SECTION_BREAK_HEADINGS.test(line)) {
      mode = null;
      continue;
    }
    if (mode === "required") required.push(line);
    else if (mode === "nice") nice.push(line);
  }
  return { required: required.join("\n"), nice: nice.join("\n") };
}

function extractKeywords(jd: string): { term: string; level: RequirementLevel }[] {
  const { required, nice } = classifyJd(jd);
  const seen = new Set<string>();
  const out: { term: string; level: RequirementLevel }[] = [];
  for (const term of SKILL_LEXICON) {
    if (!includesTerm(jd, term)) continue;
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const level: RequirementLevel = includesTerm(required, term)
      ? "must-have"
      : includesTerm(nice, term)
        ? "nice-to-have"
        : "nice-to-have";
    out.push({ term, level });
    if (out.length >= 40) break;
  }
  return out;
}

function yearsOfExperience(text: string): number | null {
  const m = text.match(/(\d{1,2})\s*\+?\s*(?:years?|yrs?)/i);
  return m ? parseInt(m[1], 10) : null;
}

type Degree = "phd" | "masters" | "bachelors" | null;

function detectDegree(text: string): Degree {
  if (/\bph\.?d\.?\b|\bdoctorate\b|\bdoctoral\b/i.test(text)) return "phd";
  if (/\bmaster'?s?\b|\bm\.?s\.?\b|\bm\.?sc\.?\b|\bmba\b/i.test(text)) return "masters";
  if (/\bbachelor'?s?\b|\bb\.?s\.?\b|\bb\.?sc\.?\b|\bb\.?a\.?\b|\bundergraduate\b/i.test(text))
    return "bachelors";
  return null;
}

function scoreSkills(resume: string, keywords: { term: string; level: RequirementLevel }[]): number {
  if (keywords.length === 0) return 50;
  let earned = 0;
  let total = 0;
  for (const k of keywords) {
    const weight = k.level === "must-have" ? 2 : 1;
    total += weight;
    if (includesTerm(resume, k.term)) earned += weight;
  }
  return clamp((earned / total) * 100);
}

function scoreExperience(resume: string, jd: string, matchedCount: number): number {
  let score = 45;
  const requiredYears = yearsOfExperience(jd);
  const resumeYears = yearsOfExperience(resume);

  if (requiredYears !== null) {
    if (resumeYears !== null && resumeYears >= requiredYears) score += 25;
    else if (resumeYears !== null && resumeYears + 2 >= requiredYears) score += 8;
    else score -= 10;
  }

  const seniorTerms = /\bsenior\b|\blead\b|\bstaff\b|\bprincipal\b|\bmanager\b|\bdirector\b/i;
  const jdSenior = seniorTerms.test(jd);
  const resumeSenior = seniorTerms.test(resume);
  if (jdSenior && resumeSenior) score += 15;
  else if (jdSenior && !resumeSenior) score -= 10;

  const quantified = (resume.match(/\b\d+(?:\.\d+)?%|\$\s?\d|\b\d+(?:\.\d+)?x\b/gi) || []).length;
  if (quantified >= 3) score += 15;
  else if (quantified >= 1) score += 7;

  if (matchedCount >= 5) score += 10;
  else if (matchedCount >= 2) score += 5;

  return clamp(score);
}

function scoreEducation(resume: string, jd: string): number {
  const required = detectDegree(jd);
  const has = detectDegree(resume);
  if (!required) return 75;
  const rank: Record<NonNullable<Degree>, number> = { phd: 3, masters: 2, bachelors: 1 };
  if (!has) return 25;
  const diff = rank[has] - rank[required];
  if (diff >= 0) return 92;
  if (diff === -1) return 60;
  return 38;
}

function scoreAts(text: string): number {
  let score = 40;
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.]+/.test(text);
  const hasPhone = /(\+?1[-\s.]?)?\(?\d{3}\)?[-\s.]?\d{3}[-\s.]?\d{4}/.test(text);
  if (hasEmail) score += 15;
  if (hasPhone) score += 10;

  const sections = ["experience", "education", "skills", "projects"];
  let found = 0;
  for (const s of sections) if (new RegExp(`\\b${s}\\b`, "i").test(text)) found++;
  score += found * 8;

  const bullets = (text.match(/^[•\-*▪·]\s+.+/gm) || []).length;
  if (bullets >= 6) score += 10;
  else if (bullets >= 3) score += 5;

  const quantified = (text.match(/\b\d+(?:\.\d+)?%|\$\s?\d/i) || []).length;
  if (quantified >= 3) score += 8;
  else if (quantified >= 1) score += 4;

  if (text.trim().length < 300) score -= 15;
  if (text.trim().length > 12000) score -= 10;
  if (found === 0) score -= 15;

  return clamp(score);
}

function extractProfile(text: string): CandidateProfile {
  const lines = text.split(/\r?\n/);
  const buckets: Record<"summary" | "education" | "experience" | "projects" | "skills", string[]> = {
    summary: [],
    education: [],
    experience: [],
    projects: [],
    skills: [],
  };

  const headings: Array<[RegExp, keyof typeof buckets]> = [
    [/^\s*(summary|profile|objective|about me|professional summary)\b/i, "summary"],
    [/^\s*(education|academic background|academics|education & training)\b/i, "education"],
    [
      /^\s*(experience|employment|work experience|professional experience|work history|relevant experience)\b/i,
      "experience",
    ],
    [/^\s*(projects?|personal projects?|side projects?|open source|portfolio|selected projects?)\b/i, "projects"],
    [/^\s*(skills?|technical skills?|technologies|core competencies|tech stack)\b/i, "skills"],
  ];

  let current: keyof typeof buckets | null = null;
  for (const line of lines) {
    const matched = headings.find(([re]) => re.test(line));
    if (matched) {
      current = matched[1];
      continue;
    }
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (current) {
      if (buckets[current].length < 10) buckets[current].push(trimmed);
    }
  }

  const summaryCandidates = lines
    .slice(0, 14)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 40 &&
        l.split(/\s+/).length >= 8 &&
        !/@/.test(l) &&
        !/\(?\d{3}\)?[-\s.]?\d{3}[-\s.]?\d{4}/.test(l),
    );
  const summary = summaryCandidates[0] || text.trim().slice(0, 240);

  return {
    summary,
    education: buckets.education,
    experience: buckets.experience,
    projects: buckets.projects,
    skills: buckets.skills,
  };
}

function buildRisk(
  severity: RiskItem["severity"],
  title: string,
  detail: string,
): RiskItem {
  return { severity, title, detail };
}

export function analyzeHeuristic(input: AnalyzeInput): AnalysisResult {
  const resume = input.resumeText;
  const jd = input.jobDescription;

  const keywords = extractKeywords(jd);
  const matched: KeywordMatch[] = [];
  const unmatched: KeywordMatch[] = [];
  for (const k of keywords) {
    if (includesTerm(resume, k.term)) {
      matched.push({ term: k.term, level: k.level, evidence: evidenceSnippet(resume, k.term) });
    } else {
      unmatched.push({ term: k.term, level: k.level });
    }
  }

  const skillsScore = scoreSkills(resume, keywords);
  const experienceScore = scoreExperience(resume, jd, matched.length);
  const educationScore = scoreEducation(resume, jd);
  const atsScore = scoreAts(resume);
  const overallScore = clamp(
    skillsScore * 0.4 + experienceScore * 0.3 + educationScore * 0.15 + atsScore * 0.15,
  );

  const strengths: string[] = [];
  const mustMatched = matched.filter((m) => m.level === "must-have").map((m) => m.term);
  if (mustMatched.length > 0) {
    strengths.push(`Resume shows evidence for required skill(s): ${mustMatched.slice(0, 4).join(", ")}.`);
  } else if (matched.length > 0) {
    strengths.push(`Resume covers several job-relevant keywords: ${matched.slice(0, 4).map((m) => m.term).join(", ")}.`);
  }
  if (skillsScore >= 70) strengths.push("Keyword coverage against the job description is strong.");
  if (experienceScore >= 70) strengths.push("Experience scope and seniority appear aligned with the role.");
  if (educationScore >= 80) strengths.push("Education meets or exceeds the role's stated requirement.");
  if (atsScore >= 80) strengths.push("Resume is well-structured and likely to parse cleanly in an ATS.");

  const risks: RiskItem[] = [];
  const mustMissing = unmatched.filter((k) => k.level === "must-have").map((k) => k.term);
  const niceMissing = unmatched.filter((k) => k.level === "nice-to-have").map((k) => k.term);
  if (mustMissing.length > 0) {
    risks.push(
      buildRisk(
        "high",
        `Missing required signal(s): ${mustMissing.slice(0, 5).join(", ")}`,
        "The job description lists these as requirements, but the resume does not show evidence. If you have the experience, add the concrete project or result; if not, treat it as a capability gap rather than a wording fix.",
      ),
    );
  }
  if (niceMissing.length > 3) {
    risks.push(
      buildRisk(
        "medium",
        `Several nice-to-have terms are absent: ${niceMissing.slice(0, 5).join(", ")}`,
        "These are preferred qualifications, not hard requirements. Add them only where you have genuine experience.",
      ),
    );
  }
  if (skillsScore < 50) {
    risks.push(
      buildRisk("high", "Low keyword overlap with the job description", "The resume and job description share few explicit skills or technologies, which may cause an ATS or screener to pass it over."),
    );
  }
  if (experienceScore < 50) {
    risks.push(
      buildRisk("medium", "Experience is hard to verify against the role", "Years, seniority, or quantified impact are not clearly signaled. Add scope, team size, and measurable results."),
    );
  }
  if (educationScore < 50) {
    risks.push(
      buildRisk("medium", "Education may not meet the stated requirement", "The job description appears to require a degree level not clearly shown in the resume."),
    );
  }
  if (atsScore < 60) {
    risks.push(
      buildRisk("high", "Resume may not parse cleanly in an ATS", "Missing contact details, standard section headings, or bullets can break applicant-tracking-system parsing before a human sees it."),
    );
  }

  const suggestions: string[] = [];
  if (mustMissing.length > 0) {
    suggestions.push(`For any skill you actually have among: ${mustMissing.slice(0, 5).join(", ")} — add a real project or result that demonstrates it.`);
  }
  suggestions.push("Quantify impact with numbers, percentages, or scale (e.g., 'cut latency 40%', 'led 5 engineers').");
  suggestions.push("Use standard section headings (Experience, Education, Skills, Projects) so ATS tools can parse your resume.");
  if (!/[\w.+-]+@[\w-]+\.[\w.]+/.test(resume)) suggestions.push("Include a contact email near the top of the resume.");
  if (atsScore < 70) suggestions.push("Avoid multi-column layouts, tables, images, and header/footer contact blocks that can break ATS parsing.");
  if (educationScore < 60) suggestions.push("Clarify degree level, field, and any relevant certifications or coursework.");
  suggestions.push("Tailor the resume to this specific job description: mirror the exact terminology the posting uses (only when accurate).");

  return {
    overallScore,
    skillsScore,
    experienceScore,
    educationScore,
    atsScore,
    matchedKeywords: matched,
    unmatchedKeywords: unmatched,
    strengths: strengths.slice(0, 6),
    risks: risks.slice(0, 8),
    suggestions: suggestions.slice(0, 8),
    optimizations: [],
    candidateProfile: extractProfile(resume),
    engine: "heuristic",
  };
}
