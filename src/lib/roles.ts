export interface RoleInfo {
  id: string;
  title: string;
  salaryMin: number;
  salaryMax: number;
  typicalEducation: string;
  topSkills: string[];
  outlook: string;
}

// Approximate US national median base salary (USD/year). Varies by location, level, and company.
export const ROLES: RoleInfo[] = [
  { id: "swe", title: "Software Engineer", salaryMin: 105000, salaryMax: 165000, typicalEducation: "Bachelor's", topSkills: ["Python", "TypeScript", "SQL", "Data Structures", "Git"], outlook: "Strong growth" },
  { id: "frontend", title: "Frontend Engineer", salaryMin: 100000, salaryMax: 155000, typicalEducation: "Bachelor's", topSkills: ["JavaScript", "React", "TypeScript", "CSS", "Accessibility"], outlook: "Strong growth" },
  { id: "backend", title: "Backend Engineer", salaryMin: 105000, salaryMax: 165000, typicalEducation: "Bachelor's", topSkills: ["Python", "Node.js", "SQL", "APIs", "System Design"], outlook: "Strong growth" },
  { id: "ai-ml", title: "AI/ML Engineer", salaryMin: 125000, salaryMax: 195000, typicalEducation: "Master's", topSkills: ["Python", "Machine Learning", "LLMs", "PyTorch", "MLOps"], outlook: "Very strong growth" },
  { id: "ai-research", title: "AI Research Scientist", salaryMin: 150000, salaryMax: 230000, typicalEducation: "PhD", topSkills: ["Deep Learning", "NLP", "Transformers", "Python", "Research"], outlook: "Very strong growth" },
  { id: "ds", title: "Data Scientist", salaryMin: 110000, salaryMax: 170000, typicalEducation: "Master's", topSkills: ["Python", "Statistics", "SQL", "Machine Learning", "A/B Testing"], outlook: "Strong growth" },
  { id: "de", title: "Data Engineer", salaryMin: 110000, salaryMax: 170000, typicalEducation: "Bachelor's", topSkills: ["SQL", "Python", "ETL", "Spark", "Airflow"], outlook: "Strong growth" },
  { id: "da", title: "Data Analyst", salaryMin: 75000, salaryMax: 115000, typicalEducation: "Bachelor's", topSkills: ["SQL", "Excel", "Tableau", "Python", "Analytics"], outlook: "Steady growth" },
  { id: "devops", title: "DevOps / SRE", salaryMin: 115000, salaryMax: 170000, typicalEducation: "Bachelor's", topSkills: ["Linux", "Docker", "Kubernetes", "AWS", "Terraform"], outlook: "Strong growth" },
  { id: "security", title: "Security Engineer", salaryMin: 115000, salaryMax: 175000, typicalEducation: "Bachelor's", topSkills: ["Network Security", "Cloud Security", "Pen Testing", "SIEM", "Python"], outlook: "Strong growth" },
  { id: "pm", title: "Product Manager", salaryMin: 115000, salaryMax: 175000, typicalEducation: "Bachelor's", topSkills: ["Product Strategy", "Roadmapping", "Analytics", "Communication", "Agile"], outlook: "Strong growth" },
  { id: "design", title: "Product Designer (UX/UI)", salaryMin: 95000, salaryMax: 150000, typicalEducation: "Bachelor's", topSkills: ["Figma", "UX Research", "Prototyping", "Design Systems", "Interaction Design"], outlook: "Steady growth" },
  { id: "uxr", title: "UX Researcher", salaryMin: 95000, salaryMax: 145000, typicalEducation: "Master's", topSkills: ["User Research", "Interviews", "Usability Testing", "Statistics", "Communication"], outlook: "Steady growth" },
  { id: "tpm", title: "Technical Program Manager", salaryMin: 120000, salaryMax: 175000, typicalEducation: "Bachelor's", topSkills: ["Program Management", "Agile", "Stakeholder Management", "Technical Fluency", "Delivery"], outlook: "Strong growth" },
  { id: "em", title: "Engineering Manager", salaryMin: 160000, salaryMax: 230000, typicalEducation: "Bachelor's", topSkills: ["Leadership", "People Management", "System Design", "Delivery", "Hiring"], outlook: "Strong growth" },
  { id: "se", title: "Solutions Engineer", salaryMin: 105000, salaryMax: 155000, typicalEducation: "Bachelor's", topSkills: ["APIs", "Integration", "Technical Demos", "Communication", "Sales"], outlook: "Steady growth" },
  { id: "marketing", title: "Marketing Manager", salaryMin: 80000, salaryMax: 125000, typicalEducation: "Bachelor's", topSkills: ["Marketing Strategy", "SEO", "Content", "Analytics", "Campaigns"], outlook: "Steady growth" },
  { id: "sales", title: "Account Executive (Sales)", salaryMin: 70000, salaryMax: 130000, typicalEducation: "Bachelor's", topSkills: ["Sales", "CRM", "Negotiation", "Pipeline", "Prospecting"], outlook: "Steady growth" },
  { id: "csm", title: "Customer Success Manager", salaryMin: 70000, salaryMax: 110000, typicalEducation: "Bachelor's", topSkills: ["Relationship Management", "Onboarding", "Communication", "CRM", "Retention"], outlook: "Steady growth" },
  { id: "hr", title: "People / HR Operations", salaryMin: 65000, salaryMax: 100000, typicalEducation: "Bachelor's", topSkills: ["HR", "Recruiting", "Compliance", "Employee Relations", "Payroll"], outlook: "Steady growth" },
  { id: "finance", title: "Finance / Accounting Analyst", salaryMin: 70000, salaryMax: 105000, typicalEducation: "Bachelor's", topSkills: ["Excel", "Financial Modeling", "GAAP", "Forecasting", "Reporting"], outlook: "Steady growth" },
  { id: "tw", title: "Technical Writer", salaryMin: 70000, salaryMax: 105000, typicalEducation: "Bachelor's", topSkills: ["Technical Writing", "Documentation", "APIs", "Communication", "Editing"], outlook: "Steady growth" },
  { id: "ba", title: "Business Analyst", salaryMin: 75000, salaryMax: 115000, typicalEducation: "Bachelor's", topSkills: ["Requirements Gathering", "SQL", "Excel", "Process Mapping", "Communication"], outlook: "Steady growth" },
  { id: "fa", title: "Financial Analyst", salaryMin: 70000, salaryMax: 110000, typicalEducation: "Bachelor's", topSkills: ["Excel", "Financial Modeling", "SQL", "Forecasting", "Reporting"], outlook: "Steady growth" },
  { id: "quant", title: "Quantitative Analyst", salaryMin: 110000, salaryMax: 190000, typicalEducation: "Master's", topSkills: ["Python", "Statistics", "SQL", "Financial Modeling", "Risk"], outlook: "Strong growth" },
  { id: "risk", title: "Risk Analyst", salaryMin: 70000, salaryMax: 115000, typicalEducation: "Bachelor's", topSkills: ["Risk Management", "SQL", "Excel", "Compliance", "Analytics"], outlook: "Steady growth" },
  { id: "healthcare-analyst", title: "Healthcare Analyst", salaryMin: 70000, salaryMax: 110000, typicalEducation: "Bachelor's", topSkills: ["SQL", "Healthcare", "Excel", "Python", "Analytics"], outlook: "Steady growth" },
  { id: "supply-chain", title: "Supply Chain Analyst", salaryMin: 65000, salaryMax: 100000, typicalEducation: "Bachelor's", topSkills: ["SQL", "Excel", "Supply Chain", "Forecasting", "Logistics"], outlook: "Steady growth" },
  { id: "operations", title: "Operations Manager", salaryMin: 80000, salaryMax: 130000, typicalEducation: "Bachelor's", topSkills: ["Operations", "Leadership", "Process Improvement", "Analytics", "Communication"], outlook: "Steady growth" },
  { id: "network", title: "Network Engineer", salaryMin: 90000, salaryMax: 140000, typicalEducation: "Bachelor's", topSkills: ["Networking", "Cisco", "Cloud", "Security", "Automation"], outlook: "Steady growth" },
  { id: "mechanical", title: "Mechanical Engineer", salaryMin: 80000, salaryMax: 125000, typicalEducation: "Bachelor's", topSkills: ["CAD", "Mechanical Design", "Manufacturing", "Thermal Analysis", "SolidWorks"], outlook: "Steady growth" },
  { id: "electrical", title: "Electrical Engineer", salaryMin: 85000, salaryMax: 135000, typicalEducation: "Bachelor's", topSkills: ["Circuit Design", "Embedded Systems", "PCB", "Electronics", "Testing"], outlook: "Steady growth" },
  { id: "chemical", title: "Chemical Engineer", salaryMin: 85000, salaryMax: 135000, typicalEducation: "Bachelor's", topSkills: ["Process Engineering", "Chemistry", "Manufacturing", "Safety", "Simulation"], outlook: "Steady growth" },
  { id: "biomedical", title: "Biomedical Engineer", salaryMin: 75000, salaryMax: 120000, typicalEducation: "Bachelor's", topSkills: ["Biomedical Devices", "FDA", "Python", "Clinical Data", "Regulatory"], outlook: "Steady growth" },
  { id: "consultant", title: "Consultant", salaryMin: 90000, salaryMax: 160000, typicalEducation: "Bachelor's", topSkills: ["Strategy", "Analytics", "Communication", "Excel", "Problem Solving"], outlook: "Strong growth" },
  { id: "sdr", title: "Sales Development Representative", salaryMin: 50000, salaryMax: 85000, typicalEducation: "Bachelor's", topSkills: ["Sales", "CRM", "Prospecting", "Communication", "Cold Outreach"], outlook: "Steady growth" },
  { id: "recruiter", title: "Recruiter", salaryMin: 55000, salaryMax: 90000, typicalEducation: "Bachelor's", topSkills: ["Recruiting", "Sourcing", "Communication", "ATS", "Relationship Management"], outlook: "Steady growth" },
  { id: "content", title: "Content Strategist", salaryMin: 65000, salaryMax: 105000, typicalEducation: "Bachelor's", topSkills: ["Content Strategy", "SEO", "Copywriting", "Analytics", "Editorial"], outlook: "Steady growth" },
  { id: "compliance", title: "Compliance Analyst", salaryMin: 65000, salaryMax: 105000, typicalEducation: "Bachelor's", topSkills: ["Compliance", "Regulatory", "SQL", "Risk", "Audit"], outlook: "Steady growth" },
  { id: "project-manager", title: "Project Manager", salaryMin: 85000, salaryMax: 140000, typicalEducation: "Bachelor's", topSkills: ["Project Management", "Stakeholder Management", "Budgeting", "Agile", "Communication"], outlook: "Steady growth" },
  { id: "bdm", title: "Business Development Manager", salaryMin: 75000, salaryMax: 135000, typicalEducation: "Bachelor's", topSkills: ["Business Development", "CRM", "Negotiation", "Partnerships", "Sales"], outlook: "Steady growth" },
  { id: "accountant", title: "Accountant", salaryMin: 60000, salaryMax: 100000, typicalEducation: "Bachelor's", topSkills: ["Accounting", "Excel", "GAAP", "QuickBooks", "Reporting"], outlook: "Steady growth" },
  { id: "social-media", title: "Social Media Manager", salaryMin: 55000, salaryMax: 90000, typicalEducation: "Bachelor's", topSkills: ["Social Media", "Content", "Analytics", "Copywriting", "Campaigns"], outlook: "Steady growth" },
  { id: "support", title: "Customer Support Specialist", salaryMin: 40000, salaryMax: 65000, typicalEducation: "High school", topSkills: ["Customer Support", "Communication", "CRM", "Problem Solving", "Zendesk"], outlook: "Steady growth" },
  { id: "qa", title: "Quality Assurance Engineer", salaryMin: 80000, salaryMax: 130000, typicalEducation: "Bachelor's", topSkills: ["Testing", "Automation", "SQL", "CI/CD", "Debugging"], outlook: "Steady growth" },
  { id: "pmm", title: "Product Marketing Manager", salaryMin: 95000, salaryMax: 155000, typicalEducation: "Bachelor's", topSkills: ["Product Marketing", "Go-to-Market", "Messaging", "Analytics", "Content"], outlook: "Steady growth" },
  { id: "logistics", title: "Logistics Coordinator", salaryMin: 45000, salaryMax: 70000, typicalEducation: "Associate's", topSkills: ["Logistics", "Supply Chain", "Excel", "Communication", "Operations"], outlook: "Steady growth" },
  { id: "rn", title: "Registered Nurse (RN)", salaryMin: 70000, salaryMax: 115000, typicalEducation: "Associate's", topSkills: ["Patient Care", "Clinical", "Communication", "EMR", "Nursing"], outlook: "Strong growth" },
];

export function roleById(id: string): RoleInfo | undefined {
  return ROLES.find((r) => r.id === id);
}

export const EDUCATION_LEVELS = [
  "High school",
  "Bootcamp / Self-taught",
  "Community College / Some College",
  "Associate's",
  "Bachelor's",
  "Master's",
  "PhD",
];

export const REMOTE_PREFERENCES = ["Remote", "Hybrid", "On-site", "Flexible"];

export const SKILL_OPTIONS = [
  "Python", "TypeScript", "JavaScript", "React", "Next.js", "Node.js", "SQL", "PostgreSQL",
  "AWS", "GCP", "Azure", "Docker", "Kubernetes", "CI/CD", "Git", "Machine Learning",
  "Deep Learning", "LLMs", "AI Agents", "MCP", "Prompt Engineering", "RAG", "LangChain",
  "PyTorch", "TensorFlow", "Data Analysis", "Pandas", "NumPy", "A/B Testing", "Tableau",
  "Power BI", "Figma", "UX Research", "Product Strategy", "Agile", "Program Management",
  "Technical Writing", "Documentation", "SEO", "Content Marketing", "CRM", "Salesforce",
  "Financial Modeling", "Excel", "Communication", "Leadership", "Project Management",
];

export const EXPERIENCE_OPTIONS: { label: string; value: number }[] = [
  { label: "Career transition / currently unemployed", value: 0 },
  { label: "Internship / new grad (0-1 yr)", value: 0 },
  { label: "1-3 years", value: 2 },
  { label: "3-5 years", value: 4 },
  { label: "5-10 years", value: 7 },
  { label: "10+ years", value: 10 },
];

export const WORK_AUTH_OPTIONS = [
  "US Citizen",
  "Permanent Resident (Green Card)",
  "OPT / CPT (F-1 student)",
  "H-1B / work visa",
  "TN visa (Canada / Mexico)",
  "Other / need sponsorship",
];

export const INDUSTRY_OPTIONS = [
  "Technology / Software", "AI & Machine Learning", "FinTech", "Healthcare", "E-commerce",
  "Enterprise SaaS", "Gaming", "Cybersecurity", "Biotech", "Consulting", "Media & Marketing",
  "Education", "Energy", "Manufacturing", "Retail", "Finance", "Telecommunications",
  "Logistics", "Aerospace & Defense", "Automotive", "Consumer Goods", "Pharmaceuticals",
  "Professional Services", "Insurance", "Utilities", "Government",
];
