import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { makeClient, startApp } from "./helpers/app.mjs";

const EMAIL = "ownerless@example.com";
const PASSWORD = "account-password-1";

function postJson(body) {
  return { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

describe("access control regressions", () => {
  let app;
  let client;

  before(async () => {
    // No ADMIN_EMAILS: the deployment has no owner configured, so the settings
    // endpoints must stay closed rather than fall open.
    app = await startApp();
    client = makeClient(app.baseUrl);
    const registered = await client.fetch("/api/auth/register", postJson({ email: EMAIL, password: PASSWORD }));
    assert.equal(registered.status, 200);
  });

  after(async () => {
    await app?.stop();
  });

  it("never lets a signed-in user grant themselves a paid plan", async () => {
    for (const plan of ["pro", "career"]) {
      const { res } = await client.json("/api/billing", {
        ...postJson({ plan }),
        method: "PUT",
      });
      assert.equal(res.status, 403, `${plan} must not be self-assignable`);
    }

    const { res, body } = await client.json("/api/billing", { ...postJson({ plan: "free" }), method: "PUT" });
    assert.equal(res.status, 200);
    assert.equal(body.plan, "free");
  });

  it("keeps the integration keys closed to everyone but the owner", async () => {
    const anonymous = await fetch(`${app.baseUrl}/api/settings`);
    assert.equal(anonymous.status, 401);

    const signedIn = await client.json("/api/settings");
    assert.equal(signedIn.res.status, 403);

    const write = await client.json("/api/settings", { ...postJson({ AI_API_KEY: "stolen" }), method: "PUT" });
    assert.equal(write.res.status, 403);
  });

  it("answers a malformed upload with 400 instead of crashing", async () => {
    const { res } = await client.json("/api/analyze", postJson({ resumeText: "hi" }));
    assert.equal(res.status, 400);
  });

  it("requires a token for the extension import endpoint", async () => {
    const anonymous = await fetch(`${app.baseUrl}/api/import-job`, {
      ...postJson({ title: "Engineer", company: "Acme" }),
    });
    assert.equal(anonymous.status, 401);

    const noToken = await fetch(`${app.baseUrl}/api/extension-token`);
    assert.equal(noToken.status, 401);
  });

  it("rate limits anonymous recovery mail per network", async () => {
    const ip = "198.51.100.90";
    const statuses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { res } = await client.json("/api/auth/forgot-password", {
        ...postJson({ email: "someone@example.com" }),
        ip,
      });
      statuses.push(res.status);
    }
    assert.deepEqual(
      statuses.slice(0, 5).map((status) => status === 503 || status === 200),
      [true, true, true, true, true],
      `the first five attempts stay inside the budget, got ${statuses.join(",")}`,
    );
    assert.equal(statuses[5], 429, `the sixth attempt should be limited, got ${statuses.join(",")}`);
  });
});
