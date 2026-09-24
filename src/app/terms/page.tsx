import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, LegalList, LegalSection } from "@/components/LegalDoc";
import { siteOrigin } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of service · FitCheck",
  description: "The rules for using the FitCheck workspace: accounts, acceptable use, paid plans, and AI output.",
};

const LAST_UPDATED = "25 September 2026";

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL?.trim();

export default function TermsPage() {
  const origin = siteOrigin();
  return (
    <LegalDoc
      title="Terms of service"
      updated={LAST_UPDATED}
      summary={`These terms are the agreement between you and the operator of the FitCheck deployment at ${origin}. By creating an account, subscribing, or uploading a resume, you accept them.`}
    >
      <LegalSection title="1. The service">
        <p>
          FitCheck scores a resume against a job description, tracks applications, and drafts documents that help you
          apply. Every score, keyword list, and draft is an advisory reference produced by software, sometimes with a
          third-party AI model. It is not a hiring decision, legal advice, immigration advice, or a guarantee of an
          interview or an offer.
        </p>
        <p>
          You can use the workspace without an account: in that case everything stays in your browser and the operator
          has no copy of it.
        </p>
      </LegalSection>

      <LegalSection title="2. Accounts">
        <LegalList
          items={[
            "You need to be old enough to enter a binding contract where you live, and at least 13, to hold an account.",
            "Give an email address you control — it is the only way to recover the account.",
            "Keep the password to yourself. Anything done through your session or extension token is treated as done by you, and you can sign every device out by resetting the password.",
            "One person per account. Do not share access to a paid plan as a way of reselling it.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Acceptable use">
        <p>Do not use FitCheck to:</p>
        <LegalList
          items={[
            "Fabricate employers, degrees, dates, or metrics, or send a resume you know to be false.",
            "Attempt to reach another user's account or data, probe the API for weaknesses, or work around the usage limits and rate limits.",
            "Scrape the job sources through this service at a volume that would get the operator blocked, or resell data pulled from them.",
            "Break the law, infringe someone's rights, or upload content you have no right to share — including a resume that is not yours.",
          ]}
        />
        <p>
          Accounts that do any of this can be suspended or removed. Automated use belongs in the browser extension or a
          configured integration, not in scripted traffic against the site.
        </p>
      </LegalSection>

      <LegalSection title="4. Your content">
        <p>
          Your resume, job descriptions, notes, and drafts remain yours. You grant the operator the limited permission
          needed to run the service: storing them, syncing them across your devices, sending the parts required for the
          feature you asked for to the providers listed in the{" "}
          <Link href="/privacy" className="font-semibold text-brand-600 hover:underline">
            privacy policy
          </Link>
          , and producing the documents you requested. That permission ends when the content is deleted.
        </p>
      </LegalSection>

      <LegalSection title="5. AI output">
        <p>
          AI features can be wrong: they may misread a qualification, mirror an error in the source text, or return
          phrasing you would not send. Read every draft before you send it, and never let the tool add experience you
          do not have. You are responsible for what you submit to an employer.
        </p>
      </LegalSection>

      <LegalSection title="6. Plans, billing, and cancellation">
        <LegalList
          items={[
            "Free plan: a monthly allowance of fit checks and AI resumes, shown on the pricing page.",
            "Paid plans unlock unlimited usage and automation for as long as the subscription is active.",
            "Payments are handled by Stripe. The plan renews automatically each month or year until you cancel, and the renewal amount is shown before you check out.",
            "Cancel or change a card at any time through Manage billing on the pricing page. Cancelling stops future renewals; access lasts to the end of the period you already paid for unless the payment itself failed.",
            "If a renewal payment fails, the plan is marked past due and the subscription provider retries. Repeated failures end the paid plan.",
            "Refunds are handled case by case through the contact below, in line with the law where you live.",
            "Deleting an account does not cancel a subscription by itself. Cancel first, then delete.",
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Third-party services">
        <p>
          Live job postings, company news, payments, email delivery, and AI generation come from outside providers.
          Their availability and their terms are their own, and a posting you see here is a copy taken at that moment —
          always confirm details with the employer.
        </p>
      </LegalSection>

      <LegalSection title="8. Availability and changes">
        <p>
          The service is offered as-is, and features can change, pause, or disappear; the operator may end a deployment
          or close registrations at any time. If a paid feature is withdrawn mid-period, tell the operator — a
          pro-rated refund is the intended remedy.
        </p>
      </LegalSection>

      <LegalSection title="9. Disclaimers and liability limits">
        <p>
          To the extent the law allows, the operator is not liable for indirect or consequential losses, for lost
          opportunities or income, or for decisions you make based on a score or a draft. Nothing here limits rights
          you have that cannot be waived, including consumer rights where you live.
        </p>
      </LegalSection>

      <LegalSection title="10. Governing law and contact">
        <p>
          These terms are governed by the laws that apply where the operator of this deployment is established, without
          regard to conflict-of-law rules. Questions, refund requests, or notices of a problem go to:{" "}
          {SUPPORT_EMAIL ? (
            <a className="font-semibold text-brand-600 hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
          ) : (
            <>the operator of this deployment — no contact address has been published for it yet.</>
          )}
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
