import type { AnalysisResult, AnalyzeInput } from "./types";
import { parseResume } from "./parse";
import { analyzeWithAI } from "./ai";
import { analyzeHeuristic } from "./mock";
import { hasAiProvider } from "./aiClient";

interface ResumeFileLike {
  name: string;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export async function analyzeFromText(
  resumeText: string,
  jobDescription: string,
): Promise<AnalysisResult> {
  const text = resumeText.replace(/\u0000/g, " ").trim();

  if (text.length < 40) {
    throw new Error(
      "We could not read enough text from that file. Try a PDF/DOCX with selectable text (not a scanned image), or paste a .txt/.md file.",
    );
  }

  const input: AnalyzeInput = { resumeText: text, jobDescription };

  if (hasAiProvider()) {
    try {
      return await analyzeWithAI(input);
    } catch (err) {
      console.error("[analyze] AI call failed, falling back to heuristic:", err);
    }
  }

  return analyzeHeuristic(input);
}

export async function analyzeResume(file: ResumeFileLike, jobDescription: string): Promise<AnalysisResult> {
  const parsed = await parseResume(file);
  return analyzeFromText(parsed.text, jobDescription);
}
