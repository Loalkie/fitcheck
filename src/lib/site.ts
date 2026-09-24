/**
 * Where this deployment lives, for links that leave the request context:
 * robots, sitemap, and the links inside transactional email. `APP_ORIGIN` wins
 * so a preview deployment can still point at the canonical domain.
 */
import { headers } from "next/headers";

export const DEFAULT_ORIGIN = "https://fitcheck-68fa.vercel.app";

export function siteOrigin(fallback?: string): string {
  const configured = process.env.APP_ORIGIN?.trim().replace(/\/+$/, "");
  return configured || fallback || DEFAULT_ORIGIN;
}

/**
 * Absolute origin for the crawler-facing files. Unlike `siteOrigin`, this reads
 * the request the answer is being generated for, so a preview deployment
 * advertises the domain it actually answers on instead of the built-in one.
 * `APP_ORIGIN` still wins, for a canonical domain that differs from the host.
 */
export async function requestOrigin(): Promise<string> {
  const configured = process.env.APP_ORIGIN?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  try {
    const store = await headers();
    const host = store.get("x-forwarded-host") ?? store.get("host");
    if (host) {
      const proto = store.get("x-forwarded-proto") ?? "https";
      return `${proto}://${host}`;
    }
  } catch {
    // No request scope (a build-time prerender), so fall back to the default.
  }
  return DEFAULT_ORIGIN;
}

/**
 * Pages behind the app shell. They stay reachable without an account (the
 * workspace works locally, with no server behind it), but they are a tool
 * surface rather than marketing, so crawlers are told to stay out. `/pricing`,
 * `/privacy` and `/terms` are deliberately not in this list.
 */
export const WORKSPACE_ROUTES = [
  "/ai-resume",
  "/autopilot",
  "/companies",
  "/contacts",
  "/dashboard",
  "/fit-check",
  "/insights",
  "/interview-prep",
  "/jobs",
  "/jobs-feed",
  "/outreach",
  "/profile",
  "/radar",
  "/reminders",
  "/reset-password",
  "/resume",
  "/salary",
  "/settings",
  "/verify-email",
];

/** The pages a search engine is welcome to index. */
export const PUBLIC_ROUTES = ["/", "/pricing", "/privacy", "/terms"];
