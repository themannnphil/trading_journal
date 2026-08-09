"use client";

import { useState, useEffect } from "react";
import type { Account } from "@/lib/db/types";

interface Props {
  account?: Account;
  onSaved:  () => void;
  onClose:  () => void;
}

type FormData = {
  name: string; firm: string; assetClass: string; startingBalance: string;
  currency: string; status: string; profitTarget: string; maxDrawdownLimit: string; dailyDrawdownLimit: string; phase: string;
};

const blank: FormData = {
  name: "", firm: "", assetClass: "Futures", startingBalance: "",
  currency: "USD", status: "Active", profitTarget: "", maxDrawdownLimit: "", dailyDrawdownLimit: "",
  phase: "Evaluation Phase 1",
};

export function AccountFormModal({ account, onSaved, onClose }: Props) {
  const [form,   setForm]   = useState<FormData>(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (account) {
      setForm({
        name: account.name, firm: account.firm, assetClass: account.assetClass,
        startingBalance: String(account.startingBalance), currency: account.currency,
        status: account.status, profitTarget: String(account.profitTarget),
        maxDrawdownLimit: String(account.maxDrawdownLimit), dailyDrawdownLimit: String(account.dailyDrawdownLimit), phase: account.phase,
      });
    }
  }, [account]);

  useEffect(() => {
    function h(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function set(k: keyof FormData, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit() {
    setSaving(true);
    const payload = {
      ...form,
      startingBalance:     parseFloat(form.startingBalance)     || 0,
      profitTarget:        parseFloat(form.profitTarget)        || 0,
      maxDrawdownLimit:    parseFloat(form.maxDrawdownLimit)    || 0,
      dailyDrawdownLimit:  parseFloat(form.dailyDrawdownLimit)  || 0,
    };
    const res = account
      ? await fetch(`/api/accounts/${account.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch("/api/accounts",               { method: "POST",  headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) onSaved();
  }

  const inputClass = "w-full bg-[var(--bg-surface2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-gold/40";
  const labelClass = "block text-xs text-[var(--text-muted)] mb-1";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <h2 className="font-semibold text-[var(--text)]">{account ? "Edit Account" : "Add Account"}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-surface2)] cursor-pointer">✕</button>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className={labelClass}>Account Name</label><input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} placeholder="e.g. Apex Eval 1" /></div>
              <div><label className={labelClass}>Firm</label><input value={form.firm} onChange={(e) => set("firm", e.target.value)} className={inputClass} placeholder="e.g. Apex, Quantekel" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Asset Class</label>
                <select value={form.assetClass} onChange={(e) => set("assetClass", e.target.value)} className={`${inputClass} cursor-pointer`}>
                  <option>Forex</option><option>Indices</option><option>Futures</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Phase</label>
                <select value={form.phase} onChange={(e) => set("phase", e.target.value)} className={`${inputClass} cursor-pointer`}>
                  <option>Evaluation Phase 1</option><option>Evaluation Phase 2</option><option>Live</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Starting Balance</label><input type="number" value={form.startingBalance} onChange={(e) => set("startingBalance", e.target.value)} className={`${inputClass} font-mono`} placeholder="50000" /></div>
              <div>
                <label className={labelClass}>Currency</label>
                <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className={`${inputClass} cursor-pointer`}>
                  <option value="USD">$ USD</option><option value="GBP">£ GBP</option><option value="EUR">€ EUR</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className={labelClass}>Profit Target</label><input type="number" value={form.profitTarget} onChange={(e) => set("profitTarget", e.target.value)} className={`${inputClass} font-mono`} placeholder="3000" /></div>
              <div><label className={labelClass}>Max Drawdown</label><input type="number" value={form.maxDrawdownLimit} onChange={(e) => set("maxDrawdownLimit", e.target.value)} className={`${inputClass} font-mono`} placeholder="2000" /></div>
              <div><label className={labelClass}>Daily Drawdown</label><input type="number" value={form.dailyDrawdownLimit} onChange={(e) => set("dailyDrawdownLimit", e.target.value)} className={`${inputClass} font-mono`} placeholder="500" /></div>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <div className="flex gap-2 flex-wrap">
                {(["Active","Blown","Passed","Live"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => set("status", s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                      form.status === s ? "bg-gold/20 border-gold text-gold" : "border-[var(--border)] text-[var(--text-muted)]"
                    }`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end px-6 py-4 border-t border-[var(--border)]">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)] cursor-pointer">Cancel</button>
            <button onClick={submit} disabled={saving || !form.name}
              className="px-4 py-2 text-sm rounded-lg bg-gold text-white font-medium hover:bg-gold-500 cursor-pointer disabled:opacity-50 shadow-glow-gold">
              {saving ? "Saving..." : account ? "Update" : "Create Account"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
