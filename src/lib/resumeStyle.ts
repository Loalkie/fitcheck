export type ResumeStyle = "executive" | "modern" | "classic" | "ats";

export const RESUME_STYLES: { id: ResumeStyle; label: string; description: string }[] = [
  { id: "executive", label: "Executive", description: "Senior, outcome-driven, ownership language." },
  { id: "modern", label: "Modern", description: "Clean, impact-first, and visually scannable." },
  { id: "classic", label: "Classic", description: "Traditional, formal, and conservative." },
  { id: "ats", label: "ATS", description: "Keyword-focused with simple machine-readable structure." },
];
