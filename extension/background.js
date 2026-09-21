const APP_URL = "http://localhost:3000";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    fitcheckInstalledAt: new Date().toISOString(),
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") return;

  if (message.type === "OPEN_FITCHECK") {
    const url = message.url || `${APP_URL}/fit-check`;
    chrome.tabs.create({ url });
    sendResponse({ ok: true });
  }

  if (message.type === "OPEN_JOB") {
    const params = new URLSearchParams();
    if (message.job?.company) params.set("company", message.job.company);
    if (message.job?.title) params.set("role", message.job.title);
    chrome.tabs.create({ url: `${APP_URL}/jobs-feed?${params.toString()}` });
    sendResponse({ ok: true });
  }

  if (message.type === "AUTOFILL") {
    chrome.tabs.sendMessage(sender.tab.id, { type: "AUTOFILL_PAGE" }, (response) => {
      sendResponse(response || { ok: false });
    });
    return true;
  }

  if (message.type === "IMPORT_JOB") {
    fetch(`${APP_URL}/api/import-job`, {
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
    return true;
  }
});
