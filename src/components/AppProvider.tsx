"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import AddJobModal, { type JobDraft } from "./AddJobModal";
import QuickCheckModal from "./QuickCheckModal";
import ReportModal from "./ReportModal";
import AuthModal from "./AuthModal";
import Onboarding from "./Onboarding";
import ResumeVersionsModal from "./ResumeVersionsModal";
import CompanyDetailModal from "./CompanyDetailModal";
import { useDialog } from "./Dialogs";
import type { Company } from "@/lib/companies";
import {
  clearWorkspace,
  EMPTY_WORKSPACE,
  loadWorkspace,
  newId,
  saveWorkspace,
  type FollowUp,
  type JobStatus,
  type ResumeVersion,
  type SavedJob,
  type UserProfile,
  type Workspace,
} from "@/lib/store";
import {
  analyzeText,
  getMe,
  getWorkspace,
  logout as apiLogout,
  parseFile,
  putWorkspace,
  type AuthUser,
} from "@/lib/client";

interface AppValue {
  ws: Workspace;
  user: AuthUser | null;
  jobs: SavedJob[];
  hasResume: boolean;
  masterBusy: boolean;
  masterError: string | null;
  analyzingId: string | null;
  addJob: (draft: JobDraft, status?: JobStatus) => string;
  importJobs: (drafts: JobDraft[], status?: JobStatus) => number;
  analyzeJob: (jobId: string, thenOpen?: boolean) => Promise<void>;
  openJob: (jobId: string) => void;
  setStatus: (jobId: string, status: JobStatus) => void;
  setFollowUp: (jobId: string, followUp: FollowUp | null) => void;
  deleteJob: (jobId: string) => void;
  handleMasterFile: (file: File | null) => Promise<void>;
  removeMaster: () => void;
  saveCurrentResumeVersion: () => void;
  saveResumeAsVersion: (text: string, name: string) => void;
  useResumeVersion: (version: ResumeVersion) => void;
  deleteResumeVersion: (id: string) => void;
  renameResumeVersion: (id: string, name: string) => void;
  duplicateResumeVersion: (id: string) => void;
  toggleFavoriteCompany: (id: string) => void;
  setFavoriteCompanyGroup: (id: string, group: string) => void;
  saveSearch: (search: import("@/lib/store").SavedSearch) => void;
  removeSearch: (id: string) => void;
  saveProfile: (profile: UserProfile) => void;
  reset: () => void;
  signOut: () => Promise<void>;
  openAddJob: (initial?: Partial<JobDraft>, status?: JobStatus) => void;
  openQuickCheck: () => void;
  openAuth: () => void;
  openOnboarding: () => void;
  openVersions: () => void;
  openCompany: (company: Company) => void;
  promptFollowUp: (jobId: string) => void;
}

const AppContext = createContext<AppValue | null>(null);

export function useApp(): AppValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside <AppProvider>");
  return value;
}

export default function AppProvider({ children }: { children: ReactNode }) {
  const { confirm, prompt, notify } = useDialog();
  // Start empty on both server and client so the first render matches, then
  // hydrate from localStorage after mount. Reading localStorage during the
  // initial render makes the client HTML differ from the server HTML.
  const [ws, setWs] = useState<Workspace>(EMPTY_WORKSPACE);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [masterBusy, setMasterBusy] = useState(false);
  const [masterError, setMasterError] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addInitial, setAddInitial] = useState<Partial<JobDraft> | undefined>();
  const [addStatus, setAddStatus] = useState<JobStatus>("saved");
  const [quickOpen, setQuickOpen] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [detailCompany, setDetailCompany] = useState<Company | null>(null);

  const wsRef = useRef(ws);
  wsRef.current = ws;
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    setWs(loadWorkspace());
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Guard so the empty first render does not overwrite stored data.
    if (!hydrated) return;
    saveWorkspace(ws);
  }, [ws, hydrated]);

  useEffect(() => {
    (async () => {
      const me = await getMe().catch(() => null);
      if (!me) return;
      setUser(me);
      const remote = (await getWorkspace().catch(() => null)) as Workspace | null;
      if (remote && (remote.masterResume || remote.jobs?.length)) {
        setWs({ ...remote, profile: remote.profile ?? null, resumeVersions: remote.resumeVersions ?? [], favoriteCompanyIds: remote.favoriteCompanyIds ?? [], favoriteCompanyGroups: remote.favoriteCompanyGroups ?? {}, savedSearches: remote.savedSearches ?? [] });
      } else {
        putWorkspace(loadWorkspace()).catch(() => {});
      }
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      putWorkspace(wsRef.current).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [ws, user]);

  useEffect(() => {
    const dismissed =
      typeof window !== "undefined" && window.localStorage.getItem("fit-onboarding-dismissed");
    if (!dismissed && !ws.profile) setProfileOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analyzeJob = useCallback(async (jobId: string, thenOpen = false) => {
    const current = wsRef.current;
    const resume = current.masterResume;
    const job = current.jobs.find((j) => j.id === jobId);
    if (!resume || !job) return;
    setAnalyzingId(jobId);
    try {
      const result = await analyzeText(resume.text, job.jdText);
      setWs((prev) => ({
        ...prev,
        jobs: prev.jobs.map((j) => (j.id === jobId ? { ...j, result } : j)),
      }));
      if (thenOpen) setReportId(jobId);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setAnalyzingId(null);
    }
  }, [notify]);

  const addJob = useCallback(
    (draft: JobDraft, status: JobStatus = "saved") => {
      const id = newId();
      const now = new Date().toISOString();
      const job: SavedJob = {
        id,
        title: draft.title,
        company: draft.company,
        url: draft.url || undefined,
        location: draft.location || undefined,
        salary: draft.salary || undefined,
        notes: draft.notes || undefined,
        contacts: draft.contacts,
        followUp: draft.followUp,
        interviewDate: draft.interviewDate,
        interviewLocation: draft.interviewLocation,
        interviewNote: draft.interviewNote,
        jdText: draft.jdText,
        status,
        createdAt: now,
        updatedAt: now,
        result: null,
      };
      setWs((prev) => ({ ...prev, jobs: [job, ...prev.jobs] }));
      setAddOpen(false);
      setAddInitial(undefined);
      if (wsRef.current.masterResume) void analyzeJob(id);
      return id;
    },
    [analyzeJob],
  );

  const importJobs = useCallback((drafts: JobDraft[], status: JobStatus = "saved") => {
    const now = new Date().toISOString();
    const added: SavedJob[] = drafts.map((draft) => ({
      id: newId(),
      title: draft.title,
      company: draft.company,
      url: draft.url || undefined,
      location: draft.location || undefined,
      salary: draft.salary || undefined,
      notes: draft.notes || undefined,
      contacts: draft.contacts ?? [],
      followUp: draft.followUp,
      interviewDate: draft.interviewDate,
      interviewLocation: draft.interviewLocation,
      interviewNote: draft.interviewNote,
      jdText: draft.jdText,
      status,
      createdAt: now,
      updatedAt: now,
      result: null,
    }));
    setWs((prev) => ({ ...prev, jobs: [...added, ...prev.jobs] }));
    return added.length;
  }, []);

  const openJob = useCallback(
    (jobId: string) => {
      const job = wsRef.current.jobs.find((j) => j.id === jobId);
      if (!job) return;
      if (job.result) setReportId(jobId);
      else void analyzeJob(jobId, true);
    },
    [analyzeJob],
  );

  const setStatus = useCallback((jobId: string, status: JobStatus) => {
    setWs((prev) => ({
      ...prev,
      jobs: prev.jobs.map((j) => {
        if (j.id !== jobId) return j;
        let followUp = j.followUp;
        if (!followUp?.date) {
          const addDays = (days: number) => {
            const d = new Date();
            d.setDate(d.getDate() + days);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          };
          if (status === "applied") followUp = { date: addDays(3), note: "Nudge recruiter about application status" };
          if (status === "interview") followUp = { date: addDays(1), note: "Send thank-you note" };
          if (status === "offer") followUp = { date: addDays(2), note: "Follow up on offer details" };
        }
        return { ...j, status, followUp, updatedAt: new Date().toISOString() };
      }),
    }));
  }, []);

  const setFollowUp = useCallback((jobId: string, followUp: FollowUp | null) => {
    setWs((prev) => ({
      ...prev,
      jobs: prev.jobs.map((j) =>
        j.id === jobId ? { ...j, followUp: followUp ?? undefined, updatedAt: new Date().toISOString() } : j,
      ),
    }));
  }, []);

  const promptFollowUp = useCallback(
    (jobId: string) => {
      const job = wsRef.current.jobs.find((j) => j.id === jobId);
      if (!job) return;
      void (async () => {
        const date = await prompt({
          title: "Set a follow-up",
          label: "Follow-up date (YYYY-MM-DD)",
          defaultValue: job.followUp?.date ?? "",
          placeholder: "2026-10-01",
          confirmLabel: "Next",
        });
        if (date === null) return;
        const note = await prompt({
          title: "Set a follow-up",
          label: "What needs to be done?",
          defaultValue: job.followUp?.note ?? "",
          placeholder: "Send a thank-you note to the recruiter",
          confirmLabel: "Save",
        });
        if (note === null) return;
        setFollowUp(jobId, date.trim() ? { date: date.trim(), note: note.trim() } : null);
      })();
    },
    [setFollowUp, prompt],
  );

  const deleteJob = useCallback((jobId: string) => {
    void (async () => {
      const ok = await confirm({
        title: "Remove this job?",
        message: "It will be deleted from your workspace.",
        confirmLabel: "Remove",
        danger: true,
      });
      if (!ok) return;
      setWs((prev) => ({ ...prev, jobs: prev.jobs.filter((j) => j.id !== jobId) }));
      setReportId((current) => (current === jobId ? null : current));
    })();
  }, [confirm]);

  const handleMasterFile = useCallback(async (file: File | null) => {
    if (!file) return;
    setMasterBusy(true);
    setMasterError(null);
    try {
      const parsed = await parseFile(file);
      setWs((prev) => ({
        ...prev,
        masterResume: { fileName: file.name, text: parsed.text, updatedAt: new Date().toISOString() },
      }));
    } catch (err) {
      setMasterError(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setMasterBusy(false);
    }
  }, []);

  const removeMaster = useCallback(() => {
    void (async () => {
      const ok = await confirm({
        title: "Remove your master resume?",
        message: "Saved jobs and reports stay in your workspace.",
        confirmLabel: "Remove",
        danger: true,
      });
      if (!ok) return;
      setWs((prev) => ({ ...prev, masterResume: null }));
    })();
  }, [confirm]);

  const saveCurrentResumeVersion = useCallback(() => {
    const master = wsRef.current.masterResume;
    if (!master) return;
    const version: ResumeVersion = {
      id: newId(),
      name: `${master.fileName.replace(/\.[^.]+$/, "") || "Resume"} · ${new Date().toLocaleDateString()}`,
      fileName: master.fileName,
      text: master.text,
      updatedAt: new Date().toISOString(),
    };
    setWs((prev) => ({ ...prev, resumeVersions: [version, ...prev.resumeVersions] }));
  }, []);

  const saveResumeAsVersion = useCallback((text: string, name: string) => {
    setWs((prev) => ({
      ...prev,
      resumeVersions: [
        {
          id: newId(),
          name,
          fileName: `${name}.txt`,
          text,
          updatedAt: new Date().toISOString(),
        },
        ...prev.resumeVersions,
      ],
    }));
  }, []);

  const useResumeVersion = useCallback((version: ResumeVersion) => {
    setWs((prev) => ({
      ...prev,
      masterResume: {
        fileName: version.fileName || `${version.name}.txt`,
        text: version.text,
        updatedAt: new Date().toISOString(),
      },
    }));
    setVersionsOpen(false);
  }, []);

  const toggleFavoriteCompany = useCallback((id: string) => {
    setWs((prev) => ({
      ...prev,
      favoriteCompanyIds: prev.favoriteCompanyIds.includes(id)
        ? prev.favoriteCompanyIds.filter((companyId) => companyId !== id)
        : [...prev.favoriteCompanyIds, id],
      favoriteCompanyGroups: prev.favoriteCompanyIds.includes(id)
        ? prev.favoriteCompanyGroups
        : { ...prev.favoriteCompanyGroups, [id]: prev.favoriteCompanyGroups[id] ?? "target" },
    }));
  }, []);

  const setFavoriteCompanyGroup = useCallback((id: string, group: string) => {
    setWs((prev) => ({
      ...prev,
      favoriteCompanyGroups: { ...prev.favoriteCompanyGroups, [id]: group },
    }));
  }, []);

  const saveSearch = useCallback((search: import("@/lib/store").SavedSearch) => {
    setWs((prev) => ({ ...prev, savedSearches: [search, ...prev.savedSearches.filter((s) => s.id !== search.id)] }));
  }, []);

  const removeSearch = useCallback((id: string) => {
    setWs((prev) => ({ ...prev, savedSearches: prev.savedSearches.filter((s) => s.id !== id) }));
  }, []);

  const deleteResumeVersion = useCallback((id: string) => {
    setWs((prev) => ({ ...prev, resumeVersions: prev.resumeVersions.filter((v) => v.id !== id) }));
  }, []);

  const renameResumeVersion = useCallback((id: string, name: string) => {
    setWs((prev) => ({
      ...prev,
      resumeVersions: prev.resumeVersions.map((v) => (v.id === id ? { ...v, name, updatedAt: new Date().toISOString() } : v)),
    }));
  }, []);

  const duplicateResumeVersion = useCallback((id: string) => {
    setWs((prev) => {
      const source = prev.resumeVersions.find((v) => v.id === id);
      if (!source) return prev;
      const copy: ResumeVersion = {
        ...source,
        id: newId(),
        name: `${source.name} (copy)`,
        updatedAt: new Date().toISOString(),
      };
      return { ...prev, resumeVersions: [copy, ...prev.resumeVersions] };
    });
  }, []);

  const saveProfile = useCallback((profile: UserProfile) => {
    setWs((prev) => ({ ...prev, profile }));
  }, []);

  const reset = useCallback(() => {
    void (async () => {
      const ok = await confirm({
        title: "Clear all workspace data?",
        message: "This clears this browser and, if signed in, your synced copy.",
        confirmLabel: "Clear everything",
        danger: true,
      });
      if (!ok) return;
      clearWorkspace();
      setWs({ masterResume: null, jobs: [], profile: null, resumeVersions: [], favoriteCompanyIds: [], favoriteCompanyGroups: {}, savedSearches: [] });
    })();
  }, [confirm]);

  const signOut = useCallback(async () => {
    await apiLogout().catch(() => {});
    setUser(null);
  }, []);

  const closeOnboarding = useCallback(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("fit-onboarding-dismissed", "1");
    setProfileOpen(false);
  }, []);

  const handleAuthed = useCallback(async (u: AuthUser) => {
    setUser(u);
    setAuthOpen(false);
    try {
      const remote = (await getWorkspace().catch(() => null)) as Workspace | null;
      if (remote && (remote.masterResume || remote.jobs?.length)) {
        setWs({ ...remote, profile: remote.profile ?? null, resumeVersions: remote.resumeVersions ?? [], favoriteCompanyIds: remote.favoriteCompanyIds ?? [], favoriteCompanyGroups: remote.favoriteCompanyGroups ?? {}, savedSearches: remote.savedSearches ?? [] });
      } else {
        await putWorkspace(wsRef.current);
      }
    } catch {
      // ignore sync errors
    }
  }, []);

  const value: AppValue = {
    ws,
    user,
    jobs: ws.jobs,
    hasResume: Boolean(ws.masterResume),
    masterBusy,
    masterError,
    analyzingId,
    addJob,
    importJobs,
    analyzeJob,
    openJob,
    setStatus,
    setFollowUp,
    deleteJob,
    handleMasterFile,
    removeMaster,
    saveCurrentResumeVersion,
    saveResumeAsVersion,
    useResumeVersion,
    deleteResumeVersion,
    renameResumeVersion,
    duplicateResumeVersion,
    toggleFavoriteCompany,
    setFavoriteCompanyGroup,
    saveSearch,
    removeSearch,
    saveProfile,
    reset,
    signOut,
    openAddJob: (initial, status = "saved") => {
      setAddInitial(initial);
      setAddStatus(status);
      setAddOpen(true);
    },
    openQuickCheck: () => setQuickOpen(true),
    openAuth: () => setAuthOpen(true),
    openOnboarding: () => setProfileOpen(true),
    openVersions: () => setVersionsOpen(true),
    openCompany: (company) => setDetailCompany(company),
    promptFollowUp,
  };

  const reportJob = ws.jobs.find((j) => j.id === reportId) ?? null;

  return (
    <AppContext.Provider value={value}>
      {children}

      <AddJobModal
        open={addOpen}
        initial={addInitial}
        onClose={() => setAddOpen(false)}
        onSubmit={(draft) => addJob(draft, addStatus)}
      />
      <QuickCheckModal
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        onSaveMaster={(fileName, text) =>
          setWs((prev) => ({
            ...prev,
            masterResume: { fileName, text, updatedAt: new Date().toISOString() },
          }))
        }
        onSaveAsJob={(jdText) => {
          setQuickOpen(false);
          setAddInitial({ jdText });
          setAddStatus("saved");
          setAddOpen(true);
        }}
      />
      <ReportModal
        job={reportJob}
        resumeText={ws.masterResume?.text ?? ""}
        profile={ws.profile}
        onClose={() => setReportId(null)}
        onReanalyze={(job) => void analyzeJob(job.id)}
      />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuthed={handleAuthed} />
      <Onboarding
        open={profileOpen}
        profile={ws.profile}
        onClose={closeOnboarding}
        onSave={saveProfile}
        onUploadResume={handleMasterFile}
      />
      <ResumeVersionsModal
        open={versionsOpen}
        versions={ws.resumeVersions}
        hasMaster={Boolean(ws.masterResume)}
        onClose={() => setVersionsOpen(false)}
        onSave={saveCurrentResumeVersion}
        onUse={useResumeVersion}
        onDelete={deleteResumeVersion}
      />
      {detailCompany && (
        <CompanyDetailModal open company={detailCompany} onClose={() => setDetailCompany(null)} />
      )}
    </AppContext.Provider>
  );
}
