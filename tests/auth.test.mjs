import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { makeClient, startApp, startMailStub, tokenFrom } from "./helpers/app.mjs";

const EMAIL = "casey@example.com";
const OLD_PASSWORD = "old-password-1";
const NEW_PASSWORD = "new-password-2";

function postJson(body) {
  return { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

describe("account lifecycle", () => {
  let app;
  let mail;
  let client;

  before(async () => {
    mail = await startMailStub();
    app = await startApp({ env: { MAIL_API_KEY: "test-key", MAIL_API_URL: mail.url } });
    client = makeClient(app.baseUrl);
  });

  after(async () => {
    await app?.stop();
    await mail?.stop();
  });

  it("rejects a weak password and a malformed address", async () => {
    const weak = await client.json("/api/auth/register", postJson({ email: EMAIL, password: "short" }));
    assert.equal(weak.res.status, 400);

    const badEmail = await client.json("/api/auth/register", postJson({ email: "not-an-email", password: OLD_PASSWORD }));
    assert.equal(badEmail.res.status, 400);
  });

  it("registers an account with an httpOnly session cookie", async () => {
    const res = await client.fetch("/api/auth/register", postJson({ email: EMAIL, password: OLD_PASSWORD }));
    assert.equal(res.status, 200);

    const cookie = res.headers.getSetCookie().find((value) => value.startsWith("fit_session="));
    assert.ok(cookie, "register should set the session cookie");
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/i);
    // The app runs over https in production, so the cookie must be Secure there.
    assert.match(cookie, /Secure/);

    const { body } = await client.json("/api/auth/me");
    assert.equal(body.user.email, EMAIL);
    assert.equal(body.user.emailVerified, false);
  });

  it("refuses a second account on the same address", async () => {
    const { res } = await client.json("/api/auth/register", postJson({ email: EMAIL, password: OLD_PASSWORD }));
    assert.equal(res.status, 409);
  });

  it("verifies the email address through a one-time link", async () => {
    const sent = await client.fetch("/api/auth/send-verification", { method: "POST" });
    assert.equal(sent.status, 200);

    const token = tokenFrom(mail.messages, "/verify-email");
    assert.ok(token, "the verification mail should contain a token");

    const verified = await client.json("/api/auth/verify-email", {
      ...postJson({ token }),
      ip: "198.51.100.18",
    });
    assert.equal(verified.res.status, 200);

    const { body } = await client.json("/api/auth/me");
    assert.equal(body.user.emailVerified, true);

    const again = await client.json("/api/auth/verify-email", { ...postJson({ token }), ip: "198.51.100.19" });
    assert.equal(again.res.status, 400, "a verification link must work only once");
  });

  it("stops sending verification mail once the address is confirmed", async () => {
    const before = mail.messages.length;
    const { res, body } = await client.json("/api/auth/send-verification", { method: "POST" });
    assert.equal(res.status, 200);
    assert.equal(body.alreadyVerified, true);
    assert.equal(mail.messages.length, before, "no second mail for an already verified address");
  });

  it("emails a single-use reset link and signs every device out on use", async () => {
    // A second device, to prove the reset drops existing sessions.
    const otherDevice = makeClient(app.baseUrl);
    const signedIn = await otherDevice.json("/api/auth/login", postJson({ email: EMAIL, password: OLD_PASSWORD }));
    assert.equal(signedIn.res.status, 200);

    const requested = await client.json("/api/auth/forgot-password", {
      ...postJson({ email: EMAIL }),
      ip: "198.51.100.11",
    });
    assert.equal(requested.res.status, 200);
    assert.equal(mail.messages.at(-1).to, EMAIL);

    const token = tokenFrom(mail.messages, "/reset-password");
    assert.ok(token, "the reset mail should contain a token");

    const reset = await client.json("/api/auth/reset-password", {
      ...postJson({ token, password: NEW_PASSWORD }),
      ip: "198.51.100.12",
    });
    assert.equal(reset.res.status, 200);

    const afterReset = await otherDevice.json("/api/auth/me");
    assert.equal(afterReset.body.user, null, "the reset should invalidate existing sessions");

    const staleLogin = await client.json("/api/auth/login", {
      ...postJson({ email: EMAIL, password: OLD_PASSWORD }),
      ip: "198.51.100.13",
    });
    assert.equal(staleLogin.res.status, 401);

    const freshLogin = await client.json("/api/auth/login", {
      ...postJson({ email: EMAIL, password: NEW_PASSWORD }),
      ip: "198.51.100.14",
    });
    assert.equal(freshLogin.res.status, 200);

    const reused = await client.json("/api/auth/reset-password", {
      ...postJson({ token, password: "another-password-3" }),
      ip: "198.51.100.15",
    });
    assert.equal(reused.res.status, 400, "a reset link must work only once");
  });

  it("reports an unknown address without revealing that it is unknown", async () => {
    const before = mail.messages.length;
    const { res, body } = await client.json("/api/auth/forgot-password", {
      ...postJson({ email: "nobody@example.com" }),
      ip: "198.51.100.16",
    });
    assert.equal(res.status, 200);
    assert.deepEqual(body, { ok: true });
    assert.equal(mail.messages.length, before, "no mail should be sent for an unknown address");
  });

  it("deletes the account only with the right password", async () => {
    const wrong = await client.json("/api/auth/delete-account", postJson({ password: "not-the-password" }));
    assert.equal(wrong.res.status, 403);

    const deleted = await client.fetch("/api/auth/delete-account", postJson({ password: NEW_PASSWORD }));
    assert.equal(deleted.status, 200);
    assert.ok(
      deleted.headers.getSetCookie().some((value) => value.startsWith("fit_session=;")),
      "deleting the account should clear the session cookie",
    );

    const afterDelete = await client.json("/api/auth/me");
    assert.equal(afterDelete.body.user, null);

    const loginAgain = await client.json("/api/auth/login", {
      ...postJson({ email: EMAIL, password: NEW_PASSWORD }),
      ip: "198.51.100.20",
    });
    assert.equal(loginAgain.res.status, 401);
  });

  it("answers 503 for password resets when the deployment has no mail provider", async () => {
    const withoutMail = await startApp();
    const bare = makeClient(withoutMail.baseUrl);
    try {
      const { res } = await bare.json("/api/auth/forgot-password", postJson({ email: EMAIL }));
      assert.equal(res.status, 503);
    } finally {
      await withoutMail.stop();
    }
  });
});
