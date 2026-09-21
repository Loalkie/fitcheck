import { fetchText } from "./http";

export interface ExtractedJob {
  title: string;
  company: string;
  location: string;
  description: string;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]*>/g, "\n"),
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function extractJsonLd(html: string): Record<string, unknown> | null {
  const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const script of scripts) {
    const body = script.replace(/<[^>]*>/g, "");
    try {
      const parsed = JSON.parse(body);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const candidate of candidates) {
        if (candidate && typeof candidate === "object") {
          const type = String((candidate as Record<string, unknown>)["@type"] ?? "");
          if (type.toLowerCase().includes("jobposting")) {
            return candidate as Record<string, unknown>;
          }
        }
      }
    } catch {
      // continue
    }
  }
  return null;
}

function valueOf(unknown: unknown): string {
  if (typeof unknown === "string") return unknown;
  if (unknown && typeof unknown === "object") {
    const obj = unknown as Record<string, unknown>;
    return valueOf(obj.name ?? obj.address ?? obj.value ?? "");
  }
  return "";
}

export async function extractJobFromUrl(url: string): Promise<ExtractedJob> {
  const html = await fetchText(url, 20_000, {
    "User-Agent": "Mozilla/5.0 (compatible; FitCheckBot/1.0)",
  });
  const jsonLd = extractJsonLd(html);
  if (jsonLd) {
    const org = (jsonLd.hiringOrganization ?? jsonLd.employer) as unknown;
    const location = (jsonLd.jobLocation ?? jsonLd.applicantLocationRequirements) as unknown;
    const description = stripHtml(valueOf(jsonLd.description));
    if (description.length > 40) {
      return {
        title: valueOf(jsonLd.title) || "Untitled role",
        company: valueOf(org) || "",
        location: valueOf(location) || "",
        description,
      };
    }
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = decodeEntities(titleMatch?.[1]?.trim() || "").split("|")[0].trim();
  return {
    title,
    company: "",
    location: "",
    description: stripHtml(html).slice(0, 12000),
  };
}
