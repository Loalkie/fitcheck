import type { AnalysisResult } from "./types";

export type JobStatus = "saved" | "applied" | "interview" | "offer" | "rejected";

export interface MasterResume {
  fileName: string;
  text: string;
  updatedAt: string;
}

export interface ResumeVersion {
  id: string;
  name: string;
  fileName?: string;
  text: string;
  updatedAt: string;
}

export interface Contact {
  name: string;
  title?: string;
  email?: string;
}

export interface FollowUp {
  date: string;
  note: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  q: string;
  remote: boolean;
  size: "startup" | "mid" | "enterprise";
  level: "entry" | "mid" | "senior" | "manager";
  industry: string;
}

export interface SavedJob {
  id: string;
  title: string;
  company: string;
  url?: string;
  location?: string;
  salary?: string;
  notes?: string;
  contacts?: Contact[];
  followUp?: FollowUp;
  interviewDate?: string;
  interviewLocation?: string;
  interviewNote?: string;
  jdText: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  result: AnalysisResult | null;
}

export interface UserProfile {
  educationLevel: string;
  fieldOfStudy: string;
  school: string;
  gradYear: string;
  yearsExperience: number | null;
  internships: string[];
  skills: string[];
  targetRoles: string[];
  industries: string[];
  workAuthorization: string;
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  remotePreference: string;
  location: string;
  targetCompanies: string[];
}

export interface Workspace {
  masterResume: MasterResume | null;
  jobs: SavedJob[];
  profile: UserProfile | null;
  resumeVersions: ResumeVersion[];
  favoriteCompanyIds: string[];
  favoriteCompanyGroups: Record<string, string>;
  savedSearches: SavedSearch[];
}

export function emptyProfile(): UserProfile {
  return {
    educationLevel: "",
    fieldOfStudy: "",
    school: "",
    gradYear: "",
    yearsExperience: null,
    internships: [],
    skills: [],
    targetRoles: [],
    industries: [],
    workAuthorization: "",
    desiredSalaryMin: null,
    desiredSalaryMax: null,
    remotePreference: "",
    location: "",
    targetCompanies: [],
  };
}

const KEY = "resume-jd-workspace-v1";

/**
 * Deterministic empty workspace. Used as the first render value on both the
 * server and the client so hydration matches; localStorage is merged in later.
 */
export const EMPTY_WORKSPACE: Workspace = { masterResume: null, jobs: [], profile: null, resumeVersions: [], favoriteCompanyIds: [], favoriteCompanyGroups: {}, savedSearches: [] };

const EMPTY = EMPTY_WORKSPACE;

export function loadWorkspace(): Workspace {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Workspace;
    return {
      masterResume: parsed.masterResume ?? null,
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      profile: parsed.profile ?? null,
      resumeVersions: Array.isArray(parsed.resumeVersions) ? parsed.resumeVersions : [],
      favoriteCompanyIds: Array.isArray(parsed.favoriteCompanyIds) ? parsed.favoriteCompanyIds : [],
      favoriteCompanyGroups: parsed.favoriteCompanyGroups && typeof parsed.favoriteCompanyGroups === "object" ? parsed.favoriteCompanyGroups : {},
      savedSearches: Array.isArray(parsed.savedSearches) ? parsed.savedSearches : [],
    };
  } catch {
    return EMPTY;
  }
}

export function saveWorkspace(ws: Workspace): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ws));
  } catch {
    // Ignore quota / privacy-mode errors.
  }
}

export function clearWorkspace(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
