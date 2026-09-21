"use client";

import { useEffect, useState } from "react";
import FileDropzone from "./FileDropzone";
import { emptyProfile, type UserProfile } from "@/lib/store";
import {
  EDUCATION_LEVELS,
  EXPERIENCE_OPTIONS,
  INDUSTRY_OPTIONS,
  REMOTE_PREFERENCES,
  ROLES,
  SKILL_OPTIONS,
  WORK_AUTH_OPTIONS,
} from "@/lib/roles";

interface Props {
  open: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  onUploadResume?: (file: File | null) => void;
}

function Question({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      {subtitle && <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

function OptionCard({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition ${
        selected
          ? "border-brand-600 bg-brand-50 text-brand-700"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function Chip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        selected
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-slate-300 bg-white text-slate-600 hover:border-brand-500 hover:text-brand-600"
      }`}
    >
      {label}
    </button>
  );
}

const TOTAL_STEPS = 13; // 0..12

export default function Onboarding({ open, profile, onClose, onSave, onUploadResume }: Props) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<UserProfile>(profile ?? emptyProfile());
  const [customSkill, setCustomSkill] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(profile ?? emptyProfile());
      setStep(0);
      setCustomSkill("");
      setResumeFile(null);
    }
  }, [open, profile]);

  if (!open) return null;

  function set<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function toggle(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  function next() {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else {
      onSave(draft);
      onClose();
    }
  }

  function back() {
    if (step === 0) onClose();
    else setStep(step - 1);
  }

  function pickAndNext<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    set(key, value);
    setTimeout(() => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)), 160);
  }

  const gradYears: string[] = [];
  for (let y = new Date().getFullYear(); y >= 1975; y--) gradYears.push(String(y));

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Progress + header */}
      <div className="shrink-0 border-b border-slate-100">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
              F
            </span>
            <span className="text-sm font-bold text-slate-900">Resume ↔ JD Fit Check</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-400 hover:text-slate-700"
          >
            Skip for now
          </button>
        </div>
        <div className="h-1 w-full bg-slate-100">
          <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-4 py-10 sm:px-6">
          {step === 0 && (
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                Personalize your job search
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Let's set you up
              </h1>
              <p className="mx-auto mt-3 max-w-md text-base text-slate-600">
                Answer a few questions so we can match you to the right roles, give you a realistic salary range, and
                score your fit.
              </p>
              <button
                type="button"
                onClick={next}
                className="mt-8 rounded-xl bg-brand-600 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Get started
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <Question
                title="What roles are you looking for?"
                subtitle="Pick all that apply — we'll score your resume against these."
              />
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {ROLES.map((r) => (
                  <Chip
                    key={r.id}
                    label={r.title}
                    selected={draft.targetRoles.includes(r.id)}
                    onToggle={() => set("targetRoles", toggle(draft.targetRoles, r.id))}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <Question title="How many years of experience do you have?" />
              <div className="mx-auto mt-6 flex max-w-md flex-col gap-2">
                {EXPERIENCE_OPTIONS.map((o) => (
                  <OptionCard
                    key={o.label}
                    label={o.label}
                    selected={draft.yearsExperience === o.value}
                    onSelect={() => pickAndNext("yearsExperience", o.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <Question title="What's your highest education?" />
              <div className="mx-auto mt-6 flex max-w-md flex-col gap-2">
                {EDUCATION_LEVELS.map((l) => (
                  <OptionCard
                    key={l}
                    label={l}
                    selected={draft.educationLevel === l}
                    onSelect={() => pickAndNext("educationLevel", l)}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <Question title="Tell us about your school" subtitle="Optional — helps with education matching." />
              <div className="mx-auto mt-6 grid max-w-md grid-cols-1 gap-3">
                <input
                  value={draft.school}
                  onChange={(e) => set("school", e.target.value)}
                  placeholder="School (e.g. University of Washington)"
                  className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                />
                <input
                  value={draft.fieldOfStudy}
                  onChange={(e) => set("fieldOfStudy", e.target.value)}
                  placeholder="Field of study (e.g. Computer Science)"
                  className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                />
                <select
                  value={draft.gradYear}
                  onChange={(e) => set("gradYear", e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                >
                  <option value="">Graduation year</option>
                  {gradYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <Question title="Any internships?" subtitle="One per line. Great way to surface early experience." />
              <textarea
                value={draft.internships.join("\n")}
                onChange={(e) => set("internships", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
                rows={5}
                placeholder={"Software intern, Acme Labs\nData analyst intern, Startup Co"}
                className="mx-auto mt-6 block w-full max-w-md rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              />
            </div>
          )}

          {step === 6 && (
            <div>
              <Question title="What's your work authorization?" subtitle="Used only to filter roles you're eligible for." />
              <div className="mx-auto mt-6 flex max-w-md flex-col gap-2">
                {WORK_AUTH_OPTIONS.map((a) => (
                  <OptionCard
                    key={a}
                    label={a}
                    selected={draft.workAuthorization === a}
                    onSelect={() => pickAndNext("workAuthorization", a)}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div>
              <Question title="Where do you want to work?" />
              <div className="mx-auto mt-6 flex max-w-md flex-col gap-2">
                {REMOTE_PREFERENCES.map((r) => (
                  <OptionCard
                    key={r}
                    label={r}
                    selected={draft.remotePreference === r}
                    onSelect={() => pickAndNext("remotePreference", r)}
                  />
                ))}
                <input
                  value={draft.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="Preferred location (e.g. Remote, San Francisco, New York)"
                  className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                />
              </div>
            </div>
          )}

          {step === 8 && (
            <div>
              <Question title="Which skills do you know?" subtitle="Pick the ones you can back up with real work." />
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SKILL_OPTIONS.map((s) => (
                  <Chip key={s} label={s} selected={draft.skills.includes(s)} onToggle={() => set("skills", toggle(draft.skills, s))} />
                ))}
              </div>
              <div className="mx-auto mt-4 flex max-w-md gap-2">
                <input
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const s = customSkill.trim();
                      if (s && !draft.skills.includes(s)) set("skills", [...draft.skills, s]);
                      setCustomSkill("");
                    }
                  }}
                  placeholder="Add another skill…"
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    const s = customSkill.trim();
                    if (s && !draft.skills.includes(s)) set("skills", [...draft.skills, s]);
                    setCustomSkill("");
                  }}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {step === 9 && (
            <div>
              <Question title="Which industries interest you?" />
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {INDUSTRY_OPTIONS.map((i) => (
                  <Chip key={i} label={i} selected={draft.industries.includes(i)} onToggle={() => set("industries", toggle(draft.industries, i))} />
                ))}
              </div>
            </div>
          )}

          {step === 10 && (
            <div>
              <Question title="What's your expected salary?" subtitle="In USD per year. We'll compare it to real market ranges." />
              <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Minimum</label>
                  <input
                    type="number"
                    min={0}
                    value={draft.desiredSalaryMin ?? ""}
                    onChange={(e) => set("desiredSalaryMin", e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="120000"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Maximum</label>
                  <input
                    type="number"
                    min={0}
                    value={draft.desiredSalaryMax ?? ""}
                    onChange={(e) => set("desiredSalaryMax", e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="150000"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 11 && (
            <div>
              <Question title="Any target companies?" subtitle="Comma-separated. Optional." />
              <input
                value={draft.targetCompanies.join(", ")}
                onChange={(e) =>
                  set("targetCompanies", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                }
                placeholder="OpenAI, Stripe, Figma"
                className="mx-auto mt-6 block w-full max-w-md rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              />
            </div>
          )}

          {step === 12 && (
            <div>
              <Question title="Upload your resume" subtitle="Optional — you can also do this later from your workspace." />
              <div className="mx-auto mt-6 max-w-md">
                <FileDropzone file={resumeFile} onFile={setResumeFile} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-100">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-4 sm:px-6">
          <button type="button" onClick={back} className="text-sm font-medium text-slate-500 hover:text-slate-800">
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {step === 0 ? null : (
            <button
              type="button"
              onClick={() => {
                if (step === TOTAL_STEPS - 1 && resumeFile && onUploadResume) onUploadResume(resumeFile);
                next();
              }}
              className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {step === TOTAL_STEPS - 1 ? "Finish" : "Continue"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
