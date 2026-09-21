import type { Company } from "./companies";

export type Sponsorship = "often" | "sometimes" | "unknown";

const OFTEN = new Set([
  "google",
  "apple",
  "microsoft",
  "amazon",
  "meta",
  "netflix",
  "nvidia",
  "tesla",
  "openai",
  "anthropic",
  "salesforce",
  "adobe",
  "airbnb",
  "ibm",
  "oracle",
  "jpmorgan",
  "goldman",
  "deloitte",
  "intel",
  "cisco",
  "amd",
  "servicenow",
  "snowflake",
  "pinterest",
  "snap",
  "bankofamerica",
  "wellsfargo",
  "citi",
  "morganstanley",
  "visa",
  "mastercard",
  "paypal",
  "capitalone",
  "unitedhealth",
  "cvs",
  "cigna",
  "humana",
  "abbott",
  "medtronic",
  "elililly",
  "boeing",
  "lockheed",
  "disney",
  "exxon",
  "chevron",
  "accenture",
  "mckinsey",
  "bcg",
  "pwc",
  "ey",
  "kpmg",
]);

const SOMETIMES = new Set([
  "walmart",
  "mayo",
  "jnj",
  "pfizer",
  "uber",
  "cleveland",
  "target",
  "costco",
  "homedepot",
  "starbucks",
  "nike",
  "cocacola",
  "pepsico",
  "pg",
  "gm",
  "ford",
  "caterpillar",
  "comcast",
  "fedex",
  "ups",
  "att",
  "verizon",
  "tmobile",
]);

export function sponsorshipFor(company: Company): Sponsorship {
  if (OFTEN.has(company.id)) return "often";
  if (SOMETIMES.has(company.id)) return "sometimes";
  return "unknown";
}

export function sponsorshipLabel(company: Company): string {
  const level = sponsorshipFor(company);
  if (level === "often") return "Often sponsors H-1B roles";
  if (level === "sometimes") return "Sponsorship varies by role";
  return "Sponsorship data not listed";
}
