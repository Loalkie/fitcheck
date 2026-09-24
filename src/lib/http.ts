import { get as httpGet } from "node:http";
import { get as httpsGet } from "node:https";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

const MAX_REDIRECTS = 5;

/** Hosts that only ever mean "the network we are running inside". */
const BLOCKED_HOSTNAMES = /^(localhost|.*\.localhost|.*\.local|.*\.internal|.*\.home\.arpa)$/i;

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 6) {
    const value = address.toLowerCase();
    if (value === "::" || value === "::1") return true;
    if (/^f[cd]/.test(value)) return true; // fc00::/7 unique local
    if (/^fe[89ab]/.test(value)) return true; // fe80::/10 link local
    const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? isPrivateAddress(mapped[1]) : false;
  }
  const [first, second] = address.split(".").map(Number);
  if (first === 0 || first === 10 || first === 127) return true;
  if (first === 169 && second === 254) return true; // link local, includes cloud metadata
  if (first === 172 && second >= 16 && second <= 31) return true;
  if (first === 192 && second === 168) return true;
  if (first === 100 && second >= 64 && second <= 127) return true; // carrier-grade NAT
  return first >= 224; // multicast and reserved
}

/**
 * Job posting URLs come straight from users, so every hop is checked — without
 * this the server can be aimed at internal services or at the metadata endpoint
 * a cloud host exposes on localhost.
 */
async function assertFetchable(target: URL): Promise<void> {
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    throw new Error("Only http and https URLs can be fetched.");
  }
  if (BLOCKED_HOSTNAMES.test(target.hostname)) {
    throw new Error("That host cannot be fetched from the server.");
  }
  const addresses = isIP(target.hostname)
    ? [target.hostname]
    : (await lookup(target.hostname, { all: true })).map((entry) => entry.address);
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new Error("That host cannot be fetched from the server.");
  }
}

/**
 * TLS certificates are verified by default. `FIT_INSECURE_FETCH=1` is an escape
 * hatch for a machine whose CA store cannot validate a job board.
 */
const TLS_OPTIONS = process.env.FIT_INSECURE_FETCH === "1" ? { rejectUnauthorized: false } : {};

function requestText(
  target: URL,
  timeoutMs: number,
  extraHeaders?: Record<string, string>,
  depth = 0,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const send = target.protocol === "http:" ? httpGet : httpsGet;
    const req = send(
      target,
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; FitCheckBot/1.0)", ...extraHeaders },
        ...TLS_OPTIONS,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location;
        if ([301, 302, 303, 307, 308].includes(status) && location) {
          res.resume();
          if (depth >= MAX_REDIRECTS) {
            reject(new Error("Too many redirects."));
            return;
          }
          let next: URL;
          try {
            next = new URL(location, target);
          } catch {
            reject(new Error("The server redirected to an invalid URL."));
            return;
          }
          assertFetchable(next)
            .then(() => requestText(next, timeoutMs, extraHeaders, depth + 1))
            .then(resolve, reject);
          return;
        }
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (status >= 200 && status < 400) resolve(data);
          else reject(new Error(`HTTP ${status}`));
        });
      },
    );
    req.setTimeout(timeoutMs, () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

export async function fetchText(
  url: string,
  timeoutMs = 15_000,
  extraHeaders?: Record<string, string>,
): Promise<string> {
  const target = new URL(url);
  await assertFetchable(target);
  return requestText(target, timeoutMs, extraHeaders);
}

export async function fetchJson<T>(
  url: string,
  timeoutMs = 15_000,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const text = await fetchText(url, timeoutMs, extraHeaders);
  return JSON.parse(text) as T;
}
