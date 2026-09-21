# FitCheck Chrome Extension

MV3 job-search assistant for parsing job postings, opening FitCheck, and autofilling application forms.

## Install locally

1. Open Chrome and go to `chrome://extensions`.
2. Turn on **Developer mode** in the top right.
3. Click **Load unpacked**.
4. Select this `extension/` folder.

## What it does

- Adds a floating `F` button on LinkedIn, Indeed, Greenhouse, and Lever job pages.
- Parses the visible job title, company, location, and description.
- Popup opens FitCheck with the detected company and role.
- Popup can autofill name, email, phone, city, and LinkedIn from a locally saved profile.

## Current integration

- The extension runs standalone and stores its autofill profile in `chrome.storage.local`.
- `OPEN_FITCHECK` opens `http://localhost:3000/fit-check`.
- `OPEN_JOB` opens `http://localhost:3000/jobs-feed?company=...&role=...`.

## Next integration step

To make “Send this job to FitCheck” insert the full JD into the workspace, add an authenticated import endpoint on the app side and call it from `background.js`. The extension already captures and stores the parsed JD in `lastParsedJob`.
