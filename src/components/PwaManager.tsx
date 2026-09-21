"use client";

import { useEffect, useState } from "react";
import { useApp } from "./AppProvider";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaManager() {
  const { jobs } = useApp();
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [notificationState, setNotificationState] = useState<NotificationPermission>("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      } else {
        // A service worker that serves a cached page while the dev server is down
        // makes the app look alive but every request fails. Keep dev uncached.
        void navigator.serviceWorker
          .getRegistrations()
          .then((registrations) => Promise.all(registrations.map((r) => r.unregister())))
          .then(() =>
            "caches" in window
              ? caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
              : undefined,
          )
          .catch(() => {});
      }
    }
    if ("Notification" in window) setNotificationState(Notification.permission);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (notificationState !== "granted") return;
    const last = localStorage.getItem("fitcheck-last-reminder-day");
    const today = todayISO();
    const due = jobs
      .filter((j) => j.followUp?.date && j.followUp.date <= today)
      .slice(0, 3);

    if (due.length > 0 && last !== today) {
      due.forEach((job) => {
        if ("Notification" in window) {
          new Notification("FitCheck reminder", {
            body: `${job.title || "Role"} · ${job.company || "Company"} — ${job.followUp!.date}`,
            icon: "/icons/icon-192.png",
            tag: job.id,
          });
        }
      });
      localStorage.setItem("fitcheck-last-reminder-day", today);
    }

    const timer = window.setInterval(() => {
      const now = todayISO();
      const dueNow = jobs.filter((j) => j.followUp?.date && j.followUp.date <= now).slice(0, 3);
      if (dueNow.length && localStorage.getItem("fitcheck-last-reminder-day") !== now) {
        dueNow.forEach((job) => {
          if ("Notification" in window) {
            new Notification("FitCheck reminder", {
              body: `${job.title || "Role"} · ${job.company || "Company"} — ${job.followUp!.date}`,
              icon: "/icons/icon-192.png",
              tag: job.id,
            });
          }
        });
        localStorage.setItem("fitcheck-last-reminder-day", now);
      }
    }, 15 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [notificationState, jobs]);

  if (!mounted) return null;

  async function enableNotifications() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationState(permission);
    if (permission === "granted") {
      new Notification("FitCheck reminders on", {
        body: "We will notify you when a follow-up is due today or overdue.",
        icon: "/icons/icon-192.png",
      });
    }
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice.catch(() => {});
    setInstallEvent(null);
  }

  if (!installEvent && (!("Notification" in window) || notificationState === "granted")) return null;

  return (
    <div className="flex items-center gap-2">
      {installEvent && (
        <button type="button" onClick={() => void install()} className="btn-secondary btn-sm">
          Install app
        </button>
      )}
      {typeof window !== "undefined" && "Notification" in window && notificationState !== "granted" && (
        <button type="button" onClick={() => void enableNotifications()} className="btn-secondary btn-sm">
          🔔 Enable reminders
        </button>
      )}
    </div>
  );
}
