import type { MetadataRoute } from "next";
import { requestOrigin, WORKSPACE_ROUTES } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await requestOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/privacy", "/terms"],
        // The API answers JSON only, and the workspace pages are noindex as
        // well, so a stray crawl of them costs nothing but noise.
        disallow: ["/api/", ...WORKSPACE_ROUTES],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
