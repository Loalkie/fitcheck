import type { Metadata } from "next";
import AppShell from "@/components/AppShell";

/**
 * The workspace is a tool surface, not something to rank in search results:
 * keep every page under it out of the index.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
