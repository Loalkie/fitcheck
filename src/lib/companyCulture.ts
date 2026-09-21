import type { Company } from "./companies";
import { ROLES } from "./roles";

const WORK_MODEL: Record<string, string> = {
  remote: "Remote-first",
  notion: "Hybrid",
  figma: "Hybrid",
  vercel: "Remote-first",
  supabase: "Remote-first",
  deel: "Remote-first",
  gitlab: "Remote-first",
  postman: "Hybrid",
  fedex: "On-site / field",
  ups: "On-site / field",
  homedepot: "Hybrid",
  starbucks: "On-site / store",
  boeing: "Hybrid / on-site",
  gm: "Hybrid",
  ford: "Hybrid",
  target: "Hybrid",
  walmart: "Hybrid / store",
  chevron: "Hybrid / on-site",
  exxon: "Hybrid / on-site",
};

const INTERVIEW_PROCESS: Record<string, string> = {
  tech: "Recruiter screen → technical interview → team loop → offer",
  startup: "Intro call → project/take-home → team interviews → offer",
  finance: "Recruiter screen → technical/behavioral → team interviews → offer",
  healthcare: "Recruiter screen → behavioral/clinical → team interviews → offer",
  consulting: "Case interview → behavioral → partner interviews → offer",
  default: "Recruiter screen → behavioral/technical → hiring team → offer",
};

function companyKind(company: Company): keyof typeof INTERVIEW_PROCESS {
  const id = company.id;
  if (["mckinsey", "bcg", "pwc", "ey", "kpmg", "deloitte", "accenture"].includes(id)) return "consulting";
  if (["bankofamerica", "wellsfargo", "citi", "morganstanley", "goldman", "visa", "mastercard", "paypal", "capitalone"].includes(id)) return "finance";
  if (["unitedhealth", "cvs", "cigna", "humana", "abbott", "medtronic", "elililly", "mayo", "cleveland", "jnj", "pfizer"].includes(id)) return "healthcare";
  if (["notion", "vercel", "supabase", "ramp", "brex", "benchling", "deel", "remote", "calm", "headspace", "patreon", "substack"].includes(id)) return "startup";
  return "tech";
}

export function companyWorkModel(company: Company): string {
  return WORK_MODEL[company.id] ?? (company.industry === "Manufacturing" || company.industry === "Logistics" ? "Hybrid / on-site" : "Hybrid");
}

export function companyInterviewProcess(company: Company): string {
  return INTERVIEW_PROCESS[companyKind(company)] ?? INTERVIEW_PROCESS.default;
}

export function companySalaryRange(company: Company): string {
  const roles = company.topRoles
    .map((title) => ROLES.find((r) => r.title === title))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));
  if (roles.length === 0) return "Not listed";
  const min = Math.min(...roles.map((r) => r.salaryMin));
  const max = Math.max(...roles.map((r) => r.salaryMax));
  return `$${Math.round(min / 1000)}k–$${Math.round(max / 1000)}k`;
}

export function companyRemotePolicy(company: Company): string {
  return WORK_MODEL[company.id] ?? companyWorkModel(company);
}
