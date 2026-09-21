import { emptyProfile, type UserProfile } from "./store";
import { SKILL_OPTIONS } from "./roles";

function pickFirst(regex: RegExp, text: string): string {
  const match = text.match(regex);
  return match?.[1]?.trim() ?? "";
}

function detectEducationLevel(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("phd") || lower.includes("doctor of philosophy")) return "PhD";
  if (lower.includes("master")) return "Master's";
  if (/\bbachelor|\bbs\b|\bba\b/i.test(text)) return "Bachelor's";
  if (lower.includes("associate")) return "Associate's";
  return "";
}

function detectField(text: string): string {
  const lower = text.toLowerCase();
  const fields = [
    ["computer science", "Computer Science"],
    ["data science", "Data Science"],
    ["software engineering", "Software Engineering"],
    ["electrical engineering", "Electrical Engineering"],
    ["mechanical engineering", "Mechanical Engineering"],
    ["business administration", "Business Administration"],
    ["business", "Business"],
    ["finance", "Finance"],
    ["marketing", "Marketing"],
    ["design", "Design"],
    ["psychology", "Psychology"],
    ["biology", "Biology"],
    ["mathematics", "Mathematics"],
    ["statistics", "Statistics"],
  ];
  for (const [key, label] of fields) {
    if (lower.includes(key)) return label;
  }
  return "";
}

function detectSchool(text: string): string {
  return pickFirst(
    /([A-Z][\w&.'\-]*(?:\s+[A-Z][\w&.'\-]*){0,4}\s+(?:University|College|Institute|School))/,
    text,
  );
}

function detectGradYear(text: string): string {
  const matches = [...text.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => Number(m[0]));
  const plausible = matches.filter((y) => y >= 1990 && y <= new Date().getFullYear() + 2);
  if (!plausible.length) return "";
  return String(Math.max(...plausible));
}

function detectYears(text: string): number | null {
  const match = text.match(/(\d{1,2})\s*\+?\s*(?:years|yrs)/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value >= 0 && value <= 40 ? value : null;
}

function detectSkills(text: string): string[] {
  const lower = text.toLowerCase();
  return SKILL_OPTIONS.filter((skill) => lower.includes(skill.toLowerCase())).slice(0, 16);
}

function detectRoles(text: string): string[] {
  const lower = text.toLowerCase();
  const roles: string[] = [];
  if (/(llm|ai agent|machine learning|deep learning|mcp|rag|prompt engineering)/i.test(text)) roles.push("ai-ml");
  if (/(react|typescript|javascript|frontend|next\.js)/i.test(text)) roles.push("frontend");
  if (/(python|node\.js|backend|api|sql|system design)/i.test(text)) roles.push("backend");
  if (/(product manager|product strategy|roadmap|agile|stakeholder)/i.test(text)) roles.push("pm");
  if (/(figma|ux|user research|prototype|design system)/i.test(text)) roles.push("design");
  if (/(data scientist|statistics|machine learning|pandas|a\/b testing|tableau)/i.test(text)) roles.push("ds");
  if (/(devops|docker|kubernetes|aws|azure|gcp|terraform|ci\/cd)/i.test(text)) roles.push("devops");
  return roles.slice(0, 4);
}

function detectIndustries(text: string): string[] {
  const lower = text.toLowerCase();
  const map: [RegExp, string][] = [
    [/ai|llm|machine learning|agent|mcp/, "AI & Machine Learning"],
    [/fintech|finance|banking|payments/, "FinTech"],
    [/healthcare|clinical|medical/, "Healthcare"],
    [/ecommerce|e-commerce|retail|marketplace/, "E-commerce"],
    [/saas|b2b|enterprise/, "Enterprise SaaS"],
    [/cybersecurity|security/, "Cybersecurity"],
    [/consulting|advisory/, "Consulting"],
  ];
  return map.filter(([re]) => re.test(lower)).map(([, label]) => label).slice(0, 2);
}

export function extractProfileFromResume(text: string, current: UserProfile | null): UserProfile {
  const base = current ?? emptyProfile();
  return {
    ...base,
    educationLevel: base.educationLevel || detectEducationLevel(text),
    fieldOfStudy: base.fieldOfStudy || detectField(text),
    school: base.school || detectSchool(text),
    gradYear: base.gradYear || detectGradYear(text),
    yearsExperience: base.yearsExperience ?? detectYears(text),
    skills: base.skills.length ? base.skills : detectSkills(text),
    targetRoles: base.targetRoles.length ? base.targetRoles : detectRoles(text),
    industries: base.industries.length ? base.industries : detectIndustries(text),
  };
}
