import { fetchJson } from "./http";
import { getSetting } from "./settings";

export interface LiveJob {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  postedAt: string;
  remote: boolean;
  boardId?: string;
  jobId?: number;
  size: "startup" | "mid" | "enterprise";
  level: "entry" | "mid" | "senior" | "manager";
  industry: string;
}

export interface JobBoard {
  id: string;
  company: string;
  board: string;
  source: "greenhouse" | "lever";
}

export const JOB_BOARDS: JobBoard[] = [
  { id: "anthropic", company: "Anthropic", board: "anthropic", source: "greenhouse" },
  { id: "airbnb", company: "Airbnb", board: "airbnb", source: "greenhouse" },
  { id: "stripe", company: "Stripe", board: "stripe", source: "greenhouse" },
  { id: "databricks", company: "Databricks", board: "databricks", source: "greenhouse" },
  { id: "flexport", company: "Flexport", board: "flexport", source: "greenhouse" },
  { id: "figma", company: "Figma", board: "figma", source: "greenhouse" },
  { id: "reddit", company: "Reddit", board: "reddit", source: "greenhouse" },
  { id: "robinhood", company: "Robinhood", board: "robinhood", source: "greenhouse" },
  { id: "gusto", company: "Gusto", board: "gusto", source: "greenhouse" },
  { id: "dropbox", company: "Dropbox", board: "dropbox", source: "greenhouse" },
  { id: "notion", company: "Notion", board: "notion", source: "greenhouse" },
  { id: "figma", company: "Figma", board: "figma", source: "greenhouse" },
  { id: "discord", company: "Discord", board: "discord", source: "greenhouse" },
  { id: "airtable", company: "Airtable", board: "airtable", source: "greenhouse" },
  { id: "asana", company: "Asana", board: "asana", source: "greenhouse" },
  { id: "brex", company: "Brex", board: "brex", source: "greenhouse" },
  { id: "ramp", company: "Ramp", board: "ramp", source: "greenhouse" },
  { id: "chime", company: "Chime", board: "chime", source: "greenhouse" },
  { id: "grammarly", company: "Grammarly", board: "grammarly", source: "greenhouse" },
  { id: "hubspot", company: "HubSpot", board: "hubspot", source: "greenhouse" },
  { id: "zendesk", company: "Zendesk", board: "zendesk", source: "greenhouse" },
  { id: "twilio", company: "Twilio", board: "twilio", source: "greenhouse" },
  { id: "okta", company: "Okta", board: "okta", source: "greenhouse" },
  { id: "cloudflare", company: "Cloudflare", board: "cloudflare", source: "greenhouse" },
  { id: "datadog", company: "Datadog", board: "datadog", source: "greenhouse" },
  { id: "mongodb", company: "MongoDB", board: "mongodb", source: "greenhouse" },
  { id: "instacart", company: "Instacart", board: "instacart", source: "greenhouse" },
  { id: "doordash", company: "DoorDash", board: "doordash", source: "greenhouse" },
  { id: "etsy", company: "Etsy", board: "etsy", source: "greenhouse" },
  { id: "wayfair", company: "Wayfair", board: "wayfair", source: "greenhouse" },
  { id: "chewy", company: "Chewy", board: "chewy", source: "greenhouse" },
  { id: "duolingo", company: "Duolingo", board: "duolingo", source: "greenhouse" },
  { id: "calm", company: "Calm", board: "calm", source: "greenhouse" },
  { id: "headspace", company: "Headspace", board: "headspace", source: "greenhouse" },
  { id: "patreon", company: "Patreon", board: "patreon", source: "greenhouse" },
  { id: "substack", company: "Substack", board: "substack", source: "greenhouse" },
  { id: "benchling", company: "Benchling", board: "benchling", source: "greenhouse" },
  { id: "samsara", company: "Samsara", board: "samsara", source: "greenhouse" },
  { id: "deel", company: "Deel", board: "deel", source: "greenhouse" },
  { id: "remote", company: "Remote", board: "remote", source: "greenhouse" },
  { id: "vercel", company: "Vercel", board: "vercel", source: "greenhouse" },
  { id: "supabase", company: "Supabase", board: "supabase", source: "greenhouse" },
  { id: "postman", company: "Postman", board: "postman", source: "greenhouse" },
  { id: "gitlab", company: "GitLab", board: "gitlab", source: "greenhouse" },
  { id: "hashicorp", company: "HashiCorp", board: "hashicorp", source: "greenhouse" },
  { id: "confluent", company: "Confluent", board: "confluent", source: "greenhouse" },
  { id: "crowdstrike", company: "CrowdStrike", board: "crowdstrike", source: "greenhouse" },
  { id: "zscaler", company: "Zscaler", board: "zscaler", source: "greenhouse" },
  { id: "palantir", company: "Palantir", board: "palantir", source: "greenhouse" },
  { id: "squarespace", company: "Squarespace", board: "squarespace", source: "greenhouse" },
];

const BOARD_SIZES: Record<string, LiveJob["size"]> = {
  anthropic: "mid",
  airbnb: "enterprise",
  stripe: "enterprise",
  databricks: "enterprise",
  flexport: "mid",
  figma: "mid",
  reddit: "mid",
  robinhood: "mid",
  gusto: "mid",
  dropbox: "mid",
  notion: "startup",
  discord: "mid",
  airtable: "mid",
  asana: "mid",
  brex: "mid",
  ramp: "startup",
  chime: "mid",
  grammarly: "mid",
  hubspot: "enterprise",
  zendesk: "mid",
  twilio: "mid",
  okta: "mid",
  cloudflare: "enterprise",
  datadog: "enterprise",
  mongodb: "enterprise",
  instacart: "mid",
  doordash: "mid",
  etsy: "mid",
  wayfair: "mid",
  chewy: "mid",
  duolingo: "mid",
  calm: "startup",
  headspace: "startup",
  patreon: "startup",
  substack: "startup",
  benchling: "startup",
  samsara: "mid",
  deel: "mid",
  remote: "mid",
  vercel: "startup",
  supabase: "startup",
  postman: "mid",
  gitlab: "mid",
  hashicorp: "mid",
  confluent: "mid",
  crowdstrike: "enterprise",
  zscaler: "enterprise",
  palantir: "enterprise",
};

const BOARD_INDUSTRIES: Record<string, string> = {
  squarespace: "Technology / Software",
  duolingo: "Education",
  calm: "Healthcare",
  headspace: "Healthcare",
  instacart: "E-commerce",
  doordash: "E-commerce",
  etsy: "E-commerce",
  wayfair: "E-commerce",
  chewy: "E-commerce",
  chime: "FinTech",
  brex: "FinTech",
  ramp: "FinTech",
  robinhood: "FinTech",
  stripe: "FinTech",
  palantir: "Government / Enterprise Software",
  crowdstrike: "Cybersecurity",
  zscaler: "Cybersecurity",
  okta: "Cybersecurity",
  cloudflare: "Cybersecurity",
  datadog: "Enterprise SaaS",
  confluent: "Enterprise SaaS",
  hashicorp: "Enterprise SaaS",
  gitlab: "Enterprise SaaS",
  postman: "Enterprise SaaS",
  figma: "Technology / Software",
  notion: "Technology / Software",
  discord: "Media & Marketing",
  reddit: "Media & Marketing",
  patreon: "Media & Marketing",
  substack: "Media & Marketing",
  grammarly: "Enterprise SaaS",
  hubspot: "Enterprise SaaS",
  zendesk: "Enterprise SaaS",
  twilio: "Enterprise SaaS",
};

interface GreenhouseJob {
  id: number;
  internal_job_id?: number;
  title: string;
  absolute_url: string;
  location?: { name?: string };
  updated_at?: string;
}

function greenhouseUrl(board: string): string {
  return `https://boards-api.greenhouse.io/v1/boards/${board}/jobs`;
}

function leverUrl(board: string): string {
  return `https://api.lever.co/v0/postings/${board}?mode=json`;
}

function detectLevel(title: string): LiveJob["level"] {
  const lower = title.toLowerCase();
  if (/(intern|apprentice|entry|junior|graduate|new grad)/.test(lower)) return "entry";
  if (/(manager|director|head|vp|president|chief)/.test(lower)) return "manager";
  if (/(senior|staff|principal|lead)/.test(lower)) return "senior";
  return "mid";
}

function normalizeGreenhouse(jobs: GreenhouseJob[], board: JobBoard): LiveJob[] {
  return jobs.map((job) => ({
    id: `${board.source}-${board.id}-${job.internal_job_id ?? job.id}`,
    title: job.title,
    company: board.company,
    location: job.location?.name || "United States",
    url: job.absolute_url,
    source: board.company,
    postedAt: job.updated_at || "",
    remote: (job.location?.name || "").toLowerCase().includes("remote"),
    boardId: board.board,
    jobId: job.id,
    size: BOARD_SIZES[board.id] ?? "mid",
    level: detectLevel(job.title),
    industry: BOARD_INDUSTRIES[board.id] ?? "Technology / Software",
  }));
}

interface LeverJob {
  id?: string;
  text?: string;
  categories?: { location?: string };
  hostedUrl?: string;
  createdAt?: number;
}

function normalizeLever(jobs: LeverJob[], board: JobBoard): LiveJob[] {
  return jobs
    .filter((job) => job.text && job.hostedUrl)
    .map((job) => ({
      id: `lever-${board.id}-${job.id ?? job.hostedUrl}`,
      title: job.text!,
      company: board.company,
      location: job.categories?.location || "United States",
      url: job.hostedUrl!,
      source: board.company,
      postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : "",
      remote: (job.categories?.location || "").toLowerCase().includes("remote"),
      size: BOARD_SIZES[board.id] ?? "mid",
      level: detectLevel(job.text!),
      industry: BOARD_INDUSTRIES[board.id] ?? "Technology / Software",
    }));
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

interface GreenhouseJobDetail {
  content?: string;
  title?: string;
}

export async function getLiveJobDescription(job: LiveJob): Promise<string> {
  if (job.boardId && job.jobId) {
    const url = `https://boards-api.greenhouse.io/v1/boards/${job.boardId}/jobs/${job.jobId}`;
    const data = await fetchJson<GreenhouseJobDetail>(url, 12_000);
    return stripHtml(data.content ?? "");
  }
  return `Role: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}\nSource: ${job.url}\n\nOpen the posting for full requirements.`;
}

interface AdzunaResult {
  id?: string;
  title?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  redirect_url?: string;
  created?: string;
}

interface AdzunaResponse {
  results?: AdzunaResult[];
}

async function fetchAdzuna(query: string, remoteOnly: boolean): Promise<LiveJob[]> {
  const appId = getSetting("ADZUNA_APP_ID") || process.env.ADZUNA_APP_ID;
  const appKey = getSetting("ADZUNA_APP_KEY") || process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: "50",
    content_type: "application/json",
  });
  if (query) params.set("what", query);
  params.set("where", remoteOnly ? "Remote" : "United States");

  const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?${params.toString()}`;
  const data = await fetchJson<AdzunaResponse>(url, 15_000);
  return (data.results ?? [])
    .filter((r) => r.title && r.redirect_url)
    .map((r) => ({
      id: `adzuna-${r.id ?? Math.random().toString(36).slice(2)}`,
      title: r.title!,
      company: r.company?.display_name || "US employer",
      location: r.location?.display_name || "United States",
      url: r.redirect_url!,
      source: "Adzuna",
      postedAt: r.created || "",
      remote: (r.location?.display_name || "").toLowerCase().includes("remote"),
      size: "mid",
      level: detectLevel(r.title || ""),
      industry: "US Jobs",
    }));
}

interface USAJobsItem {
  MatchedObjectDescriptor?: {
    PositionTitle?: string;
    OrganizationName?: string;
    PositionLocationDisplay?: string;
    PositionURI?: string;
    PublicationStartDate?: string;
  };
}

interface USAJobsResponse {
  SearchResult?: { SearchResultItems?: USAJobsItem[] };
}

async function fetchUsaJobs(query: string): Promise<LiveJob[]> {
  const apiKey = getSetting("USAJOBS_API_KEY") || process.env.USAJOBS_API_KEY;
  const email = getSetting("USAJOBS_EMAIL") || process.env.USAJOBS_EMAIL;
  if (!apiKey || !email) return [];

  const params = new URLSearchParams({ ResultsPerPage: "50" });
  if (query) params.set("Keyword", query);
  const url = `https://data.usajobs.gov/api/search?${params.toString()}`;
  const data = await fetchJson<USAJobsResponse>(url, 15_000, {
    "Host": "data.usajobs.gov",
    "User-Agent": email,
    "Authorization-Key": apiKey,
  });
  return (data.SearchResult?.SearchResultItems ?? [])
    .filter((item) => item.MatchedObjectDescriptor?.PositionTitle && item.MatchedObjectDescriptor?.PositionURI)
    .map((item) => ({
      id: `usajobs-${item.MatchedObjectDescriptor!.PositionURI}`,
      title: item.MatchedObjectDescriptor!.PositionTitle!,
      company: item.MatchedObjectDescriptor!.OrganizationName || "US Federal Government",
      location: item.MatchedObjectDescriptor!.PositionLocationDisplay || "United States",
      url: item.MatchedObjectDescriptor!.PositionURI!,
      source: "USAJobs",
      postedAt: item.MatchedObjectDescriptor!.PublicationStartDate || "",
      remote: (item.MatchedObjectDescriptor!.PositionLocationDisplay || "").toLowerCase().includes("remote"),
      size: "enterprise",
      level: detectLevel(item.MatchedObjectDescriptor!.PositionTitle!),
      industry: "Government",
    }));
}

interface RemotiveJob {
  id?: number;
  title?: string;
  company_name?: string;
  url?: string;
  candidate_required_location?: string;
  publication_date?: string;
}

interface RemotiveResponse {
  jobs?: RemotiveJob[];
}

async function fetchRemotive(query: string): Promise<LiveJob[]> {
  const params = new URLSearchParams({ limit: "100" });
  if (query) params.set("search", query);
  const url = `https://remotive.com/api/remote-jobs?${params.toString()}`;
  const data = await fetchJson<RemotiveResponse>(url, 15_000);
  return (data.jobs ?? [])
    .filter((job) => job.title && job.url && job.company_name)
    .map((job) => ({
      id: `remotive-${job.id ?? job.url}`,
      title: job.title!,
      company: job.company_name!,
      location: job.candidate_required_location || "Remote",
      url: job.url!,
      source: "Remotive",
      postedAt: job.publication_date || "",
      remote: true,
      size: "mid",
      level: detectLevel(job.title!),
      industry: "Remote Jobs",
    }));
}

interface TheMuseJob {
  id?: number;
  name?: string;
  company?: { name?: string };
  locations?: { name?: string }[];
  refs?: { landing_page?: string };
  publication_date?: string;
}

interface TheMuseResponse {
  results?: TheMuseJob[];
}

async function fetchTheMuse(): Promise<LiveJob[]> {
  const pages = [0, 1, 2, 3, 4];
  const results = await Promise.all(
    pages.map(async (page) => {
      const url = `https://www.themuse.com/api/public/jobs?page=${page}&descending=true`;
      const data = await fetchJson<TheMuseResponse>(url, 15_000);
      return data.results ?? [];
    }),
  );
  return results
    .flat()
    .filter((job) => job.name && job.company?.name && job.refs?.landing_page)
    .map((job) => ({
      id: `muse-${job.id ?? job.refs!.landing_page}`,
      title: job.name!,
      company: job.company!.name!,
      location: job.locations?.map((l) => l.name).join(", ") || "United States",
      url: job.refs!.landing_page!,
      source: "The Muse",
      postedAt: job.publication_date || "",
      remote: (job.locations?.map((l) => l.name).join(", ") || "").toLowerCase().includes("remote"),
      size: "mid",
      level: detectLevel(job.name!),
      industry: "US Jobs",
    }));
}

let cache: { at: number; jobs: LiveJob[] } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function getLiveJobs(options: {
  query?: string;
  company?: string;
  remote?: boolean;
  limit?: number;
} = {}): Promise<LiveJob[]> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL) {
    return filterJobs(cache.jobs, options);
  }

  const boardResults = await Promise.all(
    JOB_BOARDS.map(async (board) => {
      try {
        if (board.source === "lever") {
          const data = await fetchJson<LeverJob[]>(leverUrl(board.board), 12_000);
          return normalizeLever(data, board);
        }
        const data = await fetchJson<{ jobs?: GreenhouseJob[] }>(greenhouseUrl(board.board), 12_000);
        return normalizeGreenhouse(data.jobs ?? [], board);
      } catch (err) {
        console.error(`[jobfeed] ${board.company} failed:`, err);
        return [] as LiveJob[];
      }
    }),
  );

  const adzunaJobs = await fetchAdzuna(options.query || "", Boolean(options.remote)).catch(() => [] as LiveJob[]);
  const usaJobs = await fetchUsaJobs(options.query || "").catch(() => [] as LiveJob[]);
  const remotiveJobs = await fetchRemotive(options.query || "").catch(() => [] as LiveJob[]);
  const museJobs = await fetchTheMuse().catch(() => [] as LiveJob[]);
  const combined = [...adzunaJobs, ...usaJobs, ...remotiveJobs, ...museJobs, ...boardResults.flat()].sort((a, b) =>
    (b.postedAt || "").localeCompare(a.postedAt || ""),
  );

  cache = { at: now, jobs: combined };
  return filterJobs(combined, options);
}

function filterJobs(
  jobs: LiveJob[],
  options: { query?: string; company?: string; remote?: boolean; limit?: number },
): LiveJob[] {
  const q = options.query?.trim().toLowerCase() || "";
  const company = options.company?.trim().toLowerCase() || "";
  const filtered = jobs.filter((job) => {
    if (options.remote && !job.remote) return false;
    if (company && !job.company.toLowerCase().includes(company)) return false;
    if (q) {
      const haystack = `${job.title} ${job.company} ${job.location}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
  return filtered.slice(0, options.limit ?? 100);
}
