/**
 * Transactional mail goes out over an HTTP API (Resend, Postmark, SendGrid and
 * Mailgun all accept this body) so the deployment needs no SMTP dependency.
 * Without `MAIL_API_KEY` the app says the feature is unavailable instead of
 * pretending a message was sent.
 */
import type { NextRequest } from "next/server";
import { siteOrigin } from "./site";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

const DEFAULT_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "FitCheck <onboarding@resend.dev>";

export function mailConfigured(): boolean {
  return Boolean(process.env.MAIL_API_KEY);
}

export async function sendMail(message: MailMessage): Promise<{ delivered: boolean; error?: string }> {
  const apiKey = process.env.MAIL_API_KEY;
  if (!apiKey) return { delivered: false, error: "mail is not configured" };

  try {
    const response = await fetch(process.env.MAIL_API_URL || DEFAULT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from: process.env.MAIL_FROM || DEFAULT_FROM, ...message }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return { delivered: false, error: `provider returned ${response.status}: ${detail.slice(0, 200)}` };
    }
    return { delivered: true };
  } catch (err) {
    return { delivered: false, error: err instanceof Error ? err.message : "could not reach the mail provider" };
  }
}

export function passwordResetEmail(link: string): MailMessage["text"] {
  return [
    "Someone asked to reset the password for your FitCheck account.",
    "",
    `Set a new password: ${link}`,
    "",
    "The link works once and expires in an hour. If this was not you, you can ignore this email — your password stays the same.",
  ].join("\n");
}

export function verifyEmailText(link: string): MailMessage["text"] {
  return [
    "Confirm this address so FitCheck can reach you about your account.",
    "",
    `Verify your email: ${link}`,
    "",
    "The link works once and expires in seven days.",
  ].join("\n");
}

/**
 * Links must point at the deployment rather than at whatever host the request
 * arrived on, so a configured origin wins over the request's own.
 */
export function appOrigin(req: NextRequest): string {
  return siteOrigin(req.nextUrl.origin);
}
