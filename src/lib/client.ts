import type { AnalysisResult } from "./types";

const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * Wraps fetch so network-level failures ("Failed to fetch") turn into a message
 * the user can act on instead of a browser hard error.
 */
async function apiFetch(url: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      throw new Error("The request took too long and was stopped. Please try again.");
    }
    throw new Error("Could not reach the server. Restart the app, then try again.");
  }
}

async function parseJson<T>(res: Response): Promise<T & { error?: string }> {
  return (await res.json().catch(() => ({}))) as T & { error?: string };
}

export async function analyzeText(resumeText: string, jobDescription: string): Promise<AnalysisResult> {
  const res = await apiFetch("/api/analyze-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText, jobDescription }),
  }, 120_000);
  const data = await parseJson<AnalysisResult>(res);
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Analysis failed. Please try again.");
  return data;
}

export async function analyzeFile(file: File, jobDescription: string): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("resume", file);
  form.append("jobDescription", jobDescription);
  const res = await apiFetch("/api/analyze", { method: "POST", body: form }, 120_000);
  const data = await parseJson<AnalysisResult>(res);
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Analysis failed. Please try again.");
  return data;
}

export async function parseFile(file: File): Promise<{ text: string; kind: string }> {
  const form = new FormData();
  form.append("resume", file);
  const res = await apiFetch("/api/parse", { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as { text?: string; kind?: string; error?: string };
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not read that file.");
  return { text: data.text ?? "", kind: data.kind ?? "text" };
}

// ---- Auth & workspace sync ----

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(url, init);
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Request failed.");
  return data;
}

export interface AuthUser {
  email: string;
  emailVerified?: boolean;
}

export async function register(email: string, password: string): Promise<AuthUser> {
  const data = await jsonFetch<{ user: AuthUser }>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return data.user;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await jsonFetch<{ user: AuthUser }>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return data.user;
}

export async function logout(): Promise<void> {
  await jsonFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await jsonFetch<{ ok: boolean }>("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await jsonFetch<{ ok: boolean }>("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
}

export async function sendVerificationEmail(): Promise<{ alreadyVerified?: boolean }> {
  return jsonFetch<{ ok: boolean; alreadyVerified?: boolean }>("/api/auth/send-verification", { method: "POST" });
}

export async function verifyEmail(token: string): Promise<void> {
  await jsonFetch<{ ok: boolean }>("/api/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

export async function deleteAccount(password: string): Promise<void> {
  await jsonFetch<{ ok: boolean }>("/api/auth/delete-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

export async function getMe(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) return null;
  const data = (await res.json()) as { user: AuthUser | null };
  return data.user ?? null;
}

export async function getWorkspace(): Promise<unknown | null> {
  const res = await fetch("/api/workspace");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Could not load your workspace.");
  const data = (await res.json()) as { workspace: unknown | null };
  return data.workspace ?? null;
}

export async function putWorkspace(workspace: unknown): Promise<void> {
  await jsonFetch<{ ok: boolean }>("/api/workspace", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspace }),
  });
}

export async function generateCoverLetter(payload: {
  jobDescription: string;
  resumeText: string;
  company?: string;
  role?: string;
  profile?: unknown;
}): Promise<string> {
  const res = await fetch("/api/cover-letter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { coverLetter?: string; error?: string };
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not generate a cover letter.");
  return data.coverLetter ?? "";
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export async function generateEmail(payload: {
  jobDescription: string;
  resumeText: string;
  purpose: string;
  company?: string;
  role?: string;
  contactName?: string;
  contactTitle?: string;
  candidateName?: string;
}): Promise<GeneratedEmail> {
  const res = await fetch("/api/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as GeneratedEmail & { error?: string };
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not generate the email.");
  return { subject: data.subject ?? "", body: data.body ?? "" };
}

export interface CompanyNewsItem {
  title: string;
  link: string;
  date: string;
  source: string;
}

export async function getCompanyNews(company: string): Promise<CompanyNewsItem[]> {
  const res = await fetch(`/api/company-news?company=${encodeURIComponent(company)}`);
  const data = (await res.json().catch(() => ({}))) as { items?: CompanyNewsItem[]; error?: string };
  if (!res.ok || !Array.isArray(data.items)) return [];
  return data.items;
}

export interface TailoredResume {
  tailoredResume: string;
  changes: string[];
  addedKeywords: string[];
  notes: string;
  engine: "ai" | "heuristic";
}

export async function tailorResume(payload: {
  resumeText: string;
  jobDescription: string;
  company?: string;
  role?: string;
  profile?: unknown;
  style?: string;
}): Promise<TailoredResume> {
  const res = await fetch("/api/tailor-resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as TailoredResume & { error?: string };
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not tailor the resume.");
  return data;
}

export interface LiveJob {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  postedAt: string;
  remote: boolean;
  boardId?: string;
  jobId?: number;
  size: "startup" | "mid" | "enterprise";
  level: "entry" | "mid" | "senior" | "manager";
  industry: string;
}

export async function getLiveJobs(params: {
  q?: string;
  company?: string;
  remote?: boolean;
  limit?: number;
}): Promise<LiveJob[]> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.company) qs.set("company", params.company);
  if (params.remote) qs.set("remote", "1");
  if (params.limit) qs.set("limit", String(params.limit));
  const res = await fetch(`/api/jobs?${qs.toString()}`);
  const data = (await res.json().catch(() => ({}))) as { jobs?: LiveJob[]; error?: string };
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not load jobs.");
  return data.jobs ?? [];
}

export async function getLiveJobDescription(job: LiveJob): Promise<string> {
  const res = await fetch("/api/job-detail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job }),
  });
  const data = (await res.json().catch(() => ({}))) as { description?: string; error?: string };
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not load the job description.");
  return data.description ?? "";
}

export interface InterviewPrepResult {
  questions: { question: string; why: string; framework: string; sample: string }[];
  strengthsToHighlight: string[];
  questionsToAsk: string[];
  notes: string;
  engine: "ai" | "heuristic";
}

export async function generateInterviewPrep(payload: {
  resumeText: string;
  jobDescription: string;
  role?: string;
  company?: string;
  profile?: unknown;
}): Promise<InterviewPrepResult> {
  const res = await fetch("/api/interview-prep", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as InterviewPrepResult & { error?: string };
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not generate interview prep.");
  return data;
}

export async function exportResume(text: string, title = "Resume"): Promise<void> {
  const res = await fetch("/api/export-resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, title }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(typeof data.error === "string" ? data.error : "Could not export the resume.");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^\w\- ]+/g, "").trim() || "Resume"}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function writeResume(payload: {
  name: string;
  role: string;
  company?: string;
  experience: string;
  projects: string;
  education: string;
  skills: string;
  profile?: unknown;
  style?: string;
}): Promise<TailoredResume> {
  const res = await fetch("/api/write-resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as TailoredResume & { error?: string };
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not write the resume.");
  return data;
}

export interface ResumeAuditResult {
  score: number;
  grade: string;
  sectionsFound: string[];
  missingSections: string[];
  keywordCoverage: { term: string; found: boolean }[];
  weakBullets: { text: string; issues: string[]; suggestion: string }[];
  strengths: string[];
  suggestions: string[];
}

export async function auditResume(resumeText: string, jobDescription = ""): Promise<ResumeAuditResult> {
  const res = await fetch("/api/resume-audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText, jobDescription }),
  });
  const data = (await res.json().catch(() => ({}))) as ResumeAuditResult & { error?: string };
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not audit the resume.");
  return data;
}

export async function improveResume(resumeText: string, jobDescription = ""): Promise<{ improvedResume: string; changes: string[] }> {
  const res = await fetch("/api/improve-resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText, jobDescription }),
  });
  const data = (await res.json().catch(() => ({}))) as { improvedResume?: string; changes?: string[]; error?: string };
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not improve the resume.");
  return { improvedResume: data.improvedResume ?? "", changes: data.changes ?? [] };
}

export async function extractJobFromUrl(url: string): Promise<{
  title: string;
  company: string;
  location: string;
  description: string;
}> {
  const res = await fetch("/api/extract-job", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    title?: string;
    company?: string;
    location?: string;
    description?: string;
    error?: string;
  };
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not extract the job posting.");
  return {
    title: data.title ?? "",
    company: data.company ?? "",
    location: data.location ?? "",
    description: data.description ?? "",
  };
}
