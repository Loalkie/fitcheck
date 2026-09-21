export interface NavItem {
  id: string;
  href: string;
  label: string;
  short: string;
  description: string;
  icon: string;
  group: "Search" | "Prepare" | "Track";
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    href: "/dashboard",
    label: "Overview",
    short: "Home",
    description: "Your pipeline, next actions, and top matches in one glance.",
    icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    group: "Search",
  },
  {
    id: "fit-check",
    href: "/fit-check",
    label: "Fit Check",
    short: "Fit",
    description: "Score your resume against any job description before you apply.",
    icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    group: "Search",
  },
  {
    id: "companies",
    href: "/companies",
    label: "Companies",
    short: "Companies",
    description: "US employers matched to you, with roles, news, and contact routes.",
    icon: "M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M14 10h4a2 2 0 0 1 2 2v9M8 7h2M8 11h2M8 15h2",
    group: "Search",
  },
  {
    id: "radar",
    href: "/radar",
    label: "Job Radar",
    short: "Radar",
    description: "Autopilot role suggestions and a US role explorer you can track.",
    icon: "M12 21a9 9 0 1 0-9-9M12 12l7-7M12 12a4 4 0 1 0 4 4",
    group: "Search",
  },
  {
    id: "live-jobs",
    href: "/jobs-feed",
    label: "Live Jobs",
    short: "Live Jobs",
    description: "Real open roles from Greenhouse and Adzuna, searchable and ready to track.",
    icon: "M3 9l3 3m0-3L3 12M12 3l3 3m0-3l-3 3M21 9l-3 3m0-3l3 3M5 20l4-8 5 3 5-6",
    group: "Search",
  },
  {
    id: "autopilot",
    href: "/autopilot",
    label: "Autopilot",
    short: "Autopilot",
    description: "Track, score, and draft outreach for your top matches in one click.",
    icon: "M12 3v3M5.6 5.6l2.1 2.1M3 12h3M5.6 18.4l2.1-2.1M12 21v-3M18.4 18.4l-2.1-2.1M21 12h-3M18.4 5.6l-2.1 2.1",
    group: "Search",
  },
  {
    id: "resume",
    href: "/resume",
    label: "Resume Studio",
    short: "Resume",
    description: "Your master resume, tailored versions, and what needs fixing.",
    icon: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4",
    group: "Prepare",
  },
  {
    id: "ai-resume",
    href: "/ai-resume",
    label: "AI Resume",
    short: "AI Resume",
    description: "Tailor an existing resume to a specific company and role without inventing anything.",
    icon: "M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7zM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z",
    group: "Prepare",
  },
  {
    id: "outreach",
    href: "/outreach",
    label: "Outreach",
    short: "Outreach",
    description: "Cover letters and recruiter emails, tailored per job and contact.",
    icon: "M3 6h18v12H3zM3 7l9 6 9-6",
    group: "Prepare",
  },
  {
    id: "interview-prep",
    href: "/interview-prep",
    label: "Interview Prep",
    short: "Interview",
    description: "Likely questions, STAR frameworks, strengths, and questions to ask them.",
    icon: "M8 10h8M8 14h5M21 12a9 9 0 1 1-9-9c1.7 0 3.3.5 4.6 1.3L21 3l-1.3 4.2A8.9 8.9 0 0 1 21 12z",
    group: "Prepare",
  },
  {
    id: "applications",
    href: "/jobs",
    label: "Applications",
    short: "Jobs",
    description: "Kanban board and list view of every role you are chasing.",
    icon: "M3 8h18v11H3zM8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18",
    group: "Track",
  },
  {
    id: "reminders",
    href: "/reminders",
    label: "Follow-ups",
    short: "Follow-ups",
    description: "Every reminder that is due, overdue, or coming up next.",
    icon: "M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 0 1-3.4 0",
    group: "Track",
  },
  {
    id: "contacts",
    href: "/contacts",
    label: "Contacts",
    short: "Contacts",
    description: "Recruiters, referrals, and interviewers across your pipeline.",
    icon: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    group: "Track",
  },
  {
    id: "insights",
    href: "/insights",
    label: "Insights",
    short: "Insights",
    description: "Response rates, weekly report, and where your search is leaking.",
    icon: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    group: "Track",
  },
  {
    id: "salary",
    href: "/salary",
    label: "Salary Compass",
    short: "Salary",
    description: "Compare your target range to US medians and get a negotiation script.",
    icon: "M12 3v18M17 7c0-2-2-4-5-4s-5 2-5 4c0 3 5 3 5 6 0 3 0 4 0 4M7 17c0 2 2 4 5 4s5-2 5-4c0-3-5-3-5-6",
    group: "Track",
  },
  {
    id: "profile",
    href: "/profile",
    label: "Profile",
    short: "Profile",
    description: "Education, experience, skills, and salary targets that power matching.",
    icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    group: "Track",
  },
  {
    id: "pricing",
    href: "/pricing",
    label: "Pricing",
    short: "Pricing",
    description: "Free and paid plans for serious job seekers.",
    icon: "M12 2v20M17 7l-5-5-5 5M7 17l5 5 5-5",
    group: "Track",
  },
];

export const NAV_GROUPS: NavItem["group"][] = ["Search", "Prepare", "Track"];

export function navItemFor(pathname: string): NavItem {
  const exact = NAV_ITEMS.find((item) => item.href === pathname);
  if (exact) return exact;
  const nested = NAV_ITEMS.filter((item) => item.href !== "/").find((item) =>
    pathname.startsWith(item.href),
  );
  return nested ?? NAV_ITEMS[0];
}
