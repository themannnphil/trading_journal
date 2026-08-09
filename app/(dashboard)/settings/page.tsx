"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import type { Account } from "@/lib/db/types";
import { Badge } from "@/components/ui/Badge";
import { AccountFormModal } from "../accounts/components/AccountFormModal";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [accounts,   setAccounts]   = useState<Account[]>([]);
  const [editAcct,   setEditAcct]   = useState<Account | null>(null);
  const [addOpen,    setAddOpen]    = useState(false);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [currency,   setCurrency]   = useState("USD");
  const [clearDone,  setClearDone]  = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("defaultCurrency");
    if (stored) setCurrency(stored);
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    const res = await fetch("/api/accounts");
    if (res.ok) setAccounts(await res.json());
  }

  async function deleteAccount(id: string) {
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchAccounts();
  }

  function setCurrencyPref(c: string) {
    setCurrency(c);
    localStorage.setItem("defaultCurrency", c);
  }

  function clearCache() {
    localStorage.clear();
    setClearDone(true);
    setTimeout(() => window.location.reload(), 800);
  }

  const statusVariant = (s: Account["status"]) => s.toLowerCase() as "active"|"blown"|"passed"|"live";

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border)] bg-[var(--bg-surface2)]">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{title}</h2>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    );
  }

  const inputClass = "w-full bg-[var(--bg-surface2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-gold/40 font-mono";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-semibold text-[var(--text)]">Settings</h1>

      {/* Account management */}
      <Section title="Account Management">
        <div className="space-y-2">
          {accounts.length === 0 && <p className="text-sm text-[var(--text-muted)]">No accounts yet.</p>}
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3 bg-[var(--bg-surface2)] rounded-lg border border-[var(--border)]">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text)] truncate">{a.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{a.firm}</p>
              </div>
              <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
              <button onClick={() => setEditAcct(a)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer px-2 py-1 rounded hover:bg-[var(--bg)]">Edit</button>
              <button onClick={() => setDeleteId(a.id)} className="text-xs text-red-500 hover:text-red-400 cursor-pointer px-2 py-1 rounded hover:bg-[var(--bg)]">Delete</button>
            </div>
          ))}
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gold text-white rounded-lg cursor-pointer hover:bg-gold-500 transition-colors">
          + Add Account
        </button>
      </Section>

      {/* Storage */}
      <Section title="Screenshot Storage">
        <div className="space-y-1">
          <label className="text-xs text-[var(--text-muted)]">Local Mac Folder Path</label>
          <input readOnly value={process.env.NEXT_PUBLIC_SCREENSHOT_PATH ?? "~/trading-screenshots"} className={inputClass} />
          <p className="text-xs text-[var(--text-subtle)]">Set <code className="text-gold">SCREENSHOT_STORAGE_PATH</code> in your <code className="text-gold">.env.local</code> file</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[var(--text-muted)]">Google Drive Folder ID (Vercel)</label>
          <input readOnly value={process.env.NEXT_PUBLIC_DRIVE_FOLDER ?? "—"} className={inputClass} />
          <p className="text-xs text-[var(--text-subtle)]">Set <code className="text-gold">GOOGLE_DRIVE_FOLDER_ID</code> in your <code className="text-gold">.env.local</code> for the deployed version</p>
        </div>
      </Section>

      {/* Preferences */}
      <Section title="Preferences">
        <div className="space-y-2">
          <label className="text-xs text-[var(--text-muted)]">Default Currency</label>
          <div className="flex gap-2">
            {[["GBP","£ GBP"],["USD","$ USD"]].map(([code, label]) => (
              <button key={code} onClick={() => setCurrencyPref(code)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
                  currency === code ? "bg-gold/20 border-gold text-gold" : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
                }`}>{label}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)]">Theme</label>
          <p className="text-sm text-[var(--text-muted)] mt-1">Toggle light/dark mode using the sun/moon icon in the navigation bar.</p>
        </div>
      </Section>

      {/* Session */}
      <Section title="Session">
        {session?.user && (
          <div className="flex items-center gap-3">
            {session.user.image ? (
              <Image src={session.user.image} alt="" width={40} height={40} className="rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-white font-bold">{session.user.name?.[0]}</div>
            )}
            <div>
              <p className="text-sm font-medium text-[var(--text)]">{session.user.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{session.user.email}</p>
            </div>
          </div>
        )}
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer transition-colors">
            Sign out
          </button>
          <button onClick={clearCache}
            className="px-4 py-2 text-sm border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/10 cursor-pointer transition-colors">
            {clearDone ? "Cleared!" : "Clear cache & reload"}
          </button>
        </div>
      </Section>

      {/* Edit account modal */}
      {editAcct && (
        <AccountFormModal
          account={editAcct}
          onSaved={() => { setEditAcct(null); fetchAccounts(); }}
          onClose={() => setEditAcct(null)}
        />
      )}

      {/* Add account modal */}
      {addOpen && (
        <AccountFormModal
          onSaved={() => { setAddOpen(false); fetchAccounts(); }}
          onClose={() => setAddOpen(false)}
        />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 w-80 space-y-4">
            <h3 className="font-semibold text-[var(--text)]">Delete account?</h3>
            <p className="text-sm text-[var(--text-muted)]">All trades linked to this account will also be deleted. This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)] cursor-pointer">Cancel</button>
              <button onClick={() => deleteAccount(deleteId)} className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
