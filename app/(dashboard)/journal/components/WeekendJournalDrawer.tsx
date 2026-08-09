"use client";

import { useEffect, useRef, useState } from "react";
import type { WeekendJournal, Screenshot } from "@/lib/db/types";
import { isoDate } from "@/lib/utils";

interface Props {
  date: Date;
  type: "weekly_review" | "weekly_outlook";
  existing: WeekendJournal | null;
  onSaved: (j: WeekendJournal) => void;
  onDeleted: () => void;
  onClose: () => void;
}

const REVIEW_FIELDS = [
  { key: "whatWentWell",   label: "What went well this week?",             rows: 3 },
  { key: "whatWentWrong",  label: "What went wrong / mistakes made?",      rows: 3 },
  { key: "keyLessons",     label: "Key lessons learned",                   rows: 3 },
  { key: "bestTrade",      label: "Best trade of the week",                rows: 2 },
  { key: "worstTrade",     label: "Worst trade of the week",               rows: 2 },
  { key: "emotionsWeek",   label: "How were your emotions this week?",     rows: 2 },
  { key: "ruleViolations", label: "Any rule violations?",                  rows: 2 },
  { key: "improvements",   label: "What to improve next week",             rows: 3 },
  { key: "generalNotes",   label: "General notes",                         rows: 3 },
] as const;

const OUTLOOK_FIELDS = [
  { key: "marketBias",       label: "Overall market bias for the week",         rows: 3 },
  { key: "keyEvents",        label: "Key economic events / news to watch",      rows: 3 },
  { key: "instrumentsFocus", label: "Instruments to focus on",                  rows: 2 },
  { key: "keyLevels",        label: "Key price levels (support / resistance)",  rows: 3 },
  { key: "tradingPlan",      label: "Trading plan for the week",                rows: 4 },
  { key: "mentalPrep",       label: "Mental preparation / rules to focus on",   rows: 2 },
  { key: "weekGoals",        label: "Goals for the week",                        rows: 3 },
  { key: "generalNotes",     label: "General notes",                             rows: 2 },
] as const;

type FormState = Record<string, string> & {
  disciplineScore: string;
  weekRating: string;
};

type PendingScreenshot =
  | { type: "upload"; file: File; label: string; preview: string }
  | { type: "link";   url: string; label: string };

function emptyForm(): FormState {
  return {
    whatWentWell: "", whatWentWrong: "", keyLessons: "", bestTrade: "",
    worstTrade: "", emotionsWeek: "", ruleViolations: "", improvements: "",
    generalNotes: "", marketBias: "", keyEvents: "", instrumentsFocus: "",
    keyLevels: "", tradingPlan: "", mentalPrep: "", weekGoals: "",
    disciplineScore: "", weekRating: "",
  };
}

function journalToForm(j: WeekendJournal): FormState {
  return {
    whatWentWell:     j.whatWentWell,
    whatWentWrong:    j.whatWentWrong,
    keyLessons:       j.keyLessons,
    bestTrade:        j.bestTrade,
    worstTrade:       j.worstTrade,
    emotionsWeek:     j.emotionsWeek,
    ruleViolations:   j.ruleViolations,
    improvements:     j.improvements,
    generalNotes:     j.generalNotes,
    marketBias:       j.marketBias,
    keyEvents:        j.keyEvents,
    instrumentsFocus: j.instrumentsFocus,
    keyLevels:        j.keyLevels,
    tradingPlan:      j.tradingPlan,
    mentalPrep:       j.mentalPrep,
    weekGoals:        j.weekGoals,
    disciplineScore:  j.disciplineScore != null ? String(j.disciplineScore) : "",
    weekRating:       j.weekRating != null ? String(j.weekRating) : "",
  };
}

function ScoreSelector({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-subtle)] mb-1.5">{label}</p>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === String(n) ? "" : String(n))}
            className={`w-7 h-7 rounded text-xs font-medium transition-colors cursor-pointer border ${
              value === String(n)
                ? "bg-gold border-gold text-white"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-gold hover:text-gold bg-transparent"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScreenshotRow({ label, src, onRemove }: { label: string; src: string; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--bg-surface2)]">
      <div className="flex items-center gap-2 px-3 py-2">
        <svg className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs text-[var(--text)] flex-1 truncate">{label}</span>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="text-xs text-[var(--text-subtle)] hover:text-[var(--text)] cursor-pointer px-1">
          {expanded ? "▲" : "▼"}
        </button>
        <button type="button" onClick={onRemove} className="text-[var(--text-subtle)] hover:text-loss cursor-pointer ml-1">×</button>
      </div>
      {expanded && (
        <div className="border-t border-[var(--border)] p-2 bg-[var(--bg)]">
          <img src={src} alt={label} className="max-h-60 mx-auto object-contain rounded" />
        </div>
      )}
    </div>
  );
}

export function WeekendJournalDrawer({ date, type, existing, onSaved, onDeleted, onClose }: Props) {
  const [form, setForm] = useState<FormState>(existing ? journalToForm(existing) : emptyForm());
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Screenshot state
  const [screenshotTab, setScreenshotTab] = useState<"upload" | "link">("upload");
  const [pending,       setPending]       = useState<PendingScreenshot[]>([]);
  const [savedShots,    setSavedShots]    = useState<Screenshot[]>([]);
  const [dragOver,      setDragOver]      = useState(false);
  const [linkUrl,       setLinkUrl]       = useState("");
  const [linkLabel,     setLinkLabel]     = useState("");
  const [uploadLabel,   setUploadLabel]   = useState("");
  const [uploadFile,    setUploadFile]    = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Load saved screenshots for existing journal
  useEffect(() => {
    if (!existing) return;
    fetch(`/api/screenshots?journalId=${existing.id}`)
      .then((r) => r.json())
      .then((rows) => setSavedShots(
        rows.map((r: Record<string, unknown>) => ({
          id: r.id, journalId: r.journal_id, filename: r.filename,
          label: r.label, filepath: r.filepath, url: r.url, uploadDate: new Date(r.upload_date as string),
        }))
      ));
  }, [existing]);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleFileSelect(file: File) {
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    if (!uploadLabel) setUploadLabel(file.name.replace(/\.[^/.]+$/, ""));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
    if (file) handleFileSelect(file);
  }

  function addUploadPending() {
    if (!uploadFile) return;
    setPending((prev) => [...prev, { type: "upload", file: uploadFile, label: uploadLabel || uploadFile.name, preview: uploadPreview }]);
    setUploadFile(null);
    setUploadPreview("");
    setUploadLabel("");
  }

  function addLinkPending() {
    if (!linkUrl) return;
    setPending((prev) => [...prev, { type: "link", url: linkUrl, label: linkLabel || linkUrl }]);
    setLinkUrl("");
    setLinkLabel("");
  }

  async function deleteExisting(id: string) {
    await fetch(`/api/screenshots?id=${id}`, { method: "DELETE" });
    setSavedShots((prev) => prev.filter((s) => s.id !== id));
  }

  async function uploadPendingScreenshots(journalId: string) {
    const uploads = pending.filter((p): p is Extract<PendingScreenshot, { type: "upload" }> => p.type === "upload");
    const links   = pending.filter((p): p is Extract<PendingScreenshot, { type: "link" }>   => p.type === "link");

    if (uploads.length) {
      const fd = new FormData();
      fd.append("journalId", journalId);
      uploads.forEach((p) => fd.append("files", p.file));
      fd.append("labels", JSON.stringify(uploads.map((p) => p.label)));
      await fetch("/api/screenshots", { method: "POST", body: fd });
    }

    for (const link of links) {
      await fetch("/api/screenshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journalId, url: link.url, label: link.label }),
      });
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        date: isoDate(date),
        type,
        ...Object.fromEntries(
          Object.entries(form).map(([k, v]) => [k, v === "" ? null : v])
        ),
        disciplineScore: form.disciplineScore ? parseInt(form.disciplineScore) : null,
        weekRating:      form.weekRating      ? parseInt(form.weekRating)      : null,
      };
      const res = await fetch("/api/weekend-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved = await res.json();
        if (pending.length) await uploadPendingScreenshots(saved.id);
        setPending([]);
        onSaved(saved);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existing) return;
    await fetch(`/api/weekend-journal?id=${existing.id}`, { method: "DELETE" });
    onDeleted();
  }

  const isReview  = type === "weekly_review";
  const fields    = isReview ? REVIEW_FIELDS : OUTLOOK_FIELDS;
  const dateLabel = date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const typeLabel = isReview ? "Weekly Review" : "Weekly Outlook";
  const accentColor = isReview ? "#8B5CF6" : "#3B82F6";

  const inputClass = "w-full bg-[var(--bg-surface2)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-gold resize-none transition-colors";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-[var(--bg-surface)] border-l border-[var(--border)] shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: accentColor }}>
              {typeLabel}
            </span>
            <span className="text-sm text-[var(--text-muted)]">{dateLabel}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-surface2)] cursor-pointer transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-5 space-y-5">
          {/* Score selectors (review only) */}
          {isReview && (
            <div className="p-4 bg-[var(--bg-surface2)] rounded-xl border border-[var(--border)] space-y-4">
              <ScoreSelector label="Discipline score this week (1–10)" value={form.disciplineScore} onChange={(v) => set("disciplineScore", v)} />
              <ScoreSelector label="Overall week rating (1–10)"        value={form.weekRating}       onChange={(v) => set("weekRating", v)} />
            </div>
          )}

          {/* Text fields */}
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">{f.label}</label>
              <textarea
                rows={f.rows}
                value={form[f.key as keyof FormState]}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={`Write your ${f.label.toLowerCase()}…`}
                className={inputClass}
              />
            </div>
          ))}

          {/* ── Screenshots ── */}
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Screenshots</p>

            {/* Tab switcher */}
            <div className="flex mb-3 border border-[var(--border)] rounded-lg overflow-hidden">
              {(["upload","link"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setScreenshotTab(tab)}
                  className={`flex-1 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    screenshotTab === tab
                      ? "bg-[var(--bg-surface2)] text-[var(--text)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {tab === "upload" ? "📁 Upload file" : "🔗 Link URL"}
                </button>
              ))}
            </div>

            {screenshotTab === "upload" ? (
              <div className="space-y-2">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                    dragOver ? "border-gold bg-gold/5" : "border-[var(--border)] hover:border-[var(--text-muted)]"
                  }`}
                >
                  {uploadPreview ? (
                    <img src={uploadPreview} alt="preview" className="max-h-40 mx-auto rounded object-contain" />
                  ) : (
                    <>
                      <svg className="w-6 h-6 mx-auto mb-1 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-[var(--text-muted)]">Drag & drop or <span className="text-gold">browse</span></p>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }} />
                </div>
                {uploadFile && (
                  <div className="space-y-2">
                    <input
                      value={uploadLabel}
                      onChange={(e) => setUploadLabel(e.target.value)}
                      className="w-full bg-[var(--bg-surface2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-gold"
                      placeholder="Screenshot name (e.g. Monday Entry)"
                    />
                    <button
                      type="button"
                      onClick={addUploadPending}
                      className="w-full py-2 text-xs rounded-lg bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 cursor-pointer transition-colors"
                    >
                      + Add Screenshot
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full bg-[var(--bg-surface2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-gold"
                  placeholder="https://… (direct image URL)"
                />
                {linkUrl && (
                  <div className="rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-surface2)] max-h-40 flex items-center justify-center">
                    <img src={linkUrl} alt="preview" className="max-h-40 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
                <input
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  className="w-full bg-[var(--bg-surface2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-gold"
                  placeholder="Screenshot name (e.g. Monday Screenshot)"
                />
                <button
                  type="button"
                  onClick={addLinkPending}
                  disabled={!linkUrl}
                  className="w-full py-2 text-xs rounded-lg bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 cursor-pointer transition-colors disabled:opacity-40"
                >
                  + Add Screenshot
                </button>
              </div>
            )}

            {/* Saved screenshots */}
            {savedShots.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-[var(--text-subtle)]">Saved screenshots</p>
                {savedShots.map((s) => (
                  <ScreenshotRow
                    key={s.id}
                    label={s.label || s.filename}
                    src={s.url ?? `/api/screenshots/${s.id}`}
                    onRemove={() => deleteExisting(s.id)}
                  />
                ))}
              </div>
            )}

            {/* Pending */}
            {pending.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-[var(--text-subtle)]">Queued (will upload on save)</p>
                {pending.map((p, i) => (
                  <ScreenshotRow
                    key={i}
                    label={p.label}
                    src={p.type === "upload" ? p.preview : p.url}
                    onRemove={() => setPending((prev) => prev.filter((_, j) => j !== i))}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] px-5 py-3 flex items-center justify-between gap-3">
          <div>
            {existing && !confirmDelete && (
              <button onClick={() => setConfirmDelete(true)} className="text-xs text-red-500 hover:text-red-400 cursor-pointer transition-colors">
                Delete entry
              </button>
            )}
            {confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">Sure?</span>
                <button onClick={handleDelete} className="text-xs text-red-500 hover:text-red-400 cursor-pointer">Yes, delete</button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer">Cancel</button>
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}
