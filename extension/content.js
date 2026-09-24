(function () {
  if (window.__FITCHECK_CONTENT_LOADED__) return;
  window.__FITCHECK_CONTENT_LOADED__ = true;

  function text(selectors) {
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      if (node?.textContent?.trim()) return node.textContent.trim();
    }
    return "";
  }

  function parseJob() {
    const host = location.hostname;
    let title = "";
    let company = "";
    let location = "";
    let description = "";

    if (host.includes("greenhouse.io")) {
      title = text(["h1.job__title", ".job__title", "h1"]);
      company = text([".company-name", ".job__company"]);
      location = text([".job__location", ".job__location-anywhere"]);
      description = text([".job__description", ".job-post-content", "#content"]);
    } else if (host.includes("lever.co")) {
      title = text(["h2.posting-headline", ".posting-headline", "h2"]);
      company = text([".posting-categories", ".main-header-logo", "title"]);
      location = text([".posting-categories", ".sort-by-location"]);
      description = text([".section-wrapper.posting-content", ".posting-page"]);
    } else if (host.includes("linkedin.com")) {
      title = text(["h1.top-card-layout__title", ".job-details-jobs-unified-top-card__job-title"]);
      company = text([".job-details-jobs-unified-top-card__company-name", ".topcard__org-name-link"]);
      location = text([".job-details-jobs-unified-top-card__primary-description", ".topcard__flavor--bullet"]);
      description = text([".job-details-jobs-unified-top-card__description", ".jobs-description-content__text", ".show-more-less-html__markup"]);
    } else if (host.includes("indeed.com")) {
      title = text(["h1.jobsearch-JobInfoHeader-title", ".jobsearch-JobInfoHeader-title"]);
      company = text(["[data-company-name='true']", ".jobsearch-InlineCompanyRating"]);
      location = text([".jobsearch-JobInfoHeader-subtitle", ".jobsearch-JobInfoHeader-location"]);
      description = text(["#jobDescriptionText", ".jobsearch-jobDescriptionText"]);
    }

    return {
      title: title || document.title.split("|")[0].trim(),
      company: company || document.title.split("|")[1]?.trim() || "",
      location,
      description,
      url: location.href,
      source: host,
      capturedAt: new Date().toISOString(),
    };
  }

  function addFloatingButton() {
    if (document.getElementById("fitcheck-float")) return;
    const button = document.createElement("button");
    button.id = "fitcheck-float";
    button.type = "button";
    button.textContent = "F";
    button.title = "Open FitCheck";
    button.style.cssText = [
      "position:fixed",
      "right:18px",
      "bottom:18px",
      "z-index:2147483647",
      "width:44px",
      "height:44px",
      "border-radius:14px",
      "border:none",
      "background:linear-gradient(135deg,#2563eb,#4f46e5)",
      "color:#fff",
      "font-weight:700",
      "font-size:17px",
      "cursor:pointer",
      "box-shadow:0 12px 28px -12px rgba(37,99,235,.9)",
    ].join(";");
    button.addEventListener("click", () => {
      const job = parseJob();
      chrome.storage.local.set({ lastParsedJob: job });
      toggleDrawer();
      renderDrawer(job);
    });
    document.body.appendChild(button);
  }

  function createDrawer() {
    if (document.getElementById("fitcheck-drawer")) return;
    const drawer = document.createElement("div");
    drawer.id = "fitcheck-drawer";
    drawer.style.cssText = [
      "position:fixed",
      "top:16px",
      "right:16px",
      "z-index:2147483646",
      "width:340px",
      "max-height:calc(100vh - 32px)",
      "overflow:auto",
      "border-radius:16px",
      "background:#fff",
      "box-shadow:0 24px 60px -20px rgba(15,23,42,.45)",
      "padding:14px",
      "display:none",
      "font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "color:#0f172a",
    ].join(";");
    drawer.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="display:inline-flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:8px;background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff;font-weight:700">F</span>
          <strong style="font-size:14px">FitCheck</strong>
        </div>
        <button data-close style="border:0;background:transparent;font-size:18px;cursor:pointer">×</button>
      </div>
      <div data-body style="margin-top:10px"></div>
      <div data-actions style="margin-top:12px;display:grid;gap:8px"></div>
      <div data-drafts style="margin-top:12px"></div>
    `;
    drawer.querySelector("[data-close]").addEventListener("click", () => {
      drawer.style.display = "none";
    });
    document.body.appendChild(drawer);
  }

  function renderDrawer(job) {
    const drawer = document.getElementById("fitcheck-drawer");
    if (!drawer) return;
    drawer.querySelector("[data-body]").innerHTML = [
      job.title ? `<div style="font-weight:700;font-size:14px">${escapeHtml(job.title)}</div>` : "",
      job.company ? `<div style="color:#64748b;font-size:12px">${escapeHtml(job.company)}</div>` : "",
      job.location ? `<div style="color:#94a3b8;font-size:11px">${escapeHtml(job.location)}</div>` : "",
    ].join("");
    drawer.querySelector("[data-actions]").innerHTML = `
      <button data-import style="border:0;border-radius:10px;padding:9px;background:#2563eb;color:#fff;font-weight:600;cursor:pointer">Import & score</button>
      <button data-open style="border:0;border-radius:10px;padding:9px;background:#0f172a;color:#fff;font-weight:600;cursor:pointer">Open FitCheck</button>
      <div data-status style="font-size:11px;color:#64748b;text-align:center"></div>
    `;
    drawer.querySelector("[data-import]").addEventListener("click", async () => {
      const status = drawer.querySelector("[data-status]");
      status.textContent = "Importing…";
      const { token, profile } = await chrome.storage.local.get(["token", "profile"]);
      const tokenValue = token || profile?.token;
      if (!tokenValue) {
        status.textContent = "Add your FitCheck token in the extension popup first.";
        return;
      }
      chrome.runtime.sendMessage({ type: "IMPORT_JOB", job, token: tokenValue }, (response) => {
        if (response?.ok) {
          status.innerHTML = `Imported ✓${typeof response.score === "number" ? ` · Score ${response.score}` : ""}`;
          const draftsNode = drawer.querySelector("[data-drafts]");
          if (draftsNode) {
            const emailText = response.email
              ? `Subject: ${response.email.subject || ""}\n\n${response.email.body || ""}`
              : "";
            draftsNode.innerHTML = [
              response.coverLetter
                ? `<div style="margin-top:8px"><div style="font-size:11px;font-weight:700;color:#64748b">COVER LETTER</div><textarea readonly style="width:100%;height:120px;margin-top:4px;border:1px solid #e2e8f0;border-radius:8px;padding:8px;font-size:11px">${escapeHtml(response.coverLetter)}</textarea><button data-copy-cover style="border:0;border-radius:8px;padding:6px;background:#0f172a;color:#fff;cursor:pointer;font-size:11px">Copy cover letter</button></div>`
                : "",
              emailText
                ? `<div style="margin-top:8px"><div style="font-size:11px;font-weight:700;color:#64748b">FOLLOW-UP EMAIL</div><textarea readonly style="width:100%;height:120px;margin-top:4px;border:1px solid #e2e8f0;border-radius:8px;padding:8px;font-size:11px">${escapeHtml(emailText)}</textarea><button data-copy-email style="border:0;border-radius:8px;padding:6px;background:#0f172a;color:#fff;cursor:pointer;font-size:11px">Copy email</button></div>`
                : "",
            ].join("");
            draftsNode.querySelector("[data-copy-cover]")?.addEventListener("click", () => {
              navigator.clipboard.writeText(response.coverLetter || "");
            });
            draftsNode.querySelector("[data-copy-email]")?.addEventListener("click", () => {
              navigator.clipboard.writeText(emailText);
            });
          }
        } else {
          status.textContent = response?.error || "Import failed.";
        }
      });
    });
    drawer.querySelector("[data-open]").addEventListener("click", () => {
      // The background script knows which deployment to open; the content
      // script never keeps a copy of the address.
      chrome.runtime.sendMessage({ type: "OPEN_FITCHECK", path: "/jobs" });
    });
  }

  function toggleDrawer() {
    const drawer = document.getElementById("fitcheck-drawer");
    if (!drawer) return;
    drawer.style.display = drawer.style.display === "none" ? "block" : "none";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  function setNativeValue(field, value) {
    const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
    descriptor?.set?.call(field, value);
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setFile(field, text, filename) {
    try {
      const file = new File([text || "Resume uploaded by FitCheck."], filename || "resume.txt", { type: "text/plain" });
      const dt = new DataTransfer();
      dt.items.add(file);
      field.files = dt.files;
      field.dispatchEvent(new Event("change", { bubbles: true }));
    } catch {
      // file assignment not supported
    }
  }

  function fieldLabel(field) {
    const linked = document.querySelector(`label[for="${CSS.escape(field.id || "")}"]`);
    const closest = field.closest("label");
    return [
      field.name,
      field.id,
      field.getAttribute("aria-label"),
      field.placeholder,
      field.getAttribute("data-testid"),
      field.getAttribute("data-automation-id"),
      field.getAttribute("aria-labelledby"),
      linked?.textContent,
      closest?.textContent,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function matches(name, keys) {
    return keys.some((key) => name.includes(key));
  }

  function autofill() {
    chrome.storage.local.get(["profile"], ({ profile }) => {
      if (!profile) return;
      const fields = document.querySelectorAll("input, textarea, select");
      fields.forEach((field) => {
        const name = fieldLabel(field);

        if (field instanceof HTMLInputElement && field.type === "file") {
          if (matches(name, ["resume", "cv", "upload resume", "attach resume"]) && profile.resumeText) {
            setFile(field, profile.resumeText, "resume.txt");
          }
          return;
        }

        if (field instanceof HTMLTextAreaElement) {
          if (matches(name, ["resume", "cv", "summary", "about me", "cover letter"]) && profile.resumeText && !field.value) {
            setNativeValue(field, profile.resumeText);
          }
          if (matches(name, ["description", "experience", "work history", "responsibilities"]) && profile.expDescription && !field.value) {
            setNativeValue(field, profile.expDescription);
          }
          return;
        }

        if (field instanceof HTMLSelectElement) return;

        if (field.value) return;

        if (matches(name, ["first", "given name"]) && profile.firstName) setNativeValue(field, profile.firstName);
        else if (matches(name, ["last", "family name", "surname"]) && profile.lastName) setNativeValue(field, profile.lastName);
        else if (matches(name, ["email", "e-mail"]) && profile.email) setNativeValue(field, profile.email);
        else if (matches(name, ["phone", "mobile", "telephone"]) && profile.phone) setNativeValue(field, profile.phone);
        else if (matches(name, ["city", "location"]) && profile.city) setNativeValue(field, profile.city);
        else if (matches(name, ["linkedin", "website", "portfolio"]) && profile.linkedin) setNativeValue(field, profile.linkedin);
        else if (matches(name, ["job title", "position", "role"]) && profile.expRole) setNativeValue(field, profile.expRole);
        else if (matches(name, ["company", "employer"]) && profile.expCompany) setNativeValue(field, profile.expCompany);
        else if (matches(name, ["start date", "start month", "from"]) && profile.expStart) setNativeValue(field, profile.expStart);
        else if (matches(name, ["end date", "end month", "to"]) && profile.expEnd) setNativeValue(field, profile.expEnd);
        else if (matches(name, ["school", "university", "college", "institution"]) && profile.eduSchool) setNativeValue(field, profile.eduSchool);
        else if (matches(name, ["degree", "education level"]) && profile.eduDegree) setNativeValue(field, profile.eduDegree);
        else if (matches(name, ["field of study", "major", "discipline"]) && profile.eduField) setNativeValue(field, profile.eduField);
        else if (matches(name, ["education start", "attended from"]) && profile.eduStart) setNativeValue(field, profile.eduStart);
        else if (matches(name, ["education end", "graduation", "attended to"]) && profile.eduEnd) setNativeValue(field, profile.eduEnd);
      });
    });
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "PARSE_JOB") {
      sendResponse(parseJob());
    }
    if (message?.type === "AUTOFILL_PAGE") {
      autofill();
      sendResponse({ ok: true });
    }
  });

  if (document.body) {
    addFloatingButton();
    createDrawer();
  } else {
    window.addEventListener("DOMContentLoaded", () => {
      addFloatingButton();
      createDrawer();
    });
  }
})();
