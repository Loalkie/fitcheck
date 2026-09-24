import type { Metadata } from "next";
import { LegalDoc, LegalList, LegalSection } from "@/components/LegalDoc";
import { siteOrigin } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy · FitCheck",
  description:
    "What FitCheck collects, where it is stored, which providers see your resume text, and how to delete everything.",
};

const LAST_UPDATED = "25 September 2026";

/**
 * `SUPPORT_EMAIL` is set per deployment; without it the page points at the
 * operator instead of inventing an address nobody reads.
 */
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL?.trim();

export default function PrivacyPage() {
  const origin = siteOrigin();
  return (
    <LegalDoc
      title="Privacy policy"
      updated={LAST_UPDATED}
      summary={`This page explains what the FitCheck deployment at ${origin} collects, why, and how to remove it. If anything here is unclear, ask before uploading a resume you consider sensitive.`}
    >
      <LegalSection title="1. Who this covers">
        <p>
          FitCheck is a job-search workspace: it scores a resume against a job description, tracks applications, and
          drafts tailored documents. This deployment is operated by the person or team that publishes it at{" "}
          {origin}. That operator is the data controller for the account data described below.
        </p>
        <p>
          {SUPPORT_EMAIL ? (
            <>
              Questions, requests, and deletion help:{" "}
              <a className="font-semibold text-brand-600 hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
              .
            </>
          ) : (
            <>Privacy questions go to whoever operates this deployment — this deployment has not published a contact address.</>
          )}
        </p>
      </LegalSection>

      <LegalSection title="2. What is collected">
        <LegalList
          items={[
            "Account data: your email address, a salted scrypt hash of your password (never the password itself), and whether the address has been verified.",
            "Workspace content you enter: resume text or uploaded resume files, job descriptions you paste or import, application records, notes, reminders, outreach drafts, and career-profile answers.",
            "Usage counters: how many fit checks and AI resumes you have run in the current month, plus a short-lived rate-limit log keyed by IP address or account.",
            "Sign-in state: session rows tied to your account, and extension tokens if you connect the browser extension.",
            "Billing data: if you subscribe, Stripe collects your card and billing details directly. FitCheck stores only the Stripe customer and subscription identifiers, the plan, and the subscription status. Card numbers never reach this server.",
            "Technical data: standard server logs from the hosting provider (IP address, user agent, timestamps) and error logs for failures.",
          ]}
        />
        <p>
          There is no third-party analytics, advertising pixel, or session-recording script on these pages. Payment
          pages are served by Stripe and are covered by Stripe&apos;s own privacy policy.
        </p>
      </LegalSection>

      <LegalSection title="3. Where it is stored">
        <LegalList
          items={[
            "Not signed in: your workspace lives in this browser's local storage. It never leaves your device, and clearing site data removes it.",
            "Signed in: the workspace is copied to this deployment's database so it can sync across devices.",
            "The session cookie `fit_session` is the only cookie the app sets. It is httpOnly, SameSite=Lax, Secure in production, and expires after 30 days. There are no advertising or cross-site tracking cookies.",
            "Uploaded resume files are read in memory to extract text and are not kept as files after the request finishes.",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. When your data leaves this deployment">
        <p>
          FitCheck is not self-contained: several features call outside services. What goes out, and when, is:
        </p>
        <LegalList
          items={[
            "AI features (fit check, tailored resume, cover letter, recruiter email, interview prep, resume audit): the resume text and the job description are sent to the AI provider configured for this deployment — DeepSeek by default, or another OpenAI-compatible endpoint the operator configures. Do not paste information you would not send to that provider.",
            "Job sources (Greenhouse, Lever, Adzuna, USAJobs, Remotive, The Muse) and news lookups (Hacker News, Google News): your search terms, company names, and the job URLs you open are sent to fetch live postings and news.",
            "Payments: Stripe, for checkout, invoices, and the billing portal.",
            "Transactional email: the operator's email provider (Resend by default) receives your address to deliver verification and password-reset links.",
            "Browser extension: the extension sends the posting you choose to import, plus your extension token, to this deployment — nowhere else.",
          ]}
        />
        <p>
          Your data is not sold, and it is not shared with advertisers, recruiters, or employers. The operator does not
          use your resume to train AI models, and only the operator can read site-wide integration keys.
        </p>
      </LegalSection>

      <LegalSection title="5. How long it is kept">
        <LegalList
          items={[
            "Workspace and account data: until you delete your account, or the operator removes it.",
            "Sessions: 30 days, or until you sign out; password resets invalidate every session immediately.",
            "Password-reset links: one hour. Verification links: seven days. Each link works once and is stored only as a hash.",
            "Rate-limit records: a few hours at most, then they are overwritten by the next window.",
            "Billing records: kept as long as tax and accounting rules require, including after account deletion.",
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Deleting your data">
        <p>
          Settings → Account → Delete account asks for your password and then removes the account, synced workspace,
          sessions, extension tokens, and pending links. What stays behind is billing history at Stripe, records the
          operator is legally required to keep, and anything saved in a browser you did not clear.
        </p>
        <p>
          To clear browser-stored data without deleting an account, clear this site&apos;s storage in your browser
          settings.
        </p>
      </LegalSection>

      <LegalSection title="7. Your rights">
        <p>
          Depending on where you live — California and several other US states have such laws — you may ask to know
          what personal information is held, to receive a copy, to correct it, and to delete it, and you may use an
          authorized agent to make a request. Requests go to the contact in section 1. You will not be treated
          differently for making one.
        </p>
        <p>
          Personal information is not sold or shared for cross-context behavioral advertising, and FitCheck does not
          build advertising profiles. FitCheck is not a consumer reporting agency: it does not run background checks
          and must not be used for employment eligibility decisions under the Fair Credit Reporting Act.
        </p>
      </LegalSection>

      <LegalSection title="8. Security">
        <p>
          Passwords are stored as salted scrypt hashes; session and extension tokens are stored as SHA-256 digests, so
          a database leak does not hand over live logins; links in email are single-use and hashed; cookies are
          httpOnly. No system is perfect — if you believe your account was accessed, reset the password, which signs
          every device out.
        </p>
      </LegalSection>

      <LegalSection title="9. Children">
        <p>
          FitCheck is not directed at children under 13, and accounts for children under 13 are not knowingly created.
          If you believe a child has an account here, contact the operator so it can be removed.
        </p>
      </LegalSection>

      <LegalSection title="10. Processing location and changes">
        <p>
          Data is processed where the operator and the providers listed above run their infrastructure, which may be
          outside your state or country. This policy may be updated as the product changes; the date at the top always
          reflects the current version, and material changes are worth re-reading.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
