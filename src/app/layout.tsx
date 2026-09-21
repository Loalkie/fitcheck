import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppProvider from "@/components/AppProvider";
import GalaxyBackground from "@/components/GalaxyBackground";
import DialogProvider from "@/components/Dialogs";

export const metadata: Metadata = {
  title: "FitCheck · Job search workspace",
  description:
    "Score your resume against any job, track every application, find matching US companies, and generate cover letters and recruiter emails.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FitCheck",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="relative min-h-screen text-slate-900 antialiased">
        <GalaxyBackground />
        <DialogProvider>
          <AppProvider>
            <div className="relative z-10">{children}</div>
          </AppProvider>
        </DialogProvider>
      </body>
    </html>
  );
}
