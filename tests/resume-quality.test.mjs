import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { makeClient, startApp } from "./helpers/app.mjs";

/** Each request needs its own caller IP: anonymous AI calls are limited per IP. */
let caller = 40;
function postJson(body) {
  caller += 1;
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ip: `198.51.100.${caller}`,
  };
}

const PLACEHOLDER = /\[(?:your name|city,?\s*state|email|phone|linkedin|company|date)/i;
const BANNED = /\b(responsible for|helped with|worked on|participated in|seamless|robust|cutting-edge|results-driven|proven track record|spearheaded|synergy|fostering|streamlining)\b/i;

describe("resume drafts without an AI provider", () => {
  let app;
  let client;

  before(async () => {
    // The helper starts the app with AI_API_KEY empty, which is the fallback path.
    app = await startApp();
    client = makeClient(app.baseUrl);
  });

  after(async () => {
    await app?.stop();
  });

  it("writes a draft with no placeholders and says why it is a draft", async () => {
    const { res, body } = await client.json(
      "/api/write-resume",
      postJson({
        name: "Alex Chen",
        role: "Backend Engineer",
        company: "Stripe",
        style: "executive",
        experience: "Software engineer at Northwind Payments 2021-2024\n- Built payment APIs in Python\n- Reduced latency by 30%",
        projects: "Led migration of the monolith to services",
        education: "BS Computer Science, UC Davis, 2021",
        skills: "Python, Go, PostgreSQL, Kafka",
      }),
    );

    assert.equal(res.status, 200);
    assert.equal(body.engine, "heuristic");
    assert.ok(!PLACEHOLDER.test(body.tailoredResume), "no bracketed placeholders should survive");
    assert.match(body.tailoredResume, /ALEX CHEN/);
    assert.match(body.tailoredResume, /Python, Go, PostgreSQL, Kafka/);
    assert.match(body.tailoredResume, /EXPERIENCE/);
    assert.match(body.notes, /AI_API_KEY/, "the draft should explain that no AI provider is configured");
  });

  it("reuses the existing resume instead of dropping it", async () => {
    const { body } = await client.json(
      "/api/write-resume",
      postJson({
        name: "Alex Chen",
        role: "Staff Engineer",
        experience: "",
        projects: "",
        education: "",
        skills: "",
        currentResume:
          "ALEX CHEN\nSUMMARY\nBackend engineer with 6 years in payments.\nEXPERIENCE\nNorthwind Payments — Senior Engineer (2021 - Present)\n- Rebuilt the settlement pipeline, cutting nightly runtime from 6h to 40m",
      }),
    );

    assert.equal(body.engine, "heuristic");
    assert.match(body.tailoredResume, /Northwind Payments/, "the real employer must survive the draft");
    assert.match(body.tailoredResume, /6h to 40m/, "real numbers must survive the draft");
  });

  it("keeps a tailored draft in the candidate's own words and flags keyword gaps", async () => {
    const { res, body } = await client.json(
      "/api/tailor-resume",
      postJson({
        resumeText:
          "ALEX CHEN\nSUMMARY\nBackend engineer.\nEXPERIENCE\nNorthwind Payments — Senior Engineer (2021 - Present)\n- Rebuilt the settlement pipeline in Python, cutting nightly runtime from 6h to 40m",
        jobDescription:
          "We are hiring a Senior Backend Engineer with Python, PostgreSQL, Kubernetes and Terraform experience to own our payments platform.",
        company: "Stripe",
        role: "Senior Backend Engineer",
        style: "ats",
      }),
    );

    assert.equal(res.status, 200);
    assert.equal(body.engine, "heuristic");
    assert.ok(!PLACEHOLDER.test(body.tailoredResume));
    assert.match(body.tailoredResume, /Northwind Payments/);
    assert.match(body.tailoredResume, /SENIOR BACKEND ENGINEER/i);
    assert.ok(body.addedKeywords.includes("Python"), `expected Python in ${body.addedKeywords}`);
    assert.match(body.notes, /Kubernetes|Terraform/, "gaps in the posting should be reported, not invented");
  });

  it("strips markdown and weak openers from pasted resumes", async () => {
    const { body } = await client.json(
      "/api/improve-resume",
      postJson({
        resumeText:
          "**SUMMARY**\nBackend engineer.\n**EXPERIENCE**\n• Responsible for the payments API, enabling seamless checkout\n• Helped build the Kafka pipeline\n• Worked on a CLI tool used by 40 engineers",
        jobDescription: "Senior backend engineer, payments",
      }),
    );

    const resume = body.improvedResume;
    assert.ok(!/\*\*/.test(resume), "markdown bold should be stripped");
    assert.ok(!/^\s*•/m.test(resume), "bullet glyphs should be normalised to '-'");
    assert.ok(!BANNED.test(resume), `banned phrasing survived:\n${resume}`);
    assert.match(resume, /40 engineers/, "facts must not be lost");
  });

  it("refuses a write request with nothing to work from", async () => {
    const { res } = await client.json("/api/write-resume", postJson({ name: "Nobody" }));
    assert.equal(res.status, 400);
  });
});
