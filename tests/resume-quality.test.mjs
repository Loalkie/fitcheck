import assert from "node:assert/strict";
import { createServer } from "node:http";
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

  it("flags decorative '-ing' tails when auditing a pasted resume", async () => {
    const { body } = await client.json(
      "/api/resume-audit",
      postJson({
        resumeText:
          "SUMMARY\nBackend engineer.\n\nEXPERIENCE\n- Rebuilt the settlement pipeline, cutting runtime in half and improving reliability\n- Shipped the CLI tool used by 40 engineers",
        jobDescription: "Senior backend engineer",
      }),
    );

    const tails = body.weakBullets.flatMap((bullet) => bullet.issues).filter((issue) => /-ing/.test(issue));
    assert.ok(tails.length >= 1, `expected a decorative tail to be reported, got ${JSON.stringify(body.weakBullets)}`);
  });

  it("refuses a write request with nothing to work from", async () => {
    const { res } = await client.json("/api/write-resume", postJson({ name: "Nobody" }));
    assert.equal(res.status, 400);
  });
});

/** A model that ignores the rules is the case the deterministic pass exists for. */
const TAIL_AND_DUPLICATE_DRAFT = [
  "JORDAN LEE",
  "jordan.lee@example.com | Seattle, WA",
  "",
  "SUMMARY",
  "Backend engineer with 5 years building payment and order systems in Java and AWS.",
  "",
  "EXPERIENCE",
  "Senior Software Engineer, Nordstrom, 2022 - Present",
  "- Migrated batch jobs to AWS, cutting failures across the order management service",
  "- Led migration of the monolith to services, breaking the legacy codebase into scalable components",
  "- Led migration of the monolith to services, decomposing payment flows into deployable units",
  "- Mentored 2 junior engineers and reviewed pull requests to raise code quality",
].join("\n");

describe("resume drafts that come back from the model already broken", () => {
  let app;
  let client;
  let aiServer;
  const calls = [];
  let draftReply;
  let repairReply;

  before(async () => {
    aiServer = createServer((req, res) => {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
        const system = body.messages?.[0]?.content ?? "";
        const repairing = /ruthless resume editor/.test(system);
        calls.push({ repairing, user: body.messages?.[1]?.content ?? "" });
        const content = JSON.stringify(repairing ? repairReply : draftReply);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ choices: [{ message: { content } }] }));
      });
    });
    await new Promise((resolve) => aiServer.listen(0, "127.0.0.1", resolve));
    const aiUrl = `http://127.0.0.1:${aiServer.address().port}/v1`;
    app = await startApp({ env: { AI_API_KEY: "test-key", AI_API_URL: aiUrl } });
    client = makeClient(app.baseUrl);
  });

  after(async () => {
    await app?.stop();
    await new Promise((resolve) => aiServer.close(resolve));
  });

  it("cuts the decorative clause a failed repair left behind, and keeps the notes readable", async () => {
    calls.length = 0;
    draftReply = {
      tailoredResume: TAIL_AND_DUPLICATE_DRAFT,
      changes: ["Reordered the experience bullets."],
      addedKeywords: ["AWS"],
      notes: "Verify the failure numbers before sending.",
    };
    // The repair pass gives back the same draft, so only the deterministic pass can save it.
    repairReply = { resume: TAIL_AND_DUPLICATE_DRAFT, notes: "Tidied the bullets." };

    const { res, body } = await client.json(
      "/api/tailor-resume",
      postJson({
        resumeText: TAIL_AND_DUPLICATE_DRAFT,
        jobDescription: "Senior Backend Engineer working on our payments platform with Kubernetes and Terraform.",
        company: "Stripe",
        role: "Senior Backend Engineer",
        style: "executive",
      }),
    );

    assert.equal(res.status, 200);
    assert.equal(body.engine, "ai");
    const tailedLines = body.tailoredResume
      .split("\n")
      .filter((line) => /^-\s/.test(line) && /,\s+(?:and\s+)?[a-z]+ing\b[^.!?]*[.!?]?$/i.test(line));
    assert.deepEqual(tailedLines, [], `a decorative tail survived:\n${body.tailoredResume}`);
    assert.match(body.tailoredResume, /Migrated batch jobs to AWS/, "the fact must survive the cut");
    assert.match(body.tailoredResume, /Mentored 2 junior engineers/, "untouched bullets must survive");

    assert.ok(calls.some((call) => call.repairing), "the linter should have asked for a repair pass");
    const repairPrompt = calls.find((call) => call.repairing).user;
    assert.match(repairPrompt, /restates another bullet/, "duplicate bullets should reach the repair prompt");
    assert.match(repairPrompt, /trailing -ing clause/, "the decorative tail should reach the repair prompt");

    assert.ok(!/\s-\s/.test(body.notes), `lint detail should not leak its bullet marker: ${body.notes}`);
    assert.ok(!/Worth a manual pass/.test(body.notes), `raw lint detail leaked: ${body.notes}`);
  });

  it("does not repeat the keyword gaps the model already warned about", async () => {
    draftReply = {
      tailoredResume: TAIL_AND_DUPLICATE_DRAFT,
      changes: [],
      addedKeywords: [],
      notes: "The source shows nothing for Kubernetes, Terraform or MongoDB — do not add them.",
    };
    repairReply = { resume: TAIL_AND_DUPLICATE_DRAFT, notes: "" };

    const { body } = await client.json(
      "/api/tailor-resume",
      postJson({
        resumeText: TAIL_AND_DUPLICATE_DRAFT,
        jobDescription: "Senior Backend Engineer with Kubernetes, Terraform and MongoDB experience.",
        role: "Senior Backend Engineer",
        style: "executive",
      }),
    );

    assert.match(body.notes, /do not add them/i);
    assert.ok(!/The posting also asks for/.test(body.notes), `the gap was reported twice: ${body.notes}`);
  });
});
