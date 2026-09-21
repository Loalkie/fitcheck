export type RequirementLevel = "must-have" | "nice-to-have";

export interface KeywordMatch {
  term: string;
  level: RequirementLevel;
  /** A short quote from the resume proving the match, when available. */
  evidence?: string;
}

export interface RiskItem {
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
}

export interface ResumeOptimization {
  section: string;
  before: string;
  after: string;
  reason: string;
}

export interface CandidateProfile {
  summary: string;
  education: string[];
  experience: string[];
  projects: string[];
  skills: string[];
}

export interface AnalysisResult {
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  atsScore: number;
  matchedKeywords: KeywordMatch[];
  unmatchedKeywords: KeywordMatch[];
  strengths: string[];
  risks: RiskItem[];
  suggestions: string[];
  optimizations: ResumeOptimization[];
  candidateProfile: CandidateProfile;
  /** Which engine produced the result. */
  engine: "ai" | "heuristic";
}

export interface AnalyzeInput {
  resumeText: string;
  jobDescription: string;
}
