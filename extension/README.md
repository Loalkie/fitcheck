# FitCheck Chrome Extension

MV3 job-search assistant for parsing job postings, opening FitCheck, and autofilling application forms.

## Install locally

1. Open Chrome and go to `chrome://extensions`.
2. Turn on **Developer mode** in the top right.
3. Click **Load unpacked**.
4. Select this `extension/` folder.

## Point it at your deployment

The extension ships with the hosted app as its default:

- `https://fitcheck-68fa.vercel.app` — production
- `http://localhost:3000` — local development (`npm run dev`)

Open the popup, edit **Workspace address**, and press **Save app URL** to use anything else. The value is
stored in `chrome.storage.local` under `appUrl`; nothing else in the extension hardcodes a host.

`manifest.json` already grants the two built-in origins. A different deployment asks Chrome for its own host
permission when you save the address — that is why the popup shows a Chrome prompt the first time.

## What it does

- Adds a floating `F` button on LinkedIn, Indeed, Greenhouse, and Lever job pages.
- Parses the visible job title, company, location, and description.
- Popup opens FitCheck with the detected company and role.
- Popup can autofill name, email, phone, city, and LinkedIn from a locally saved profile.
- Popup can POST the parsed posting to `/api/import-job` and show the returned score, cover letter, and email.

## How the pieces talk

- `background.js` owns the app address: `getAppUrl()` reads `appUrl` from storage and falls back to
  `DEFAULT_APP_URL`. Messages carry a *path* (`{ type: "OPEN_FITCHECK", path: "/jobs" }`), never a full URL.
- `content.js` renders the in-page drawer and delegates navigation to the background script
  (`{ type: "APP_URL" }` when it needs the address for display).
- `popup.js` saves the address and requests the host permission.

## Autofill token

The import button needs a FitCheck extension token: sign in to the workspace, open **Profile**, press
**Connect extension** (`GET /api/extension-token`), and paste the value into the popup's *FitCheck token* field.
