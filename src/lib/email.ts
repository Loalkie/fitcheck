import { aiChat, hasAiProvider } from "./aiClient";

export type EmailPurpose = "outreach" | "referral" | "follow-up" | "thank-you";

export interface EmailInput {
  jobDescription: string;
  resumeText: string;
  purpose: EmailPurpose;
  company?: string;
  role?: string;
  contactName?: string;
  contactTitle?: string;
  candidateName?: string;
}

export interface EmailResult {
  subject: string;
  body: string;
}

const AI_PROMPT = `You are a professional US job-search email writer. Write a concise, warm, specific email for the selected purpose.

Rules:
- Use only real information from the candidate's background. Never invent skills, companies, or numbers.
- Keep it short (90-150 words body). Reference one or two specific points from the job description that the candidate can support.
- Use a professional but human tone. No clichés or generic filler.
- Return valid JSON with exactly two string fields: {"subject":"...", "body":"..."}
- The body may include newline characters represented as \\n. Do not include a signature block beyond the closing line and candidate name if available.`;

async function aiEmail(input: EmailInput): Promise<EmailResult> {
  const purposeLabel: Record<EmailPurpose, string> = {
    outreach: "cold outreach expressing interest in a role",
    referral: "ask a contact for a referral",
    "follow-up": "polite follow-up after submitting an application",
    "thank-you": "thank-you note after an interview",
  };

  const user = `Purpose: ${purposeLabel[input.purpose]}\n\nCandidate name (if known): ${input.candidateName || "unknown"}\nContact name: ${input.contactName || "Hiring Manager"}\nContact title: ${input.contactTitle || "unknown"}\n\nRole: ${input.role || "the role"}${input.company ? ` at ${input.company}` : ""}\n\nJob description:\n"""\n${input.jobDescription.trim().slice(0, 8000)}\n"""\n\nCandidate resume:\n"""\n${input.resumeText.trim().slice(0, 8000)}\n"""`;

  const raw = await aiChat({
    system: AI_PROMPT,
    user,
    temperature: 0.7,
    json: true,
  });
  const parsed = JSON.parse(raw) as { subject?: string; body?: string };
  if (!parsed.subject || !parsed.body) throw new Error("Invalid email response");
  return { subject: parsed.subject, body: parsed.body };
}

function heuristicEmail(input: EmailInput): EmailResult {
  const role = input.role || "this role";
  const company = input.company || "your team";
  const contact = input.contactName || "Hiring Manager";
  const title = input.contactTitle ? `, ${input.contactTitle}` : "";
  const name = input.candidateName || "[Your name]";

  const templates: Record<EmailPurpose, EmailResult> = {
    outreach: {
      subject: `Interest in ${role}${input.company ? ` at ${input.company}` : ""}`,
      body: `Hi ${contact}${title},\n\nI recently came across the ${role} opening${input.company ? ` at ${input.company}` : ""} and wanted to introduce myself. My background maps directly to the role — I've shipped the kind of work the posting emphasizes, with hands-on ownership from scoping through delivery and measurement.\n\nI'd welcome the chance to share more about how I could contribute. Are you open to a short conversation this week?\n\nThanks for your time,\n${name}`,
    },
    referral: {
      subject: `Would you be open to referring me for ${role}?`,
      body: `Hi ${contact}${title},\n\nI hope you're doing well. I'm applying for the ${role} position${input.company ? ` at ${input.company}` : ""} and would be grateful if you'd consider referring me if it feels like a good fit.\n\nI've focused on exactly the kind of work the role requires, and I'm happy to share my resume or answer any questions first so it's an easy recommendation for you.\n\nEither way, thank you for taking a look.\n\nBest,\n${name}`,
    },
    "follow-up": {
      subject: `Following up on my application for ${role}`,
      body: `Hi ${contact}${title},\n\nI wanted to follow up on my application for ${role}${input.company ? ` at ${input.company}` : ""}. I remain very interested and would welcome the chance to discuss how my experience could support your team.\n\nI know you're likely fielding many applications, so I appreciate your time. Happy to provide anything additional that would be helpful.\n\nBest,\n${name}`,
    },
    "thank-you": {
      subject: `Thank you — ${role} interview`,
      body: `Hi ${contact}${title},\n\nThank you again for taking the time to speak with me about the ${role} role${input.company ? ` at ${input.company}` : ""}. I enjoyed learning more about the team and the priorities ahead.\n\nThe conversation reinforced my interest, and I'm confident I can make an immediate contribution. Please let me know if there's anything else I can share as you make your decision.\n\nBest,\n${name}`,
    },
  };

  return templates[input.purpose];
}

export async function generateEmail(input: EmailInput): Promise<EmailResult> {
  if (hasAiProvider()) {
    try {
      return await aiEmail(input);
    } catch (err) {
      console.error("[email] AI call failed, using template:", err);
    }
  }
  return heuristicEmail(input);
}
