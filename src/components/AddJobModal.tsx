"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import type { Contact, FollowUp } from "@/lib/store";

export interface JobDraft {
  title: string;
  company: string;
  url: string;
  location: string;
  salary: string;
  notes: string;
  contacts: Contact[];
  followUp?: FollowUp;
  interviewDate?: string;
  interviewLocation?: string;
  interviewNote?: string;
  jdText: string;
}

interface Props {
  open: boolean;
  initial?: Partial<JobDraft>;
  onClose: () => void;
  onSubmit: (draft: JobDraft) => void;
}

const inputCls = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

export default function AddJobModal({ open, initial, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [notes, setNotes] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([{ name: "" }]);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [interviewNote, setInterviewNote] = useState("");
  const [jdText, setJdText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setCompany(initial?.company ?? "");
      setUrl(initial?.url ?? "");
      setLocation(initial?.location ?? "");
      setSalary(initial?.salary ?? "");
      setNotes(initial?.notes ?? "");
      setContacts(initial?.contacts?.length ? initial.contacts : [{ name: "" }]);
      setFollowUpDate(initial?.followUp?.date ?? "");
      setFollowUpNote(initial?.followUp?.note ?? "");
      setInterviewDate(initial?.interviewDate ?? "");
      setInterviewLocation(initial?.interviewLocation ?? "");
      setInterviewNote(initial?.interviewNote ?? "");
      setJdText(initial?.jdText ?? "");
      setError(null);
    }
  }, [open, initial]);

  function submit() {
    if (jdText.trim().length < 40) {
      setError("Please paste the full job description (at least a few sentences).");
      return;
    }
    const cleanContacts = contacts
      .map((c) => ({ name: c.name.trim(), title: c.title?.trim(), email: c.email?.trim() }))
      .filter((c) => c.name || c.email);
    onSubmit({
      title: title.trim(),
      company: company.trim(),
      url: url.trim(),
      location: location.trim(),
      salary: salary.trim(),
      notes: notes.trim(),
      contacts: cleanContacts,
      followUp:
        followUpDate.trim()
          ? { date: followUpDate.trim(), note: followUpNote.trim() }
          : undefined,
      interviewDate: interviewDate.trim(),
      interviewLocation: interviewLocation.trim(),
      interviewNote: interviewNote.trim(),
      jdText: jdText.trim(),
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a job">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-600">Role title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior AI Engineer" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Company</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Labs" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-600">Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Remote, SF" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Salary</label>
            <input value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="e.g. $120k–$150k" className={inputCls} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Job posting URL (optional)</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className={inputCls} />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Job description</label>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            rows={6}
            placeholder="Paste the full posting — requirements, qualifications, responsibilities."
            className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Contacts (recruiter / referral)</label>
          <div className="space-y-2">
            {contacts.map((c, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                <input
                  value={c.name}
                  onChange={(e) => setContacts((arr) => arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  placeholder="Name"
                  className={inputCls}
                />
                <input
                  value={c.title ?? ""}
                  onChange={(e) => setContacts((arr) => arr.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                  placeholder="Title"
                  className={inputCls}
                />
                <input
                  value={c.email ?? ""}
                  onChange={(e) => setContacts((arr) => arr.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))}
                  placeholder="Email"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setContacts((arr) => arr.filter((_, j) => j !== i))}
                  className="self-center text-slate-400 hover:text-rose-600"
                  aria-label="Remove contact"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setContacts((arr) => [...arr, { name: "" }])}
            className="mt-2 text-xs font-semibold text-brand-600 hover:underline"
          >
            + Add contact
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Referral, next steps, notes…"
            className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">🔔 Follow-up reminder</span>
            <span className="text-[11px] text-slate-400">optional</span>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-600">Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">What to do</label>
              <input
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                placeholder="e.g. Email recruiter, check portal"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">📅 Interview</span>
            <span className="text-[11px] text-slate-400">optional</span>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input type="datetime-local" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className={inputCls} />
            <input value={interviewLocation} onChange={(e) => setInterviewLocation(e.target.value)} placeholder="Location / video link" className={inputCls} />
          </div>
          <input value={interviewNote} onChange={(e) => setInterviewNote(e.target.value)} placeholder="Interview notes" className={`${inputCls} mt-2`} />
        </div>

        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}

        <button
          type="button"
          onClick={submit}
          className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Save & score it
        </button>
      </div>
    </Modal>
  );
}
