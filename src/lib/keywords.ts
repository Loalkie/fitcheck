/**
 * Vocabulary shared by the resume writer, the tailor, and the audit: what US
 * postings commonly ask for, and what counts as weak language.
 */

/** Terms worth mirroring when a posting asks for them. */
export const SKILL_POOL: string[] = [
  "Python",
  "Java",
  "Go",
  "TypeScript",
  "JavaScript",
  "C++",
  "C#",
  "Ruby",
  "Rust",
  "Swift",
  "Kotlin",
  "SQL",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Snowflake",
  "Databricks",
  "Spark",
  "Airflow",
  "dbt",
  "ETL",
  "AWS",
  "Azure",
  "GCP",
  "Docker",
  "Kubernetes",
  "Terraform",
  "CI/CD",
  "Linux",
  "Bash",
  "Git",
  "GraphQL",
  "REST APIs",
  "Microservices",
  "Event-driven",
  "Kafka",
  "RabbitMQ",
  "Observability",
  "Monitoring",
  "OAuth",
  "SSO",
  "Security",
  "SOC 2",
  "HIPAA",
  "GDPR",
  "Machine Learning",
  "Deep Learning",
  "LLM",
  "AI Agents",
  "Prompt Engineering",
  "RAG",
  "LangChain",
  "PyTorch",
  "TensorFlow",
  "scikit-learn",
  "Data Analysis",
  "Data Modeling",
  "Pandas",
  "Excel",
  "Power BI",
  "Tableau",
  "Looker",
  "A/B Testing",
  "Experimentation",
  "Figma",
  "User Research",
  "UX",
  "Product Strategy",
  "Roadmap",
  "Agile",
  "Scrum",
  "Kanban",
  "Jira",
  "Confluence",
  "Project Management",
  "Program Management",
  "Stakeholder Management",
  "Cross-functional",
  "Communication",
  "Leadership",
  "Mentoring",
  "Hiring",
  "Onboarding",
  "Analytics",
  "KPI",
  "OKR",
  "Forecasting",
  "Budget",
  "P&L",
  "Financial Modeling",
  "Salesforce",
  "HubSpot",
  "SAP",
  "Workday",
  "NetSuite",
  "SEO",
  "Paid Media",
  "Content Strategy",
  "Customer Success",
  "Vendor Management",
  "Compliance",
  "B2B",
  "SaaS",
  "E-commerce",
  "Fintech",
  "Healthcare",
  "Logistics",
];

/** Openers that make a bullet read as junior or passive. */
export const WEAK_VERBS = [
  "helped",
  "worked on",
  "responsible for",
  "involved in",
  "assisted",
  "participated in",
  "handled",
  "did",
  "made",
  "used",
  "was responsible",
  "tasked with",
  "duties included",
];

/**
 * Filler that makes a resume read as machine-written. The writer is told to
 * avoid these, and the linter looks for them again after the draft arrives.
 */
export const BANNED_PHRASES: string[] = [
  "responsible for",
  "helped with",
  "worked on",
  "participated in",
  "duties included",
  "seamless",
  "seamlessly",
  "robust",
  "cutting-edge",
  "state-of-the-art",
  "world-class",
  "dynamic environment",
  "passionate about",
  "results-driven",
  "detail-oriented",
  "self-starter",
  "proven track record",
  "think outside the box",
  "team player",
  "go-getter",
  "utilize",
  "utilized",
  "leverage",
  "leveraged",
  "spearheaded",
  "synergy",
  "synergies",
  "fostering",
  "streamlining",
  "facilitating",
  "elevate",
  "holistic",
  "best-in-class",
  "strong communication skills",
];

/** How often each term appears in the text, case-insensitively. */
function countOccurrences(haystack: string, term: string): number {
  const pattern = new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "gi");
  return (haystack.match(pattern) ?? []).length;
}

export interface KeywordAnalysis {
  /** Asking in the posting and already supported by the candidate's material. */
  shared: string[];
  /** Asking in the posting but absent from the candidate's material. */
  missing: string[];
}

/**
 * Splits the posting's vocabulary into "say this explicitly because you can back
 * it up" and "the posting wants this and your resume never mentions it".
 */
export function analyseKeywords(jobDescription: string, candidateMaterial = "", limit = 12): KeywordAnalysis {
  const jd = jobDescription.trim();
  if (!jd) return { shared: [], missing: [] };

  const hits = SKILL_POOL.map((term) => ({ term, count: countOccurrences(jd, term) }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);

  const shared: string[] = [];
  const missing: string[] = [];
  for (const { term } of hits) {
    if (candidateMaterial && countOccurrences(candidateMaterial, term) > 0) shared.push(term);
    else missing.push(term);
  }
  return { shared: shared.slice(0, limit), missing: missing.slice(0, limit) };
}
