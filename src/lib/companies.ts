import { ROLES, roleById } from "./roles";
import type { UserProfile } from "./store";

export interface Company {
  id: string;
  name: string;
  industry: string;
  description: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  careersUrl: string;
  size: string;
  topRoles: string[];
  keywords: string[];
  benefits: string[];
}

export const COMPANIES: Company[] = [
  {
    id: "google", name: "Google", industry: "Technology / Software",
    description: "Internet services, cloud, AI, search, and advertising. Large AI/ML and software engineering teams.",
    address: "1600 Amphitheatre Parkway", city: "Mountain View", state: "CA", phone: "(650) 253-0000",
    careersUrl: "https://careers.google.com", size: "150k+ employees",
    topRoles: ["Software Engineer", "AI/ML Engineer", "Data Scientist", "Product Manager", "Research Scientist"],
    keywords: ["Python", "AI", "Machine Learning", "LLMs", "Cloud", "Distributed Systems"],
    benefits: ["Health + wellness", "401(k)", "Parental leave", "Hybrid work"],
  },
  {
    id: "apple", name: "Apple", industry: "Technology / Software",
    description: "Consumer hardware, software, services, and on-device AI. Strong silicon, ML, and design teams.",
    address: "One Apple Park Way", city: "Cupertino", state: "CA", phone: "(408) 996-1010",
    careersUrl: "https://jobs.apple.com", size: "160k+ employees",
    topRoles: ["Software Engineer", "AI/ML Engineer", "Product Designer", "Hardware Engineer", "Data Scientist"],
    keywords: ["Swift", "Python", "Machine Learning", "iOS", "Hardware", "Design"],
    benefits: ["Health coverage", "Stock grants", "Product discounts", "401(k)"],
  },
  {
    id: "microsoft", name: "Microsoft", industry: "Technology / Software",
    description: "Cloud (Azure), productivity software, AI, and enterprise platforms. Large engineering and research orgs.",
    address: "One Microsoft Way", city: "Redmond", state: "WA", phone: "(425) 882-8080",
    careersUrl: "https://careers.microsoft.com", size: "220k+ employees",
    topRoles: ["Software Engineer", "AI/ML Engineer", "Cloud Engineer", "Product Manager", "Data Scientist"],
    keywords: ["Azure", "AI", "Machine Learning", "C#", "TypeScript", "Cloud"],
    benefits: ["Health + dental", "401(k) match", "Flexible work", "Parental leave"],
  },
  {
    id: "amazon", name: "Amazon", industry: "E-commerce",
    description: "E-commerce, AWS cloud, logistics, devices, and applied AI across the business.",
    address: "410 Terry Avenue North", city: "Seattle", state: "WA", phone: "(206) 266-1000",
    careersUrl: "https://amazon.jobs", size: "1.5M+ employees",
    topRoles: ["Software Engineer", "Data Engineer", "Product Manager", "Solutions Engineer", "Data Scientist"],
    keywords: ["AWS", "Java", "Python", "SQL", "Supply Chain", "Machine Learning"],
    benefits: ["Medical/dental/vision", "401(k)", "Career choice", "Parental leave"],
  },
  {
    id: "meta", name: "Meta", industry: "Technology / Software",
    description: "Social platforms, VR/AR, and AI research. Large ML infrastructure and product engineering teams.",
    address: "1 Hacker Way", city: "Menlo Park", state: "CA", phone: "(650) 308-7300",
    careersUrl: "https://www.metacareers.com", size: "70k+ employees",
    topRoles: ["Software Engineer", "AI/ML Engineer", "AI Research Scientist", "Data Scientist", "Product Designer"],
    keywords: ["AI", "Machine Learning", "PyTorch", "React", "Research", "VR"],
    benefits: ["Health coverage", "Equity", "Wellness stipend", "Flexible work"],
  },
  {
    id: "netflix", name: "Netflix", industry: "Media & Marketing",
    description: "Streaming entertainment with heavy personalization, data, and content delivery engineering.",
    address: "121 Albright Way", city: "Los Gatos", state: "CA", phone: "(408) 540-3700",
    careersUrl: "https://jobs.netflix.com", size: "12k+ employees",
    topRoles: ["Software Engineer", "Data Scientist", "Product Manager", "Content Strategist", "Marketing Manager"],
    keywords: ["Recommendation Systems", "Java", "Python", "Analytics", "Streaming", "A/B Testing"],
    benefits: ["Health plans", "Unlimited PTO", "Top-of-market pay", "Flexible work"],
  },
  {
    id: "nvidia", name: "NVIDIA", industry: "AI & Machine Learning",
    description: "GPU, AI computing, and accelerated computing platforms. Fast-growing AI infrastructure teams.",
    address: "2788 San Tomas Expressway", city: "Santa Clara", state: "CA", phone: "(408) 486-2000",
    careersUrl: "https://www.nvidia.com/en-us/about-nvidia/careers/", size: "30k+ employees",
    topRoles: ["AI/ML Engineer", "Software Engineer", "Hardware Engineer", "Research Scientist", "Solutions Engineer"],
    keywords: ["CUDA", "Deep Learning", "Python", "GPU", "LLMs", "MLOps"],
    benefits: ["Health + wellness", "Equity", "401(k)", "Hybrid work"],
  },
  {
    id: "tesla", name: "Tesla", industry: "Manufacturing",
    description: "Electric vehicles, energy, autonomy, and robotics. Strong software, ML, and hardware teams.",
    address: "1 Tesla Road", city: "Austin", state: "TX", phone: "(877) 798-3752",
    careersUrl: "https://www.tesla.com/careers", size: "120k+ employees",
    topRoles: ["Software Engineer", "AI/ML Engineer", "Data Scientist", "Product Manager", "Hardware Engineer"],
    keywords: ["Python", "Machine Learning", "Robotics", "Manufacturing", "Data Analysis", "Autonomy"],
    benefits: ["Health coverage", "Stock options", "401(k)", "Product discounts"],
  },
  {
    id: "openai", name: "OpenAI", industry: "AI & Machine Learning",
    description: "AI research and product development, including ChatGPT and API platforms.",
    address: "3180 18th Street", city: "San Francisco", state: "CA",
    careersUrl: "https://openai.com/careers", size: "2k+ employees",
    topRoles: ["AI Research Scientist", "AI/ML Engineer", "Software Engineer", "Product Manager", "Solutions Engineer"],
    keywords: ["LLMs", "AI Agents", "Machine Learning", "Python", "Research", "Prompt Engineering"],
    benefits: ["Health coverage", "Equity", "Hybrid work", "Learning budget"],
  },
  {
    id: "anthropic", name: "Anthropic", industry: "AI & Machine Learning",
    description: "AI safety and research company building Claude. Focused on language models, alignment, and enterprise AI.",
    address: "548 Market Street, PMB 90375", city: "San Francisco", state: "CA",
    careersUrl: "https://www.anthropic.com/careers", size: "1k+ employees",
    topRoles: ["AI Research Scientist", "AI/ML Engineer", "Software Engineer", "Product Manager", "Solutions Engineer"],
    keywords: ["LLMs", "AI Safety", "Python", "Research", "Transformers", "AI Agents"],
    benefits: ["Health coverage", "Equity", "Hybrid work", "Relocation support"],
  },
  {
    id: "salesforce", name: "Salesforce", industry: "Enterprise SaaS",
    description: "CRM and enterprise cloud software, with growing AI (Agentforce) and data products.",
    address: "415 Mission Street", city: "San Francisco", state: "CA", phone: "(415) 901-7000",
    careersUrl: "https://www.salesforce.com/company/careers/", size: "70k+ employees",
    topRoles: ["Software Engineer", "Solutions Engineer", "Product Manager", "Customer Success Manager", "Data Analyst"],
    keywords: ["CRM", "Salesforce", "APIs", "Apex", "AI Agents", "Cloud"],
    benefits: ["Health + wellness", "401(k)", "Volunteer time off", "Flexible work"],
  },
  {
    id: "adobe", name: "Adobe", industry: "Technology / Software",
    description: "Creative, document, and marketing software, with AI tools across Photoshop and Express.",
    address: "345 Park Avenue", city: "San Jose", state: "CA", phone: "(408) 536-6000",
    careersUrl: "https://www.adobe.com/careers.html", size: "28k+ employees",
    topRoles: ["Software Engineer", "Product Designer", "Data Scientist", "Product Manager", "Marketing Manager"],
    keywords: ["Creative Cloud", "Machine Learning", "JavaScript", "Design", "Content Marketing", "Analytics"],
    benefits: ["Health coverage", "401(k)", "Education reimbursement", "Flexible work"],
  },
  {
    id: "airbnb", name: "Airbnb", industry: "E-commerce",
    description: "Travel marketplace with strong product, trust, search, and data science teams.",
    address: "888 Brannan Street", city: "San Francisco", state: "CA", phone: "(415) 796-5122",
    careersUrl: "https://careers.airbnb.com", size: "6k+ employees",
    topRoles: ["Software Engineer", "Data Scientist", "Product Designer", "Product Manager", "Marketing Manager"],
    keywords: ["Marketplace", "Machine Learning", "TypeScript", "SQL", "Product Design", "A/B Testing"],
    benefits: ["Health coverage", "Equity", "Travel credit", "Flexible work"],
  },
  {
    id: "ibm", name: "IBM", industry: "Enterprise SaaS",
    description: "Enterprise AI, hybrid cloud, consulting, and software. Large applied AI and consulting teams.",
    address: "1 Orchard Road", city: "Armonk", state: "NY", phone: "(914) 499-1900",
    careersUrl: "https://www.ibm.com/careers", size: "280k+ employees",
    topRoles: ["Software Engineer", "AI/ML Engineer", "Solutions Engineer", "Data Scientist", "Consultant"],
    keywords: ["Watson", "Cloud", "Python", "Consulting", "AI Agents", "Enterprise"],
    benefits: ["Health coverage", "401(k)", "Learning platforms", "Hybrid work"],
  },
  {
    id: "oracle", name: "Oracle", industry: "Enterprise SaaS",
    description: "Cloud infrastructure, database, and enterprise applications. Expanding AI and cloud teams.",
    address: "2300 Oracle Way", city: "Austin", state: "TX", phone: "(737) 867-1000",
    careersUrl: "https://www.oracle.com/careers/", size: "160k+ employees",
    topRoles: ["Software Engineer", "Cloud Engineer", "Data Engineer", "Solutions Engineer", "Product Manager"],
    keywords: ["SQL", "Cloud", "Java", "Database", "OCI", "AI"],
    benefits: ["Health + dental", "401(k)", "Flexible work", "Stock"],
  },
  {
    id: "jpmorgan", name: "JPMorgan Chase", industry: "Finance",
    description: "Global financial services with large technology, data, AI, and cybersecurity organizations.",
    address: "383 Madison Avenue", city: "New York", state: "NY", phone: "(212) 270-6000",
    careersUrl: "https://careers.jpmorgan.com", size: "300k+ employees",
    topRoles: ["Software Engineer", "Data Scientist", "Data Analyst", "Product Manager", "Risk Analyst"],
    keywords: ["Python", "SQL", "Finance", "Machine Learning", "Cybersecurity", "Risk"],
    benefits: ["Health + retirement", "Parental leave", "Tuition assistance", "Hybrid work"],
  },
  {
    id: "goldman", name: "Goldman Sachs", industry: "Finance",
    description: "Investment banking, markets, and asset management, with growing engineering and AI teams.",
    address: "200 West Street", city: "New York", state: "NY", phone: "(212) 902-1000",
    careersUrl: "https://www.goldmansachs.com/careers/", size: "45k+ employees",
    topRoles: ["Software Engineer", "Data Scientist", "Quantitative Analyst", "Product Manager", "Risk Analyst"],
    keywords: ["Python", "SQL", "Quantitative Finance", "Machine Learning", "Statistics", "Risk"],
    benefits: ["Health coverage", "Retirement plans", "Parental leave", "Hybrid work"],
  },
  {
    id: "walmart", name: "Walmart", industry: "Retail",
    description: "Retail and e-commerce with large supply chain, data, and enterprise technology teams.",
    address: "702 Southwest 8th Street", city: "Bentonville", state: "AR", phone: "(479) 273-4000",
    careersUrl: "https://careers.walmart.com", size: "2M+ employees",
    topRoles: ["Software Engineer", "Data Scientist", "Data Analyst", "Supply Chain Analyst", "Product Manager"],
    keywords: ["SQL", "Python", "Supply Chain", "Analytics", "Machine Learning", "Retail"],
    benefits: ["Health coverage", "401(k)", "Associate discounts", "Education benefits"],
  },
  {
    id: "mayo", name: "Mayo Clinic", industry: "Healthcare",
    description: "Academic medical system with clinical AI, health data science, and digital health teams.",
    address: "200 First Street SW", city: "Rochester", state: "MN", phone: "(507) 284-2511",
    careersUrl: "https://jobs.mayoclinic.org", size: "70k+ employees",
    topRoles: ["Data Scientist", "Data Analyst", "Software Engineer", "Product Manager", "Healthcare Analyst"],
    keywords: ["Healthcare", "Machine Learning", "SQL", "Python", "Clinical Data", "Analytics"],
    benefits: ["Health coverage", "Retirement plan", "Tuition reimbursement", "Hybrid work"],
  },
  {
    id: "deloitte", name: "Deloitte", industry: "Consulting",
    description: "Consulting, audit, tax, and advisory, with growing AI, data, and technology consulting practices.",
    address: "30 Rockefeller Plaza", city: "New York", state: "NY", phone: "(212) 492-4000",
    careersUrl: "https://www2.deloitte.com/us/en/careers/careers.html", size: "450k+ employees",
    topRoles: ["Data Analyst", "Consultant", "AI/ML Engineer", "Product Manager", "Cybersecurity Consultant"],
    keywords: ["Consulting", "Data Analysis", "SQL", "AI", "Communication", "Strategy"],
    benefits: ["Health coverage", "401(k)", "Professional development", "Flexible work"],
  },
  {
    id: "jnj", name: "Johnson & Johnson", industry: "Healthcare",
    description: "Pharmaceuticals and medical devices with data science, digital health, and AI teams.",
    address: "One Johnson & Johnson Plaza", city: "New Brunswick", state: "NJ", phone: "(732) 524-0400",
    careersUrl: "https://www.careers.jnj.com", size: "130k+ employees",
    topRoles: ["Data Scientist", "Data Analyst", "Software Engineer", "Product Manager", "Regulatory Affairs"],
    keywords: ["Healthcare", "Machine Learning", "Python", "Clinical Data", "SQL", "Digital Health"],
    benefits: ["Health coverage", "Retirement plans", "Parental leave", "Hybrid work"],
  },
  {
    id: "pfizer", name: "Pfizer", industry: "Biotech",
    description: "Biopharmaceutical company with digital, data science, and AI teams across R&D and commercial.",
    address: "235 East 42nd Street", city: "New York", state: "NY", phone: "(212) 733-2323",
    careersUrl: "https://www.pfizer.com/about/careers", size: "80k+ employees",
    topRoles: ["Data Scientist", "Data Analyst", "Software Engineer", "Product Manager", "Clinical Data Analyst"],
    keywords: ["Biotech", "Machine Learning", "Python", "Clinical Data", "Statistics", "SQL"],
    benefits: ["Health coverage", "Retirement plans", "Tuition assistance", "Hybrid work"],
  },
  {
    id: "uber", name: "Uber", industry: "Technology / Software",
    description: "Mobility and delivery platform with marketplace, ML, and operations technology teams.",
    address: "1725 3rd Street", city: "San Francisco", state: "CA",
    careersUrl: "https://www.uber.com/us/en/careers/", size: "30k+ employees",
    topRoles: ["Software Engineer", "Data Scientist", "Product Manager", "Product Designer", "Operations Analyst"],
    keywords: ["Marketplace", "Machine Learning", "Python", "SQL", "Logistics", "A/B Testing"],
    benefits: ["Health coverage", "Equity", "Flexible work", "Parental leave"],
  },
  {
    id: "cleveland", name: "Cleveland Clinic", industry: "Healthcare",
    description: "Nonprofit academic medical center with clinical AI, data science, and digital health teams.",
    address: "9500 Euclid Avenue", city: "Cleveland", state: "OH", phone: "(216) 444-2200",
    careersUrl: "https://jobs.clevelandclinic.org", size: "80k+ employees",
    topRoles: ["Data Scientist", "Data Analyst", "Software Engineer", "Healthcare Analyst", "Product Manager"],
    keywords: ["Healthcare", "Machine Learning", "SQL", "Python", "Clinical Data", "Analytics"],
    benefits: ["Health coverage", "Retirement plans", "Tuition reimbursement", "Hybrid work"],
  },
  {
    id: "intel", name: "Intel", industry: "Technology / Software",
    description: "Semiconductor design and manufacturing, from client computing to data center and AI chips.",
    address: "2200 Mission College Boulevard", city: "Santa Clara", state: "CA", phone: "(408) 765-8080",
    careersUrl: "https://www.intel.com/content/www/us/en/careers/jobs.html", size: "120k+ employees",
    topRoles: ["Software Engineer", "AI/ML Engineer", "Hardware Engineer", "Data Scientist", "Product Manager"],
    keywords: ["Semiconductors", "AI", "Python", "System Design", "Manufacturing", "Cloud"],
    benefits: ["Health coverage", "Retirement plans", "Stock", "Hybrid work"],
  },
  {
    id: "cisco", name: "Cisco", industry: "Technology / Software",
    description: "Networking, security, collaboration, and cloud infrastructure.",
    address: "170 West Tasman Drive", city: "San Jose", state: "CA", phone: "(408) 526-4000",
    careersUrl: "https://jobs.cisco.com/", size: "80k+ employees",
    topRoles: ["Software Engineer", "Network Engineer", "Solutions Engineer", "Product Manager", "Data Analyst"],
    keywords: ["Networking", "Security", "Cloud", "APIs", "Automation", "Communication"],
    benefits: ["Health + wellness", "401(k)", "Learning budget", "Flexible work"],
  },
  {
    id: "amd", name: "AMD", industry: "Technology / Software",
    description: "High-performance computing, graphics, and adaptive computing products.",
    address: "2485 Augustine Drive", city: "Santa Clara", state: "CA", phone: "(408) 749-4000",
    careersUrl: "https://careers.amd.com/", size: "25k+ employees",
    topRoles: ["Hardware Engineer", "Software Engineer", "AI/ML Engineer", "Data Scientist", "Product Manager"],
    keywords: ["GPU", "CPU", "Python", "C++", "Machine Learning", "System Design"],
    benefits: ["Health coverage", "Stock", "401(k)", "Hybrid work"],
  },
  {
    id: "servicenow", name: "ServiceNow", industry: "Enterprise SaaS",
    description: "Digital workflow platform for IT, employee, and customer operations.",
    address: "2225 Lawson Lane", city: "Santa Clara", state: "CA",
    careersUrl: "https://careers.servicenow.com/", size: "25k+ employees",
    topRoles: ["Software Engineer", "Solutions Engineer", "Product Manager", "Data Analyst", "Customer Success Manager"],
    keywords: ["SaaS", "Cloud", "JavaScript", "APIs", "Workflow", "Automation"],
    benefits: ["Health coverage", "401(k)", "Learning budget", "Flexible work"],
  },
  {
    id: "snowflake", name: "Snowflake", industry: "Enterprise SaaS",
    description: "Cloud data platform for data warehousing, analytics, and AI workloads.",
    address: "106 East Babcock Street", city: "Bozeman", state: "MT",
    careersUrl: "https://careers.snowflake.com/", size: "7k+ employees",
    topRoles: ["Data Engineer", "Software Engineer", "Data Scientist", "Solutions Engineer", "Product Manager"],
    keywords: ["SQL", "Cloud", "Data Warehouse", "Python", "Analytics", "SaaS"],
    benefits: ["Health coverage", "Equity", "Flexible work", "401(k)"],
  },
  {
    id: "pinterest", name: "Pinterest", industry: "Technology / Software",
    description: "Visual discovery and shopping platform powered by recommendations and search.",
    address: "651 Brannan Street", city: "San Francisco", state: "CA",
    careersUrl: "https://www.pinterestcareers.com/", size: "3k+ employees",
    topRoles: ["Software Engineer", "Data Scientist", "Product Designer", "Product Manager", "Machine Learning Engineer"],
    keywords: ["Recommendation Systems", "Python", "React", "SQL", "A/B Testing", "Design"],
    benefits: ["Health coverage", "Equity", "Wellness stipend", "Hybrid work"],
  },
  {
    id: "snap", name: "Snap Inc.", industry: "Technology / Software",
    description: "Camera and social products, including Snapchat and AR platforms.",
    address: "3000 31st Street", city: "Santa Monica", state: "CA",
    careersUrl: "https://careers.snap.com/", size: "5k+ employees",
    topRoles: ["Software Engineer", "AI/ML Engineer", "Product Designer", "Data Scientist", "Product Manager"],
    keywords: ["Mobile", "Machine Learning", "Python", "AR", "Design", "Analytics"],
    benefits: ["Health coverage", "Equity", "Wellness benefits", "Hybrid work"],
  },
  {
    id: "bankofamerica", name: "Bank of America", industry: "Finance",
    description: "Consumer banking, wealth management, and global markets.",
    address: "100 North Tryon Street", city: "Charlotte", state: "NC", phone: "(704) 386-5681",
    careersUrl: "https://careers.bankofamerica.com/", size: "200k+ employees",
    topRoles: ["Financial Analyst", "Data Scientist", "Software Engineer", "Risk Analyst", "Customer Success Manager"],
    keywords: ["Finance", "SQL", "Python", "Risk", "Analytics", "Banking"],
    benefits: ["Health + retirement", "Parental leave", "Tuition assistance", "Hybrid work"],
  },
  {
    id: "wellsfargo", name: "Wells Fargo", industry: "Finance",
    description: "Banking, lending, and financial services across consumer and commercial clients.",
    address: "420 Montgomery Street", city: "San Francisco", state: "CA", phone: "(866) 878-5865",
    careersUrl: "https://www.wellsfargojobs.com/", size: "220k+ employees",
    topRoles: ["Financial Analyst", "Data Analyst", "Software Engineer", "Risk Analyst", "Customer Success Manager"],
    keywords: ["Banking", "SQL", "Python", "Risk", "Analytics", "Compliance"],
    benefits: ["Health coverage", "401(k)", "Tuition reimbursement", "Hybrid work"],
  },
  {
    id: "citi", name: "Citigroup", industry: "Finance",
    description: "Global banking, markets, and financial services.",
    address: "388 Greenwich Street", city: "New York", state: "NY", phone: "(212) 559-1000",
    careersUrl: "https://jobs.citi.com/", size: "230k+ employees",
    topRoles: ["Financial Analyst", "Risk Analyst", "Data Scientist", "Software Engineer", "Product Manager"],
    keywords: ["Finance", "SQL", "Python", "Risk", "Banking", "Analytics"],
    benefits: ["Health + retirement", "Parental leave", "Learning budget", "Hybrid work"],
  },
  {
    id: "morganstanley", name: "Morgan Stanley", industry: "Finance",
    description: "Investment banking, wealth management, and institutional securities.",
    address: "1585 Broadway", city: "New York", state: "NY", phone: "(212) 761-4000",
    careersUrl: "https://www.morganstanley.com/careers", size: "80k+ employees",
    topRoles: ["Financial Analyst", "Risk Analyst", "Data Scientist", "Software Engineer", "Quantitative Analyst"],
    keywords: ["Finance", "Python", "SQL", "Statistics", "Risk", "Investments"],
    benefits: ["Health coverage", "Retirement plans", "Wellness benefits", "Hybrid work"],
  },
  {
    id: "visa", name: "Visa", industry: "Finance",
    description: "Global payments network and digital commerce infrastructure.",
    address: "One Market Plaza", city: "San Francisco", state: "CA",
    careersUrl: "https://www.visa.com/careers", size: "30k+ employees",
    topRoles: ["Software Engineer", "Data Scientist", "Product Manager", "Data Analyst", "Solutions Engineer"],
    keywords: ["Payments", "APIs", "SQL", "Python", "FinTech", "Analytics"],
    benefits: ["Health coverage", "401(k)", "Parental leave", "Flexible work"],
  },
  {
    id: "mastercard", name: "Mastercard", industry: "Finance",
    description: "Payment technology and digital commerce solutions.",
    address: "2000 Purchase Street", city: "Purchase", state: "NY",
    careersUrl: "https://careers.mastercard.com/", size: "30k+ employees",
    topRoles: ["Software Engineer", "Data Scientist", "Product Manager", "Data Analyst", "Solutions Engineer"],
    keywords: ["Payments", "FinTech", "SQL", "Python", "Analytics", "Security"],
    benefits: ["Health coverage", "401(k)", "Learning budget", "Hybrid work"],
  },
  {
    id: "paypal", name: "PayPal", industry: "Finance",
    description: "Digital payments, commerce, and financial technology.",
    address: "2211 North First Street", city: "San Jose", state: "CA",
    careersUrl: "https://careers.pypl.com/", size: "25k+ employees",
    topRoles: ["Software Engineer", "Data Scientist", "Product Manager", "Data Analyst", "Risk Analyst"],
    keywords: ["Payments", "FinTech", "Python", "SQL", "Machine Learning", "Risk"],
    benefits: ["Health coverage", "Equity", "Flexible work", "401(k)"],
  },
  {
    id: "capitalone", name: "Capital One", industry: "Finance",
    description: "Banking and credit with a strong technology and data organization.",
    address: "1680 Capital One Drive", city: "McLean", state: "VA",
    careersUrl: "https://www.capitalonecareers.com/", size: "50k+ employees",
    topRoles: ["Software Engineer", "Data Scientist", "Data Analyst", "Product Manager", "Risk Analyst"],
    keywords: ["Banking", "Python", "SQL", "Machine Learning", "Analytics", "FinTech"],
    benefits: ["Health coverage", "401(k)", "Tuition assistance", "Hybrid work"],
  },
  {
    id: "unitedhealth", name: "UnitedHealth Group", industry: "Healthcare",
    description: "Health insurance and healthcare services, including Optum and UnitedHealthcare.",
    address: "9900 Bren Road East", city: "Minnetonka", state: "MN",
    careersUrl: "https://careers.unitedhealthgroup.com/", size: "400k+ employees",
    topRoles: ["Data Analyst", "Data Scientist", "Software Engineer", "Product Manager", "Healthcare Analyst"],
    keywords: ["Healthcare", "SQL", "Python", "Analytics", "Clinical Data", "Operations"],
    benefits: ["Health coverage", "Retirement plans", "Tuition reimbursement", "Hybrid work"],
  },
  {
    id: "cvs", name: "CVS Health", industry: "Healthcare",
    description: "Pharmacy, retail health, and insurance services.",
    address: "One CVS Drive", city: "Woonsocket", state: "RI",
    careersUrl: "https://jobs.cvshealth.com/", size: "300k+ employees",
    topRoles: ["Data Analyst", "Data Scientist", "Software Engineer", "Healthcare Analyst", "Customer Success Manager"],
    keywords: ["Healthcare", "SQL", "Python", "Pharmacy", "Analytics", "Retail"],
    benefits: ["Health coverage", "401(k)", "Employee discounts", "Flexible work"],
  },
  {
    id: "cigna", name: "Cigna", industry: "Healthcare",
    description: "Health insurance and health services company.",
    address: "900 Cottage Grove Road", city: "Bloomfield", state: "CT",
    careersUrl: "https://jobs.cigna.com/", size: "70k+ employees",
    topRoles: ["Data Analyst", "Data Scientist", "Software Engineer", "Healthcare Analyst", "Product Manager"],
    keywords: ["Healthcare", "SQL", "Python", "Insurance", "Analytics", "Clinical Data"],
    benefits: ["Health coverage", "Retirement plans", "Tuition reimbursement", "Hybrid work"],
  },
  {
    id: "humana", name: "Humana", industry: "Healthcare",
    description: "Health insurance and care delivery company.",
    address: "500 West Main Street", city: "Louisville", state: "KY",
    careersUrl: "https://careers.humana.com/", size: "65k+ employees",
    topRoles: ["Data Analyst", "Data Scientist", "Software Engineer", "Healthcare Analyst", "Customer Success Manager"],
    keywords: ["Healthcare", "SQL", "Python", "Insurance", "Analytics", "Operations"],
    benefits: ["Health coverage", "401(k)", "Wellness programs", "Flexible work"],
  },
  {
    id: "abbott", name: "Abbott", industry: "Healthcare",
    description: "Medical devices, diagnostics, nutrition, and pharmaceuticals.",
    address: "100 Abbott Park Road", city: "Abbott Park", state: "IL",
    careersUrl: "https://www.abbott.com/careers.html", size: "110k+ employees",
    topRoles: ["Data Scientist", "Software Engineer", "Product Manager", "Healthcare Analyst", "Biomedical Engineer"],
    keywords: ["Healthcare", "Python", "SQL", "Clinical Data", "Diagnostics", "Biomedical"],
    benefits: ["Health coverage", "Retirement plans", "Tuition reimbursement", "Hybrid work"],
  },
  {
    id: "medtronic", name: "Medtronic", industry: "Healthcare",
    description: "Medical device and healthcare technology company.",
    address: "710 Medtronic Parkway", city: "Minneapolis", state: "MN",
    careersUrl: "https://www.medtronic.com/us-en/about/careers.html", size: "90k+ employees",
    topRoles: ["Data Scientist", "Software Engineer", "Product Manager", "Healthcare Analyst", "Biomedical Engineer"],
    keywords: ["Healthcare", "Python", "SQL", "Clinical Data", "Devices", "Regulatory"],
    benefits: ["Health coverage", "401(k)", "Parental leave", "Hybrid work"],
  },
  {
    id: "elililly", name: "Eli Lilly", industry: "Biotech",
    description: "Pharmaceutical company focused on diabetes, oncology, immunology, and neuroscience.",
    address: "Lilly Corporate Center", city: "Indianapolis", state: "IN",
    careersUrl: "https://careers.lilly.com/", size: "40k+ employees",
    topRoles: ["Data Scientist", "Data Analyst", "Software Engineer", "Clinical Data Analyst", "Product Manager"],
    keywords: ["Biotech", "Python", "SQL", "Clinical Data", "Statistics", "Healthcare"],
    benefits: ["Health coverage", "Retirement plans", "Tuition assistance", "Hybrid work"],
  },
  {
    id: "target", name: "Target", industry: "Retail",
    description: "Retail and e-commerce company with strong supply chain and data teams.",
    address: "1000 Nicollet Mall", city: "Minneapolis", state: "MN",
    careersUrl: "https://corporate.target.com/careers", size: "400k+ employees",
    topRoles: ["Data Scientist", "Data Analyst", "Software Engineer", "Supply Chain Analyst", "Product Manager"],
    keywords: ["Retail", "SQL", "Python", "Supply Chain", "Analytics", "E-commerce"],
    benefits: ["Health coverage", "401(k)", "Employee discounts", "Hybrid work"],
  },
  {
    id: "costco", name: "Costco Wholesale", industry: "Retail",
    description: "Membership warehouse club with retail, logistics, and e-commerce operations.",
    address: "999 Lake Drive", city: "Issaquah", state: "WA",
    careersUrl: "https://www.costco.com/jobs.html", size: "300k+ employees",
    topRoles: ["Data Analyst", "Supply Chain Analyst", "Software Engineer", "Product Manager", "Operations Analyst"],
    keywords: ["Retail", "SQL", "Python", "Supply Chain", "Operations", "Analytics"],
    benefits: ["Health coverage", "401(k)", "Employee discounts", "Flexible work"],
  },
  {
    id: "homedepot", name: "The Home Depot", industry: "Retail",
    description: "Home improvement retail and supply chain company.",
    address: "2455 Paces Ferry Road", city: "Atlanta", state: "GA",
    careersUrl: "https://careers.homedepot.com/", size: "470k+ employees",
    topRoles: ["Data Scientist", "Data Analyst", "Software Engineer", "Supply Chain Analyst", "Product Manager"],
    keywords: ["Retail", "SQL", "Python", "Supply Chain", "Analytics", "E-commerce"],
    benefits: ["Health coverage", "401(k)", "Employee discounts", "Hybrid work"],
  },
  {
    id: "starbucks", name: "Starbucks", industry: "Retail",
    description: "Global coffeehouse chain with digital, loyalty, and supply chain teams.",
    address: "2401 Utah Avenue South", city: "Seattle", state: "WA",
    careersUrl: "https://www.starbucks.com/careers/", size: "380k+ employees",
    topRoles: ["Data Analyst", "Marketing Manager", "Product Manager", "Supply Chain Analyst", "Software Engineer"],
    keywords: ["Retail", "SQL", "Python", "Marketing", "Analytics", "Operations"],
    benefits: ["Health coverage", "401(k)", "Employee discounts", "Flexible work"],
  },
  {
    id: "nike", name: "Nike", industry: "Retail",
    description: "Sportswear, footwear, and digital commerce company.",
    address: "One Bowerman Drive", city: "Beaverton", state: "OR",
    careersUrl: "https://jobs.nike.com/", size: "80k+ employees",
    topRoles: ["Data Scientist", "Product Manager", "Marketing Manager", "Supply Chain Analyst", "Product Designer"],
    keywords: ["Retail", "Python", "SQL", "E-commerce", "Marketing", "Design"],
    benefits: ["Health coverage", "Employee discounts", "401(k)", "Hybrid work"],
  },
  {
    id: "cocacola", name: "Coca-Cola", industry: "Retail",
    description: "Global beverage company with marketing, distribution, and data operations.",
    address: "One Coca-Cola Plaza", city: "Atlanta", state: "GA",
    careersUrl: "https://careers.coca-colacompany.com/", size: "80k+ employees",
    topRoles: ["Data Analyst", "Marketing Manager", "Product Manager", "Supply Chain Analyst", "Financial Analyst"],
    keywords: ["Retail", "SQL", "Python", "Marketing", "Supply Chain", "Analytics"],
    benefits: ["Health coverage", "401(k)", "Employee discounts", "Flexible work"],
  },
  {
    id: "pepsico", name: "PepsiCo", industry: "Retail",
    description: "Food and beverage company with large logistics, data, and brand teams.",
    address: "700 Anderson Hill Road", city: "Purchase", state: "NY",
    careersUrl: "https://www.pepsicojobs.com/", size: "300k+ employees",
    topRoles: ["Data Analyst", "Supply Chain Analyst", "Marketing Manager", "Product Manager", "Financial Analyst"],
    keywords: ["Retail", "SQL", "Python", "Supply Chain", "Marketing", "Analytics"],
    benefits: ["Health coverage", "401(k)", "Employee discounts", "Hybrid work"],
  },
  {
    id: "pg", name: "Procter & Gamble", industry: "Retail",
    description: "Consumer goods company with brand, data science, and supply chain teams.",
    address: "1 Procter & Gamble Plaza", city: "Cincinnati", state: "OH",
    careersUrl: "https://www.pgcareers.com/", size: "100k+ employees",
    topRoles: ["Data Scientist", "Marketing Manager", "Supply Chain Analyst", "Product Manager", "Financial Analyst"],
    keywords: ["Consumer Goods", "Python", "SQL", "Marketing", "Supply Chain", "Analytics"],
    benefits: ["Health coverage", "Retirement plans", "Tuition assistance", "Hybrid work"],
  },
  {
    id: "boeing", name: "Boeing", industry: "Manufacturing",
    description: "Aerospace and defense manufacturer of commercial and military aircraft.",
    address: "929 Long Bridge Drive", city: "Arlington", state: "VA",
    careersUrl: "https://jobs.boeing.com/", size: "170k+ employees",
    topRoles: ["Software Engineer", "Mechanical Engineer", "Electrical Engineer", "Data Scientist", "Project Manager"],
    keywords: ["Aerospace", "Python", "SQL", "Systems Engineering", "Manufacturing", "Safety"],
    benefits: ["Health coverage", "401(k)", "Tuition assistance", "Hybrid work"],
  },
  {
    id: "lockheed", name: "Lockheed Martin", industry: "Manufacturing",
    description: "Aerospace, defense, and advanced technology company.",
    address: "6801 Rockledge Drive", city: "Bethesda", state: "MD",
    careersUrl: "https://www.lockheedmartin.com/en-us/careers.html", size: "120k+ employees",
    topRoles: ["Software Engineer", "Electrical Engineer", "Mechanical Engineer", "Data Scientist", "Security Engineer"],
    keywords: ["Defense", "Python", "Systems Engineering", "Security", "Manufacturing", "Aerospace"],
    benefits: ["Health coverage", "401(k)", "Tuition assistance", "Flexible work"],
  },
  {
    id: "gm", name: "General Motors", industry: "Manufacturing",
    description: "Automotive manufacturer investing in electric vehicles and software-defined vehicles.",
    address: "300 Renaissance Center", city: "Detroit", state: "MI",
    careersUrl: "https://careers.gm.com/", size: "160k+ employees",
    topRoles: ["Software Engineer", "Mechanical Engineer", "Electrical Engineer", "Data Scientist", "Product Manager"],
    keywords: ["Automotive", "Python", "SQL", "Manufacturing", "Electric Vehicles", "Embedded"],
    benefits: ["Health coverage", "401(k)", "Tuition assistance", "Hybrid work"],
  },
  {
    id: "ford", name: "Ford Motor Company", industry: "Manufacturing",
    description: "Automotive manufacturer with software, EV, and mobility teams.",
    address: "1 American Road", city: "Dearborn", state: "MI",
    careersUrl: "https://corporate.ford.com/careers", size: "170k+ employees",
    topRoles: ["Software Engineer", "Mechanical Engineer", "Electrical Engineer", "Data Scientist", "Product Manager"],
    keywords: ["Automotive", "Python", "SQL", "Manufacturing", "Electric Vehicles", "Embedded"],
    benefits: ["Health coverage", "401(k)", "Tuition assistance", "Hybrid work"],
  },
  {
    id: "caterpillar", name: "Caterpillar", industry: "Manufacturing",
    description: "Construction and mining equipment manufacturer with digital operations.",
    address: "5205 N O'Connor Boulevard", city: "Irving", state: "TX",
    careersUrl: "https://careers.caterpillar.com/", size: "110k+ employees",
    topRoles: ["Software Engineer", "Mechanical Engineer", "Electrical Engineer", "Data Scientist", "Supply Chain Analyst"],
    keywords: ["Manufacturing", "Python", "SQL", "Industrial", "Supply Chain", "Embedded"],
    benefits: ["Health coverage", "401(k)", "Tuition assistance", "Hybrid work"],
  },
  {
    id: "disney", name: "The Walt Disney Company", industry: "Media & Marketing",
    description: "Media, entertainment, streaming, parks, and consumer products.",
    address: "500 South Buena Vista Street", city: "Burbank", state: "CA",
    careersUrl: "https://jobs.disneycareers.com/", size: "220k+ employees",
    topRoles: ["Software Engineer", "Data Scientist", "Product Manager", "Marketing Manager", "Content Strategist"],
    keywords: ["Media", "Streaming", "Python", "SQL", "Marketing", "Analytics"],
    benefits: ["Health coverage", "Retirement plans", "Employee perks", "Hybrid work"],
  },
  {
    id: "comcast", name: "Comcast", industry: "Media & Marketing",
    description: "Telecommunications, media, and entertainment company.",
    address: "1701 John F Kennedy Boulevard", city: "Philadelphia", state: "PA",
    careersUrl: "https://jobs.comcast.com/", size: "180k+ employees",
    topRoles: ["Software Engineer", "Data Scientist", "Product Manager", "Network Engineer", "Marketing Manager"],
    keywords: ["Media", "Telecom", "Python", "SQL", "Networking", "Analytics"],
    benefits: ["Health coverage", "401(k)", "Tuition assistance", "Hybrid work"],
  },
  {
    id: "exxon", name: "ExxonMobil", industry: "Energy",
    description: "Energy company with upstream, downstream, and low-carbon operations.",
    address: "22777 Springwoods Village Parkway", city: "Spring", state: "TX",
    careersUrl: "https://corporate.exxonmobil.com/careers", size: "60k+ employees",
    topRoles: ["Data Scientist", "Software Engineer", "Mechanical Engineer", "Chemical Engineer", "Financial Analyst"],
    keywords: ["Energy", "Python", "SQL", "Engineering", "Operations", "Analytics"],
    benefits: ["Health coverage", "Retirement plans", "Tuition assistance", "Hybrid work"],
  },
  {
    id: "chevron", name: "Chevron", industry: "Energy",
    description: "Integrated energy company with oil, gas, and low-carbon operations.",
    address: "6001 Bollinger Canyon Road", city: "San Ramon", state: "CA",
    careersUrl: "https://careers.chevron.com/", size: "45k+ employees",
    topRoles: ["Data Scientist", "Software Engineer", "Mechanical Engineer", "Chemical Engineer", "Financial Analyst"],
    keywords: ["Energy", "Python", "SQL", "Engineering", "Operations", "Analytics"],
    benefits: ["Health coverage", "401(k)", "Tuition assistance", "Hybrid work"],
  },
  {
    id: "fedex", name: "FedEx", industry: "Logistics",
    description: "Global logistics, shipping, and supply chain company.",
    address: "942 South Shady Grove Road", city: "Memphis", state: "TN",
    careersUrl: "https://careers.fedex.com/", size: "500k+ employees",
    topRoles: ["Data Analyst", "Supply Chain Analyst", "Software Engineer", "Operations Analyst", "Product Manager"],
    keywords: ["Logistics", "SQL", "Python", "Supply Chain", "Operations", "Analytics"],
    benefits: ["Health coverage", "401(k)", "Tuition assistance", "Flexible work"],
  },
  {
    id: "ups", name: "UPS", industry: "Logistics",
    description: "Package delivery and supply chain management company.",
    address: "55 Glenlake Parkway NE", city: "Atlanta", state: "GA",
    careersUrl: "https://www.jobs-ups.com/", size: "500k+ employees",
    topRoles: ["Data Analyst", "Supply Chain Analyst", "Software Engineer", "Operations Analyst", "Product Manager"],
    keywords: ["Logistics", "SQL", "Python", "Supply Chain", "Operations", "Analytics"],
    benefits: ["Health coverage", "401(k)", "Tuition assistance", "Flexible work"],
  },
  {
    id: "att", name: "AT&T", industry: "Telecommunications",
    description: "Telecommunications, media, and technology company.",
    address: "208 South Akard Street", city: "Dallas", state: "TX",
    careersUrl: "https://www.att.com/careers/", size: "150k+ employees",
    topRoles: ["Software Engineer", "Network Engineer", "Data Scientist", "Product Manager", "Data Analyst"],
    keywords: ["Telecom", "Networking", "Python", "SQL", "Cloud", "Analytics"],
    benefits: ["Health coverage", "401(k)", "Tuition assistance", "Hybrid work"],
  },
  {
    id: "verizon", name: "Verizon", industry: "Telecommunications",
    description: "Telecommunications and technology company.",
    address: "1095 Avenue of the Americas", city: "New York", state: "NY",
    careersUrl: "https://www.verizon.com/about/careers", size: "100k+ employees",
    topRoles: ["Software Engineer", "Network Engineer", "Data Scientist", "Product Manager", "Data Analyst"],
    keywords: ["Telecom", "Networking", "Python", "SQL", "Cloud", "Analytics"],
    benefits: ["Health coverage", "401(k)", "Tuition assistance", "Hybrid work"],
  },
  {
    id: "tmobile", name: "T-Mobile", industry: "Telecommunications",
    description: "Wireless telecommunications company.",
    address: "12920 SE 38th Street", city: "Bellevue", state: "WA",
    careersUrl: "https://careers.t-mobile.com/", size: "70k+ employees",
    topRoles: ["Software Engineer", "Network Engineer", "Data Scientist", "Product Manager", "Data Analyst"],
    keywords: ["Telecom", "Networking", "Python", "SQL", "Cloud", "Analytics"],
    benefits: ["Health coverage", "401(k)", "Employee discounts", "Hybrid work"],
  },
  {
    id: "accenture", name: "Accenture", industry: "Consulting",
    description: "Technology, strategy, and consulting services company.",
    address: "500 West Madison Street", city: "Chicago", state: "IL",
    careersUrl: "https://www.accenture.com/us-en/careers", size: "700k+ employees",
    topRoles: ["Data Analyst", "Consultant", "Software Engineer", "Product Manager", "AI/ML Engineer"],
    keywords: ["Consulting", "SQL", "Python", "Strategy", "Communication", "Analytics"],
    benefits: ["Health coverage", "401(k)", "Professional development", "Flexible work"],
  },
  {
    id: "mckinsey", name: "McKinsey & Company", industry: "Consulting",
    description: "Global management consulting firm.",
    address: "55 East 52nd Street", city: "New York", state: "NY",
    careersUrl: "https://www.mckinsey.com/careers", size: "45k+ employees",
    topRoles: ["Consultant", "Data Analyst", "Product Manager", "AI/ML Engineer", "Financial Analyst"],
    keywords: ["Consulting", "Strategy", "SQL", "Python", "Communication", "Analytics"],
    benefits: ["Health coverage", "Retirement plans", "Professional development", "Flexible work"],
  },
  {
    id: "bcg", name: "Boston Consulting Group", industry: "Consulting",
    description: "Global management consulting firm.",
    address: "200 Pier 4 Boulevard", city: "Boston", state: "MA",
    careersUrl: "https://careers.bcg.com/", size: "30k+ employees",
    topRoles: ["Consultant", "Data Analyst", "Product Manager", "AI/ML Engineer", "Financial Analyst"],
    keywords: ["Consulting", "Strategy", "SQL", "Python", "Communication", "Analytics"],
    benefits: ["Health coverage", "Retirement plans", "Professional development", "Flexible work"],
  },
  {
    id: "pwc", name: "PwC", industry: "Consulting",
    description: "Professional services firm providing audit, tax, and consulting.",
    address: "300 Madison Avenue", city: "New York", state: "NY",
    careersUrl: "https://www.pwc.com/us/en/careers.html", size: "360k+ employees",
    topRoles: ["Consultant", "Data Analyst", "Financial Analyst", "Software Engineer", "AI/ML Engineer"],
    keywords: ["Consulting", "Audit", "SQL", "Python", "Analytics", "Finance"],
    benefits: ["Health coverage", "401(k)", "Professional development", "Flexible work"],
  },
  {
    id: "ey", name: "EY", industry: "Consulting",
    description: "Professional services firm providing assurance, tax, and consulting.",
    address: "121 River Street", city: "Hoboken", state: "NJ",
    careersUrl: "https://www.ey.com/en_us/careers", size: "400k+ employees",
    topRoles: ["Consultant", "Data Analyst", "Financial Analyst", "Software Engineer", "AI/ML Engineer"],
    keywords: ["Consulting", "Audit", "SQL", "Python", "Analytics", "Finance"],
    benefits: ["Health coverage", "401(k)", "Professional development", "Flexible work"],
  },
  {
    id: "kpmg", name: "KPMG", industry: "Consulting",
    description: "Professional services firm providing audit, tax, and advisory.",
    address: "345 Park Avenue", city: "New York", state: "NY",
    careersUrl: "https://kpmg.com/us/en/careers.html", size: "270k+ employees",
    topRoles: ["Consultant", "Data Analyst", "Financial Analyst", "Software Engineer", "AI/ML Engineer"],
    keywords: ["Consulting", "Audit", "SQL", "Python", "Analytics", "Finance"],
    benefits: ["Health coverage", "401(k)", "Professional development", "Flexible work"],
  },
];

export interface CompanyMatch extends Company {
  score: number;
  matchedRoles: string[];
  matchedSkills: string[];
}

function countOverlap(a: string[], b: string[]): number {
  const set = new Set(b.map((x) => x.toLowerCase()));
  return a.filter((x) => set.has(x.toLowerCase())).length;
}

export function recommendCompanies(profile: UserProfile | null, resumeText: string, limit = 12): CompanyMatch[] {
  const roleTitles = (profile?.targetRoles ?? []).map((id) => roleById(id)?.title ?? "").filter(Boolean);
  const skillList = profile?.skills ?? [];
  const industries = (profile?.industries ?? []).map((x) => x.toLowerCase());
  const resumeLower = resumeText.toLowerCase();

  const matches: CompanyMatch[] = COMPANIES.map((c) => {
    const matchedRoles = c.topRoles.filter((r) =>
      roleTitles.some((t) => t.toLowerCase() === r.toLowerCase()),
    );
    const matchedSkills = c.keywords.filter(
      (k) =>
        skillList.some((s) => s.toLowerCase() === k.toLowerCase()) ||
        resumeLower.includes(k.toLowerCase()),
    );
    let score = 0;
    score += matchedRoles.length * 5;
    score += matchedSkills.length * 3;
    if (industries.some((i) => c.industry.toLowerCase().includes(i) || i.includes(c.industry.toLowerCase()))) {
      score += 4;
    }
    return { ...c, score, matchedRoles, matchedSkills };
  });

  matches.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return matches.slice(0, limit);
}

export function companyMatchDetails(
  company: Company,
  profile: UserProfile | null,
  resumeText: string,
): { score: number; matchedRoles: string[]; matchedSkills: string[] } {
  const roleTitles = (profile?.targetRoles ?? []).map((id) => roleById(id)?.title ?? "").filter(Boolean);
  const skillList = profile?.skills ?? [];
  const industries = (profile?.industries ?? []).map((x) => x.toLowerCase());
  const resumeLower = resumeText.toLowerCase();
  const matchedRoles = company.topRoles.filter((r) =>
    roleTitles.some((t) => t.toLowerCase() === r.toLowerCase()),
  );
  const matchedSkills = company.keywords.filter(
    (k) =>
      skillList.some((s) => s.toLowerCase() === k.toLowerCase()) ||
      resumeLower.includes(k.toLowerCase()),
  );
  let score = matchedRoles.length * 5 + matchedSkills.length * 3;
  if (industries.some((i) => company.industry.toLowerCase().includes(i) || i.includes(company.industry.toLowerCase()))) {
    score += 4;
  }
  return { score, matchedRoles, matchedSkills };
}

export function allCompanies(): Company[] {
  return [...COMPANIES].sort((a, b) => a.name.localeCompare(b.name));
}

export interface RoleSummary {
  title: string;
  summary: string;
  requirements: string[];
}

export function roleSummariesForCompany(company: Company): RoleSummary[] {
  const companySkills = company.keywords.slice(0, 4);
  return company.topRoles.map((title) => {
    const role = ROLES.find((r) => r.title === title);
    const requirements = role
      ? [...new Set([...role.topSkills, ...companySkills])].slice(0, 6)
      : companySkills;
    const summary = role
      ? `As a ${role.title} at ${company.name}, you would work on ${company.industry.toLowerCase()} problems end to end: understand requirements, build and ship solutions, and measure impact. Typical background: ${role.typicalEducation.toLowerCase()} education and hands-on experience with ${requirements.slice(0, 3).join(", ")}.`
      : `This ${title} role at ${company.name} involves owning projects end to end, collaborating across teams, and turning ${company.industry.toLowerCase()} needs into measurable results.`;
    return { title, summary, requirements };
  });
}

export function recruiterContact(company: Company): { label: string; value: string; href?: string }[] {
  const linkedinJobs = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(company.name)}&location=United%20States`;
  return [
    { label: "Careers page", value: company.careersUrl, href: company.careersUrl },
    { label: "LinkedIn Jobs", value: `Search ${company.name} US jobs`, href: linkedinJobs },
    ...(company.phone ? [{ label: "Main line", value: company.phone }] : []),
    {
      label: "Recruiter note",
      value: "Direct recruiter emails are usually not public. Apply via the careers page, then message the hiring team on LinkedIn.",
    },
  ];
}
