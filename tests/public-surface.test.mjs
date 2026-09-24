import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { makeClient, startApp } from "./helpers/app.mjs";

const APP_DIR = path.resolve(import.meta.dirname, "../src/app/(app)");

/** Every page behind the app shell, read from disk so a new page cannot be forgotten. */
function workspaceRoutes() {
  return readdirSync(APP_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "pricing")
    .map((entry) => `/${entry.name}`)
    .sort();
}

describe("public surface", () => {
  let app;
  let client;

  before(async () => {
    app = await startApp();
    client = makeClient(app.baseUrl);
  });

  after(async () => {
    await app?.stop();
  });

  it("answers health checks", async () => {
    const { res, body } = await client.json("/api/health");
    assert.equal(res.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.db, true);
  });

  it("serves robots.txt that keeps crawlers out of the workspace", async () => {
    const res = await client.fetch("/robots.txt");
    assert.equal(res.status, 200);
    const body = await res.text();

    assert.match(body, /Sitemap: http:\/\/127\.0\.0\.1:\d+\/sitemap\.xml/);
    assert.match(body, /Allow: \/pricing/);
    assert.match(body, /Disallow: \/api\//);
    for (const route of workspaceRoutes()) {
      assert.ok(
        body.includes(`Disallow: ${route}\n`),
        `robots.txt is missing "Disallow: ${route}" — add new workspace pages to WORKSPACE_ROUTES`,
      );
    }
  });

  it("lists only public pages in sitemap.xml", async () => {
    const res = await client.fetch("/sitemap.xml");
    assert.equal(res.status, 200);
    const body = await res.text();

    assert.match(body, /<urlset/);
    for (const route of ["/", "/pricing", "/privacy", "/terms"]) {
      assert.ok(body.includes(`<loc>${app.baseUrl}${route}</loc>`), `sitemap is missing ${route}`);
    }
    for (const route of workspaceRoutes()) {
      assert.ok(!body.includes(`${route}</loc>`), `sitemap should not list the workspace page ${route}`);
    }
  });

  it("marks workspace pages noindex and leaves the landing page indexable", async () => {
    const dashboard = await client.fetch("/dashboard");
    assert.equal(dashboard.status, 200);
    assert.match(await dashboard.text(), /<meta name="robots" content="noindex/);

    const landing = await client.fetch("/");
    assert.equal(landing.status, 200);
    const html = await landing.text();
    assert.ok(!/name="robots" content="noindex/.test(html));
    assert.match(html, /FitCheck/);
  });

  it("publishes a privacy policy that names the processors it actually uses", async () => {
    const res = await client.fetch("/privacy");
    assert.equal(res.status, 200);
    const html = await res.text();

    assert.match(html, /DeepSeek/);
    assert.match(html, /Stripe/);
    assert.match(html, /Delete account/);
    assert.match(html, /not a consumer reporting agency/i);
  });

  it("publishes terms that cover billing, AI output, and cancellation", async () => {
    const res = await client.fetch("/terms");
    assert.equal(res.status, 200);
    const html = await res.text();

    assert.match(html, /AI output/);
    assert.match(html, /Manage billing/);
    assert.match(html, /renews automatically/);
    assert.match(html, /Do not use FitCheck to/);
  });
});
