/**
 * The workspace this extension talks to. `DEFAULT_APP_URL` is the hosted app;
 * anyone running their own deployment (or developing locally) points the
 * extension at it from the popup, which stores the choice in `appUrl`.
 */
const DEFAULT_APP_URL = "https://fitcheck-68fa.vercel.app";

function normalizeAppUrl(value) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.origin;
  } catch {
    return "";
  }
}

function getAppUrl(callback) {
  chrome.storage.local.get("appUrl", ({ appUrl }) => {
    callback(normalizeAppUrl(appUrl) || DEFAULT_APP_URL);
  });
}

/** A page inside the workspace: either an explicit path or the default one. */
function workspaceUrl(base, path) {
  return `${base}${path}`;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    fitcheckInstalledAt: new Date().toISOString(),
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") return;

  // The content script needs the address for links it renders itself.
  if (message.type === "APP_URL") {
    getAppUrl((base) => sendResponse({ ok: true, base }));
    return true;
  }

  if (message.type === "OPEN_FITCHECK") {
    getAppUrl((base) => {
      const path = typeof message.path === "string" && message.path.startsWith("/") ? message.path : "/fit-check";
      chrome.tabs.create({ url: workspaceUrl(base, path) });
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === "OPEN_JOB") {
    getAppUrl((base) => {
      const params = new URLSearchParams();
      if (message.job?.company) params.set("company", message.job.company);
      if (message.job?.title) params.set("role", message.job.title);
      chrome.tabs.create({ url: workspaceUrl(base, `/jobs-feed?${params.toString()}`) });
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === "AUTOFILL") {
    chrome.tabs.sendMessage(sender.tab.id, { type: "AUTOFILL_PAGE" }, (response) => {
      sendResponse(response || { ok: false });
    });
    return true;
  }

  if (message.type === "IMPORT_JOB") {
    getAppUrl((base) => {
      fetch(`${base}/api/import-job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${message.token || ""}`,
        },
        body: JSON.stringify(message.job || {}),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || "Import failed.");
          sendResponse({
            ok: true,
            score: data.score,
            coverLetter: data.coverLetter,
            email: data.email,
          });
        })
        .catch((err) => sendResponse({ ok: false, error: err.message }));
    });
    return true;
  }
});
