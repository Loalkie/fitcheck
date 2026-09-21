import { get as httpsGet } from "https";

export function fetchText(
  url: string,
  timeoutMs = 15_000,
  extraHeaders?: Record<string, string>,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = httpsGet(
      url,
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; FitCheckBot/1.0)", ...extraHeaders },
        rejectUnauthorized: false,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location;
        if ([301, 302, 303, 307, 308].includes(status) && location) {
          res.resume();
          const next = new URL(location, url).toString();
          fetchText(next, timeoutMs, extraHeaders).then(resolve, reject);
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

export async function fetchJson<T>(
  url: string,
  timeoutMs = 15_000,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const text = await fetchText(url, timeoutMs, extraHeaders);
  return JSON.parse(text) as T;
}
