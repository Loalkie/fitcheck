import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const SERVER_TIMEOUT_MS = 60_000;

function assertBuilt() {
  if (!existsSync(path.join(REPO_ROOT, ".next", "BUILD_ID"))) {
    throw new Error("No production build found. Run `npm run build` before `npm test`.");
  }
}

async function waitForHealth(baseUrl, child, output) {
  const deadline = Date.now() + SERVER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`The server exited with code ${child.exitCode}.\n${output.join("")}`);
    }
    try {
      const res = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(2_000) });
      if (res.ok) return;
    } catch {
      // Not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`The server did not answer /api/health within ${SERVER_TIMEOUT_MS / 1000}s.\n${output.join("")}`);
}

/**
 * Boots the built app against a throwaway SQLite database so tests never touch
 * the real `.data` directory or the deployment database.
 */
export async function startApp({ env = {} } = {}) {
  assertBuilt();

  const port = 3100 + Math.floor(Math.random() * 500);
  const baseUrl = `http://127.0.0.1:${port}`;
  const dataDir = mkdtempSync(path.join(tmpdir(), "fitcheck-test-"));
  const output = [];

  const child = spawn(path.join(REPO_ROOT, "node_modules", ".bin", "next"), ["start", "--port", String(port)], {
    cwd: REPO_ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      // Empty values keep optional subsystems off unless a test turns them on.
      DATABASE_URL: "",
      AI_API_KEY: "",
      MAIL_API_KEY: "",
      MAIL_API_URL: "",
      FIT_DATA_DIR: dataDir,
      FIT_ALLOW_EPHEMERAL_STORAGE: "1",
      ADMIN_EMAILS: "",
      APP_ORIGIN: baseUrl,
      ...env,
    },
  });
  child.stdout.on("data", (chunk) => output.push(String(chunk)));
  child.stderr.on("data", (chunk) => output.push(String(chunk)));

  await waitForHealth(baseUrl, child, output);

  return {
    baseUrl,
    dataDir,
    output,
    async stop() {
      if (child.exitCode === null) {
        const exited = new Promise((resolve) => child.once("exit", resolve));
        child.kill("SIGTERM");
        await exited;
      }
    },
  };
}

/**
 * Minimal cookie jar: the app only sets `fit_session`, and keeping the session
 * across requests is what makes the sign-in tests meaningful.
 */
export function makeClient(baseUrl) {
  const cookies = new Map();

  return {
    cookies,
    async fetch(pathname, options = {}) {
      const { ip = "203.0.113.10", headers: extra, ...init } = options;
      const headers = new Headers(extra ?? {});
      if (cookies.size > 0) {
        headers.set("cookie", [...cookies].map(([name, value]) => `${name}=${value}`).join("; "));
      }
      if (ip) headers.set("x-vercel-forwarded-for", ip);

      const res = await fetch(`${baseUrl}${pathname}`, { ...init, headers, redirect: "manual" });
      for (const raw of res.headers.getSetCookie()) {
        const [pair] = raw.split(";");
        const separator = pair.indexOf("=");
        if (separator === -1) continue;
        const name = pair.slice(0, separator).trim();
        const value = pair.slice(separator + 1).trim();
        if (value === "") cookies.delete(name);
        else cookies.set(name, value);
      }
      return res;
    },
    async json(pathname, options = {}) {
      const res = await this.fetch(pathname, options);
      const body = await res.json().catch(() => ({}));
      return { res, body };
    },
  };
}

/** Stands in for Resend so the reset and verification links are observable. */
export async function startMailStub() {
  const messages = [];
  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      const parsed = JSON.parse(raw || "{}");
      messages.push({ to: parsed.to, subject: parsed.subject, text: parsed.text });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ id: "stub" }));
    });
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    messages,
    url: `http://127.0.0.1:${port}/emails`,
    stop: () => new Promise((resolve) => server.close(resolve)),
  };
}

/** Pulls the single-use token out of the most recent matching mail. */
export function tokenFrom(messages, pathname) {
  const pattern = new RegExp(`${pathname}\\?token=([a-f0-9]+)`);
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const match = pattern.exec(messages[i].text ?? "");
    if (match) return match[1];
  }
  return "";
}
