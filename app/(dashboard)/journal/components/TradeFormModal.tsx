"use client";

import { useState, useEffect, useRef } from "react";
import type { Trade, Account, Screenshot } from "@/lib/db/types";

const INSTRUMENTS = ["G/U","E/U","S&P","Nasdaq","G/J","U/J","E/C","A/U","XAU/USD"] as const;
const SESSIONS    = ["Asia","London","NY-am","NY-pm"] as const;
const DAYS        = ["Monday","Tuesday","Wednesday","Thursday","Friday"] as const;
const DAY_RESULTS = ["Profitable","Loss","No Trade","Break Even"] as const;

function getDayName(date: string): string {
  const d = new Date(date + "T12:00:00");
  return DAYS[Math.min(d.getDay() - 1, 4)] ?? "Monday";
}

interface Props {
  trade?:    Trade | null;
  accounts:  Account[];
  onSaved:   () => void;
  onClose:   () => void;
}

type FormData = {
  accountId: string; date: string; day: string; instrument: string;
  direction: string; session: string; entryPrice: string; stopLoss: string;
  takeProfit: string; lotSize: string; plannedRR: string; actualRR: string;
  result: string; pnl: string; commissionCost: string; duration: string;
  marketCondition: string; setupStrategy: string; executionQuality: string;
  disciplineScore: number; emotions: string; ruleViolation: string;
  improvement: string; notesReflection: string; dayResult: string;
  tradingviewLink: string;
};

type PendingScreenshot =
  | { type: "upload"; file: File; label: string; preview: string }
  | { type: "link";   url: string; label: string };

const blank: FormData = {
  accountId:"", date: new Date().toISOString().split("T")[0],
  day: getDayName(new Date().toISOString().split("T")[0]),
  instrument:"G/U", direction:"Long", session:"NY-am",
  entryPrice:"", stopLoss:"", takeProfit:"", lotSize:"",
  plannedRR:"", actualRR:"", result:"Win", pnl:"", commissionCost:"",
  duration:"", marketCondition:"", setupStrategy:"",
  executionQuality:"", disciplineScore:3, emotions:"",
  ruleViolation:"", improvement:"", notesReflection:"",
  dayResult:"Profitable", tradingviewLink:"",
};

export function TradeFormModal({ trade, accounts, onSaved, onClose }: Props) {
  const [form,       setForm]       = useState<FormData>(blank);
  const [saving,     setSaving]     = useState(false);
  const [tvPreview,  setTvPreview]  = useState(false);
  const [screenshotTab, setScreenshotTab] = useState<"upload" | "link">("upload");
  const [pending,    setPending]    = useState<PendingScreenshot[]>([]);
  const [existing,   setExisting]   = useState<Screenshot[]>([]);
  const [dragOver,   setDragOver]   = useState(false);
  const [linkUrl,    setLinkUrl]    = useState("");
  const [linkLabel,  setLinkLabel]  = useState("");
  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadFile,  setUploadFile]  = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedAccount = accounts.find((a) => a.id === form.accountId);
  const isFutures = selectedAccount?.assetClass === "Futures";

  useEffect(() => {
    if (trade) {
      setForm({
        accountId:        trade.accountId,
        date:             new Date(trade.date).toISOString().split("T")[0],
        day:              trade.day,
        instrument:       trade.instrument,
        direction:        trade.direction,
        session:          trade.session,
        entryPrice:       trade.entryPrice,
        stopLoss:         trade.stopLoss,
        takeProfit:       trade.takeProfit,
        lotSize:          trade.lotSize,
        plannedRR:        trade.plannedRR,
        actualRR:         trade.actualRR,
        result:           trade.result,
        pnl:              String(trade.pnl),
        commissionCost:   trade.commissionCost != null ? String(trade.commissionCost) : "",
        duration:         trade.duration,
        marketCondition:  trade.marketCondition,
        setupStrategy:    trade.setupStrategy,
        executionQuality: trade.executionQuality,
        disciplineScore:  trade.disciplineScore,
        emotions:         trade.emotions,
        ruleViolation:    trade.ruleViolation,
        improvement:      trade.improvement,
        notesReflection:  trade.notesReflection,
        dayResult:        trade.dayResult,
        tradingviewLink:  trade.tradingviewLink ?? "",
      });
      if (trade.tradingviewLink) setTvPreview(true);
      // Load existing screenshots
      fetch(`/api/screenshots?tradeId=${trade.id}`)
        .then((r) => r.json())
        .then((rows) => setExisting(
          rows.map((r: Record<string, unknown>) => ({
            id: r.id, tradeId: r.trade_id, filename: r.filename,
            label: r.label, filepath: r.filepath, url: r.url, uploadDate: new Date(r.upload_date as string),
          }))
        ));
    } else if (accounts[0]) {
      setForm((f) => ({ ...f, accountId: accounts[0].id }));
    }
  }, [trade, accounts]);

  function handleDateChange(date: string) {
    setForm((f) => ({ ...f, date, day: getDayName(date) }));
  }

  function set(field: keyof FormData, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleFileSelect(file: File) {
    setUploadFile(file);
    const prev = URL.createObjectURL(file);
    setUploadPreview(prev);
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

  function removePending(i: number) {
    setPending((prev) => prev.filter((_, j) => j !== i));
  }

  async function deleteExisting(id: string) {
    await fetch(`/api/screenshots?id=${id}`, { method: "DELETE" });
    setExisting((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleSubmit(isDraft: boolean) {
    setSaving(true);
    const payload = {
      ...form,
      pnl:            parseFloat(form.pnl) || 0,
      commissionCost: isFutures && form.commissionCost ? parseFloat(form.commissionCost) : null,
      isDraft,
    };

    let tradeId = trade?.id;

    if (trade) {
      const res = await fetch(`/api/trades/${trade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { setSaving(false); return; }
    } else {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { setSaving(false); return; }
      const newTrade = await res.json();
      tradeId = newTrade.id;
    }

    // Upload pending screenshots
    if (tradeId && pending.length) {
      const uploads = pending.filter((p): p is Extract<PendingScreenshot, { type: "upload" }> => p.type === "upload");
      const links   = pending.filter((p): p is Extract<PendingScreenshot, { type: "link" }>   => p.type === "link");

      if (uploads.length) {
        const fd = new FormData();
        fd.append("tradeId", tradeId);
        uploads.forEach((p) => fd.append("files", p.file));
        fd.append("labels", JSON.stringify(uploads.map((p) => p.label)));
        await fetch("/api/screenshots", { method: "POST", body: fd });
      }

      for (const link of links) {
        await fetch("/api/screenshots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tradeId, url: link.url, label: link.label }),
        });
      }
    }

    setSaving(false);
    onSaved();
  }

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const inputClass  = "w-full bg-[var(--bg-surface2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-gold/40";
  const selectClass = `${inputClass} cursor-pointer`;
  const labelClass  = "block text-xs text-[var(--text-muted)] mb-1";

  function Label({ children }: { children: React.ReactNode }) {
    return <label className={labelClass}>{children}</label>;
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <h2 className="font-semibold text-[var(--text)]">{trade ? "Edit Trade" : "New Trade"}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-surface2)] cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form body */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 space-y-5">
            {/* Row 1: date, day, account */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Date</Label>
                <input type="date" value={form.date} onChange={(e) => handleDateChange(e.target.value)} className={inputClass} />
              </div>
              <div>
                <Label>Day</Label>
                <select value={form.day} onChange={(e) => set("day", e.target.value)} className={selectClass}>
                  {DAYS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <Label>Account</Label>
                <select value={form.accountId} onChange={(e) => set("accountId", e.target.value)} className={selectClass}>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}{a.assetClass === "Futures" ? " (Futures)" : ""}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2: instrument, direction, session */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Instrument</Label>
                <select value={form.instrument} onChange={(e) => set("instrument", e.target.value)} className={selectClass}>
                  {INSTRUMENTS.map((i) => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <Label>Direction</Label>
                <div className="flex gap-2">
                  {["Long","Short"].map((d) => (
                    <button key={d} type="button" onClick={() => set("direction", d)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
                        form.direction === d
                          ? d === "Long" ? "bg-win/20 border-win text-win" : "bg-loss/20 border-loss text-loss"
                          : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
                      }`}
                    >{d === "Long" ? "▲ Long" : "▼ Short"}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Session</Label>
                <select value={form.session} onChange={(e) => set("session", e.target.value)} className={selectClass}>
                  {SESSIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
              <div><Label>Entry Price</Label><input value={form.entryPrice}  onChange={(e) => set("entryPrice",  e.target.value)} className={`${inputClass} font-mono`} placeholder="e.g. 4520.50" /></div>
              <div><Label>Stop Loss</Label>  <input value={form.stopLoss}    onChange={(e) => set("stopLoss",    e.target.value)} className={`${inputClass} font-mono`} placeholder="e.g. 4510.00" /></div>
              <div><Label>Take Profit</Label><input value={form.takeProfit}  onChange={(e) => set("takeProfit",  e.target.value)} className={`${inputClass} font-mono`} placeholder="e.g. 4545.00" /></div>
            </div>

            {/* Trade metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><Label>Lot Size</Label>   <input value={form.lotSize}   onChange={(e) => set("lotSize",   e.target.value)} className={`${inputClass} font-mono`} placeholder="0.3" /></div>
              <div><Label>Planned R:R</Label><input value={form.plannedRR} onChange={(e) => set("plannedRR", e.target.value)} className={`${inputClass} font-mono`} placeholder="1:3" /></div>
              <div><Label>Actual R:R</Label> <input value={form.actualRR}  onChange={(e) => set("actualRR",  e.target.value)} className={`${inputClass} font-mono`} placeholder="1:2.5" /></div>
              <div><Label>Duration</Label>   <input value={form.duration}  onChange={(e) => set("duration",  e.target.value)} className={inputClass}              placeholder="45m" /></div>
            </div>

            {/* Result, PnL, Day Result */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Result</Label>
                <div className="flex gap-1">
                  {(["Win","Loss","BreakEven"] as const).map((r) => (
                    <button key={r} type="button" onClick={() => set("result", r)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                        form.result === r
                          ? r === "Win" ? "bg-win/20 border-win text-win" : r === "Loss" ? "bg-loss/20 border-loss text-loss" : "bg-amber-500/20 border-amber-500 text-amber-500"
                          : "border-[var(--border)] text-[var(--text-muted)]"
                      }`}
                    >{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>P&amp;L (£/$)</Label>
                <input type="number" step="0.01" value={form.pnl} onChange={(e) => set("pnl", e.target.value)} className={`${inputClass} font-mono`} placeholder="e.g. 150.00 or -75.00" />
              </div>
              <div>
                <Label>Day Result</Label>
                <select value={form.dayResult} onChange={(e) => set("dayResult", e.target.value)} className={selectClass}>
                  {DAY_RESULTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Commission cost — Futures accounts only */}
            {isFutures && (
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-medium text-amber-500">Futures — Commission</span>
                </div>
                <div>
                  <Label>Commission Cost (per contract total)</Label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.commissionCost}
                    onChange={(e) => set("commissionCost", e.target.value)}
                    className={`${inputClass} font-mono`}
                    placeholder="e.g. 4.50"
                  />
                </div>
              </div>
            )}

            {/* Discipline score */}
            <div>
              <Label>Discipline Score (1–5)</Label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} type="button" onClick={() => set("disciplineScore", n)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
                      form.disciplineScore >= n ? "bg-gold/20 border-gold text-gold" : "border-[var(--border)] text-[var(--text-muted)]"
                    }`}
                  >{n}</button>
                ))}
              </div>
            </div>

            {/* Text areas */}
            {[
              { field: "marketCondition",  label: "Market Condition" },
              { field: "setupStrategy",    label: "Setup / Strategy" },
              { field: "executionQuality", label: "Execution Quality" },
              { field: "emotions",         label: "Emotions" },
              { field: "ruleViolation",    label: "Rule Violation" },
              { field: "improvement",      label: "Improvement" },
              { field: "notesReflection",  label: "Notes / Reflection" },
            ].map(({ field, label }) => (
              <div key={field}>
                <Label>{label}</Label>
                <textarea
                  rows={3}
                  value={(form as Record<string, unknown>)[field] as string}
                  onChange={(e) => set(field as keyof FormData, e.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder={`Enter ${label.toLowerCase()}…`}
                />
              </div>
            ))}

            {/* TradingView link */}
            <div>
              <Label>TradingView Link</Label>
              <input
                type="url"
                value={form.tradingviewLink}
                onChange={(e) => { set("tradingviewLink", e.target.value); setTvPreview(!!e.target.value); }}
                className={inputClass}
                placeholder="https://www.tradingview.com/chart/..."
              />
              {tvPreview && form.tradingviewLink && (
                <div className="mt-2 rounded-lg overflow-hidden border border-[var(--border)]" style={{ paddingBottom: "56.25%", position: "relative", height: 0 }}>
                  <iframe
                    src={form.tradingviewLink}
                    className="absolute inset-0 w-full h-full"
                    title="TradingView preview"
                    allowFullScreen
                  />
                </div>
              )}
            </div>

            {/* ── Screenshots ── */}
            <div>
              <Label>Screenshots</Label>

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
                  {/* Drop zone */}
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
                        className={inputClass}
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
                    className={inputClass}
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
                    className={inputClass}
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

              {/* Existing saved screenshots */}
              {existing.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-[var(--text-subtle)]">Saved screenshots</p>
                  {existing.map((s) => (
                    <ScreenshotRow
                      key={s.id}
                      label={s.label || s.filename}
                      src={s.url ?? `/api/screenshots/${s.id}`}
                      onRemove={() => deleteExisting(s.id)}
                    />
                  ))}
                </div>
              )}

              {/* Pending screenshots to be uploaded on save */}
              {pending.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-[var(--text-subtle)]">Queued (will upload on save)</p>
                  {pending.map((p, i) => (
                    <ScreenshotRow
                      key={i}
                      label={p.label}
                      src={p.type === "upload" ? p.preview : p.url}
                      onRemove={() => removePending(i)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 flex-wrap px-4 sm:px-6 py-4 border-t border-[var(--border)]">
            <button onClick={() => handleSubmit(true)} disabled={saving}
              className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-surface2)] cursor-pointer transition-colors disabled:opacity-50">
              Save as Draft
            </button>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer transition-colors">
                Cancel
              </button>
              <button onClick={() => handleSubmit(false)} disabled={saving || !form.accountId}
                className="px-4 py-2 text-sm rounded-lg bg-gold text-white font-medium hover:bg-gold-500 cursor-pointer transition-colors disabled:opacity-50 shadow-glow-gold">
                {saving ? "Saving..." : trade ? "Update Trade" : "Submit Trade"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
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
