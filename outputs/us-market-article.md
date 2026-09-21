# The Real Reason Great Resumes Get Rejected — and the Tool I Built to Fix It

We're hiring right now.

We want people who actually pay attention to AI tools and LLMs — the kind who tinker with agents, vibe coding, and MCP. People who've built small tools, workflows, or side projects of their own.

That requirement looks clear enough on paper.

But once I started reading resumes, I ran into a very real problem.

Some candidates have solid credentials and dense resumes, yet the exact capabilities I'm looking for simply don't show up. It's not that they can't do the job. They may have used plenty of AI tools and shipped real projects — they just never wrote it down in a way a recruiter can see.

Other resumes are polished, but they're aimed at a different job than the one we posted.

That's the frustrating part.

Candidates apply, don't move forward, and have no idea where it went wrong. On our side, we end up manually comparing each resume against the job description, line by line.

Then it hit me:

**Why does resume–job fit only become visible after a recruiter reads it?**

If candidates could run their resume against the job description *before* applying — and see a match score, missing skills, and risk flags — a lot of those mismatches would surface early.

So I turned it into a tool and put it on the web.

## What I wanted: a pre-submission fit check

I was never trying to build a resume "beautifier."

A beautifully worded resume aimed at the wrong job still gets screened out.

The flow I wanted is simple:

```
Upload a PDF resume
  → Paste the target job description
  → AI compares the two
  → Returns a match score, strengths, risks, and suggestions
```

Candidates shouldn't need to learn prompt engineering. Drop in a resume, paste the JD, and let the tool do the rest.

## I handed the original project to Codex

I'd built a Python resume-analysis project before.

So this time, I had Codex — OpenAI's coding agent — read through the whole thing first. It already had a fairly complete pipeline:

**Read the resume → break down the job requirements → match the two → verify the result is complete.**

My ask: keep that core logic, and wire it into our own site. The final product is Next.js — candidates just open a URL and use it.

Codex mapped out the analysis flow, then connected the pages, API routes, and model calls into the site, one step at a time. That's what turned it from a local script into something anyone could open in a browser.

## Testing it against our real job post

Once the tool was live, I ran it against the role we're actually hiring for.

The job needs: someone who follows AI tools and LLMs, can do technical validation, has touched agents, vibe coding, and MCP, ideally ships their own projects, and can also communicate clearly in writing.

I dropped in a candidate's resume and the JD.

The page gives a total match score first. Below that, three sub-scores:

- Skill match rate
- Experience match rate
- Education match rate

That breakdown is more useful than a single number. A total score tells you roughly whether someone fits; the three sub-scores show you *where* the gap is.

One candidate might check every box on education while their skills and experience never surface. Another has relevant projects and real experience, but the resume is missing the exact keywords the job is searching for. Same low score, completely different reasons.

## Matched vs. not-yet-written

Below the scores, the tool splits the job's keywords into two groups: matched and unmatched.

If the role asks for agents, MCP, workflow building, or technical validation, and the resume has corresponding project evidence, those get recognized.

If the role explicitly requires a capability and the resume has nothing, it goes into unmatched.

But "unmatched" doesn't mean "cram the word into your resume."

If you've actually done it and just didn't write it clearly, add the real project and the result. If you never did it at all, the flag is pointing at a capability gap — not a wording gap.

That distinction matters to us on the hiring side. We want to see what a candidate actually did, not a resume that an AI inflated into "knows everything."

## Beyond the score, three things matter more

After the score and keywords, the tool produces three more outputs: **strengths, risks, and suggestions.**

Strengths show which parts of the resume line up with the role. Risks flag the things that could hurt in screening — experience without evidence, projects loosely related to the job, or key skills that only reach "familiar with." Suggestions go one step further and tell the candidate what to add or fix next.

At the end, the page also compiles a candidate profile, re-summarizing education, work history, projects, and skills.

## A disclaimer: it's a reference, not a verdict

A match score is a pre-submission check, nothing more. Whether someone advances depends on far more dimensions.

For candidates, the point is to know before they apply:

- What the role actually rewards;
- Which abilities they've already proven;
- Which experiences happened but weren't written clearly;
- Where there's a genuine capability gap.

For us on the hiring side, it means better-targeted resumes. If you match, write the evidence clearly; if you don't, don't force the application. Less wasted effort for everyone.

## Why this matters

I started this because I kept running into the same thing while interviewing candidates:

**A lot of resumes simply don't match the job description.**

Until now, that judgment could only be made by the hiring side *after* receiving the resume. Candidates had to wait to be filtered out before they started guessing what was wrong.

But if this judgment repeats over and over — and there's a reasonably clear standard behind it — why not move it earlier?

So I turned my own screening process into a repeatable flow, and then into a web tool. Now candidates don't have to wait to be rejected before they start guessing. Before applying, they can put the resume and the role side by side:

**What the job needs. What you've proven. What's missing.**

Get those three things clear, then decide: apply as-is, revise the resume, or close the gap first.

That's the kind of AI application I'm most interested in these days:

**Not doing more work for people — but turning judgment that only a few people hold into a tool more people can use.**

If this resonated, a clap or share helps more people find it. And if you want future posts in your inbox, subscribe. Thanks for reading — see you in the next one.
