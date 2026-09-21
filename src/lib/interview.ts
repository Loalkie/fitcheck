import type { UserProfile } from "./store";
import { aiChat, hasAiProvider } from "./aiClient";

export interface InterviewQuestion {
  question: string;
  why: string;
  framework: string;
  sample: string;
}

export interface InterviewPrepResult {
  questions: InterviewQuestion[];
  strengthsToHighlight: string[];
  questionsToAsk: string[];
  notes: string;
  engine: "ai" | "heuristic";
}

export interface InterviewInput {
  resumeText: string;
  jobDescription: string;
  role?: string;
  company?: string;
  profile?: UserProfile | null;
}

const SYSTEM_PROMPT = `You are an expert US interview coach. Build a focused interview prep plan for the candidate and role described.

Rules:
- Use only real facts from the resume or profile. Never invent employers, projects, or metrics.
- Generate 6 high-value questions likely for this role, each with why it is asked, a STAR/alternative framework, and a short answer scaffold the candidate can complete with their real story.
- Add 3 strengths the candidate can credibly emphasize.
- Add 3 thoughtful questions the candidate should ask the interviewer.
- Return a single JSON object with exactly this schema:
{
  "questions": [{"question": string, "why": string, "framework": string, "sample": string}],
  "strengthsToHighlight": string[],
  "questionsToAsk": string[],
  "notes": string
}`;

function parseJsonObject(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
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

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());
}

async function aiInterview(input: InterviewInput): Promise<InterviewPrepResult> {
  const user = [
    `Target: ${input.role || "the role"}${input.company ? ` at ${input.company}` : ""}`,
    "",
    "Job description:",
    '"""',
    input.jobDescription.trim().slice(0, 12000),
    '"""',
    "",
    "Candidate profile:",
    JSON.stringify(input.profile ?? {}),
    "",
    "Resume:",
    '"""',
    input.resumeText.trim().slice(0, 16000),
    '"""',
  ].join("\n");

  const content = await aiChat({
    system: SYSTEM_PROMPT,
    user,
    temperature: 0.35,
    json: true,
  });
  const raw = parseJsonObject(content);
  const questions = Array.isArray(raw.questions)
    ? raw.questions
        .filter((q): q is Record<string, unknown> => Boolean(q) && typeof q === "object")
        .map((q) => ({
          question: typeof q.question === "string" ? q.question.trim() : "",
          why: typeof q.why === "string" ? q.why.trim() : "",
          framework: typeof q.framework === "string" ? q.framework.trim() : "",
          sample: typeof q.sample === "string" ? q.sample.trim() : "",
        }))
        .filter((q) => q.question)
    : [];
  if (questions.length === 0) throw new Error("Model returned no questions");
  return {
    questions,
    strengthsToHighlight: asStringArray(raw.strengthsToHighlight),
    questionsToAsk: asStringArray(raw.questionsToAsk),
    notes: typeof raw.notes === "string" ? raw.notes.trim() : "",
    engine: "ai",
  };
}

function heuristicInterview(input: InterviewInput): InterviewPrepResult {
  const role = input.role || "the target role";
  const company = input.company || "the company";
  const lower = input.jobDescription.toLowerCase();
  const skillFocus = [
    "AI / LLM",
    "system design",
    "product sense",
    "data analysis",
    "cross-team collaboration",
    "Python / TypeScript",
    "project ownership",
    "communication",
  ].filter((term) => lower.includes(term.split(" ")[0]) || term.toLowerCase() === "communication");

  const questions: InterviewQuestion[] = [
    {
      question: `Tell me about a project you led end to end that is relevant to ${role}.`,
      why: "Recruiters use this to test ownership, scope, and impact in your own words.",
      framework: "STAR: Situation → Task → Action → Result.",
      sample: "Situation: [context]. Task: [your goal]. Action: [2-3 concrete steps]. Result: [metric or outcome].",
    },
    {
      question: `How do you approach an ambiguous problem with no clear owner?`,
      why: "Companies want evidence you can turn uncertainty into a plan.",
      framework: "Clarify → Frame → Prototype → Validate → Ship.",
      sample: "I first define success, list assumptions, build the smallest test, and use feedback to decide the next step.",
    },
    {
      question: `Tell me about a time a technical or project decision failed.`,
      why: "They are testing self-awareness, debugging process, and whether you learn.",
      framework: "What happened → What you learned → What you changed.",
      sample: "The initial approach missed [constraint]. I diagnosed [cause], changed [action], and later used that lesson to [improvement].",
    },
    {
      question: `How do you explain complex work to non-technical stakeholders?`,
      why: "Most roles require translating detail into decisions.",
      framework: "Outcome first → Plain-language analogy → Options → Recommendation.",
      sample: "I start with the business result, simplify the mechanism, then present 2-3 options with tradeoffs.",
    },
    {
      question: `What do you know about ${company} and why this team?`,
      why: "It separates candidates who researched the company from those who mass-applied.",
      framework: "Company context → Team problem → Your match.",
      sample: "Your product/team is focused on [problem]. My background in [experience] directly supports [specific need].",
    },
    {
      question: `Walk me through how you would improve the quality or speed of your work.`,
      why: "This reveals process maturity and how you raise the bar.",
      framework: "Measure baseline → Find bottleneck → Automate/template → Review.",
      sample: "I would measure the current output, identify the slowest step, and introduce a repeatable process before scaling.",
    },
  ];

  return {
    questions,
    strengthsToHighlight: skillFocus.length
      ? skillFocus.slice(0, 3)
      : ["Project ownership", "Communication", "Measured results"],
    questionsToAsk: [
      `What does success look like in the first 90 days for ${role}?`,
      "How does the team measure quality and impact?",
      "What is the biggest risk or open problem the team is working on right now?",
    ],
    notes: "Heuristic demo — replace each sample with your real project and metric before the interview.",
    engine: "heuristic",
  };
}

export async function generateInterviewPrep(input: InterviewInput): Promise<InterviewPrepResult> {
  if (hasAiProvider()) {
    try {
      return await aiInterview(input);
    } catch (err) {
      console.error("[interview] AI call failed, using heuristic fallback:", err);
    }
  }
  return heuristicInterview(input);
}
