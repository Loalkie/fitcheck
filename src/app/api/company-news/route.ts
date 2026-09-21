import { NextRequest, NextResponse } from "next/server";
import { get as httpsGet } from "https";

export const runtime = "nodejs";
export const maxDuration = 30;

interface NewsItem {
  title: string;
  link: string;
  date: string;
  source: string;
}

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = httpsGet(
      url,
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; JobFitBot/1.0)" },
        // Local dev machines often lack the full CA chain for Google/HN.
        rejectUnauthorized: false,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location;
        if ([301, 302, 303, 307, 308].includes(status) && location) {
          res.resume();
          const next = new URL(location, url).toString();
          fetchText(next).then(resolve, reject);
          return;
        }
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (status >= 200 && status < 400) resolve(data);
          else reject(new Error(`HTTP ${status}`));
        });
      },
    );
    req.setTimeout(15_000, () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

function stripCdata(value: string): string {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function htmlToText(value: string): string {
  return stripCdata(value)
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function parseRss(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.split(/<item[^>]*>/i).slice(1);
  for (const block of blocks) {
    const title = htmlToText(block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    const link = stripCdata(block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ?? "").trim();
    const date = htmlToText(block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] ?? "");
    const source = htmlToText(block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] ?? "");
    if (title && link) items.push({ title, link, date, source });
    if (items.length >= 8) break;
  }
  return items;
}

async function fetchHackerNews(company: string): Promise<NewsItem[]> {
  const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(company)}&tags=story&hitsPerPage=8`;
  const text = await fetchText(url);
  const data = JSON.parse(text) as {
    hits?: { title?: string; url?: string; objectID?: string; created_at?: string }[];
  };
  return (data.hits ?? [])
    .filter((h) => h.title)
    .slice(0, 8)
    .map((h) => ({
      title: h.title!.replace(/<[^>]*>/g, "").trim(),
      link: h.url || `https://news.ycombinator.com/item?id=${h.objectID ?? ""}`,
      date: h.created_at ? new Date(h.created_at).toLocaleDateString("en-US") : "",
      source: "Hacker News",
    }));
}

export async function GET(request: NextRequest) {
  const company = request.nextUrl.searchParams.get("company")?.trim() ?? "";
  if (!company) return NextResponse.json({ error: "Missing company." }, { status: 400 });

  const query = encodeURIComponent(`${company} hiring OR news`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

  try {
    let items: NewsItem[] = [];
    try {
      const xml = await fetchText(url);
      items = parseRss(xml);
    } catch (googleErr) {
      console.error("[api/company-news] google news failed:", googleErr);
    }

    if (items.length === 0) {
      items = await fetchHackerNews(company);
    }

    return NextResponse.json({ company, items });
  } catch (err) {
    console.error("[api/company-news]", err);
    try {
      const items = await fetchHackerNews(company);
      return NextResponse.json({ company, items });
    } catch (fallbackErr) {
      console.error("[api/company-news] fallback failed:", fallbackErr);
      return NextResponse.json({
        company,
        items: [],
        error: err instanceof Error ? err.message : "News feed unavailable.",
      });
    }
  }
}
