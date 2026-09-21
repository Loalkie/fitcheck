const jobNode = document.getElementById("job");

function renderJob(job) {
  if (!job?.title) {
    jobNode.textContent = "Open a job posting to parse it.";
    jobNode.classList.add("muted");
    return;
  }
  jobNode.classList.remove("muted");
  jobNode.textContent = [
    job.title,
    job.company,
    job.location,
  ]
    .filter(Boolean)
    .join("\n");
}

function loadProfile() {
  chrome.storage.local.get(["profile", "lastParsedJob"], ({ profile, lastParsedJob }) => {
    if (profile) {
      document.getElementById("firstName").value = profile.firstName || "";
      document.getElementById("lastName").value = profile.lastName || "";
      document.getElementById("email").value = profile.email || "";
      document.getElementById("phone").value = profile.phone || "";
      document.getElementById("city").value = profile.city || "";
      document.getElementById("linkedin").value = profile.linkedin || "";
      document.getElementById("resumeText").value = profile.resumeText || "";
      document.getElementById("expRole").value = profile.expRole || "";
      document.getElementById("expCompany").value = profile.expCompany || "";
      document.getElementById("expStart").value = profile.expStart || "";
      document.getElementById("expEnd").value = profile.expEnd || "";
      document.getElementById("expDescription").value = profile.expDescription || "";
      document.getElementById("eduSchool").value = profile.eduSchool || "";
      document.getElementById("eduDegree").value = profile.eduDegree || "";
      document.getElementById("eduField").value = profile.eduField || "";
      document.getElementById("eduStart").value = profile.eduStart || "";
      document.getElementById("eduEnd").value = profile.eduEnd || "";
      document.getElementById("token").value = profile.token || "";
    }
    renderJob(lastParsedJob);
  });
}

document.getElementById("parse").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const job = await chrome.tabs.sendMessage(tab.id, { type: "PARSE_JOB" }).catch(() => null);
  if (job) {
    await chrome.storage.local.set({ lastParsedJob: job });
    renderJob(job);
  }
});

document.getElementById("import").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const job = await chrome.tabs.sendMessage(tab.id, { type: "PARSE_JOB" }).catch(() => null);
  if (!job) return;
  const { token, profile } = await chrome.storage.local.get(["token", "profile"]);
  const tokenValue = token || profile?.token;
  if (!tokenValue) {
    jobNode.textContent = "Paste your FitCheck token in the editor first.";
    return;
  }
  jobNode.textContent = "Importing…";
  chrome.runtime.sendMessage({ type: "IMPORT_JOB", job, token: tokenValue }, (response) => {
    jobNode.textContent = response?.ok ? "Imported ✓" : (response?.error || "Import failed.");
    renderJob(job);
  });
});

document.getElementById("autofill").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  await chrome.tabs.sendMessage(tab.id, { type: "AUTOFILL_PAGE" }).catch(() => null);
});

document.getElementById("open-app").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "OPEN_FITCHECK" });
});

document.getElementById("save-profile").addEventListener("click", () => {
  const profile = {
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    city: document.getElementById("city").value.trim(),
    linkedin: document.getElementById("linkedin").value.trim(),
    resumeText: document.getElementById("resumeText").value.trim(),
    expRole: document.getElementById("expRole").value.trim(),
    expCompany: document.getElementById("expCompany").value.trim(),
    expStart: document.getElementById("expStart").value.trim(),
    expEnd: document.getElementById("expEnd").value.trim(),
    expDescription: document.getElementById("expDescription").value.trim(),
    eduSchool: document.getElementById("eduSchool").value.trim(),
    eduDegree: document.getElementById("eduDegree").value.trim(),
    eduField: document.getElementById("eduField").value.trim(),
    eduStart: document.getElementById("eduStart").value.trim(),
    eduEnd: document.getElementById("eduEnd").value.trim(),
    token: document.getElementById("token").value.trim(),
  };
  chrome.storage.local.set({ profile });
});

loadProfile();
