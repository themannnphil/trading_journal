"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Account } from "@/lib/db/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { AccountFormModal } from "./components/AccountFormModal";

function statusVariant(s: Account["status"]): "active"|"blown"|"passed"|"live" {
  return s.toLowerCase() as "active"|"blown"|"passed"|"live";
}

function PnlBar({ current, start, target, drawdown }: { current: number; start: number; target: number; drawdown: number }) {
  const pnl         = current - start;
  const profitPct   = target   > 0 ? Math.max(0, Math.min((pnl / target) * 100, 100)) : 0;
  const drawdownPct = drawdown > 0 ? Math.min((Math.abs(Math.min(pnl, 0)) / drawdown) * 100, 100) : 0;
  const ddColor = drawdownPct > 75 ? "bg-red-500" : drawdownPct > 50 ? "bg-amber-500" : "bg-green-500";

  return (
    <div className="space-y-2">
      <div>
        <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
          <span>Profit target</span>
          <span className="font-mono">{profitPct.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-[var(--bg-surface2)] rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${profitPct}%` }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
          <span>Drawdown used</span>
          <span className="font-mono">{drawdownPct.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-[var(--bg-surface2)] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${ddColor}`} style={{ width: `${drawdownPct}%` }} />
        </div>
      </div>
    </div>
  );
}

export function AccountsClient() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  async function fetchAccounts() {
    const res = await fetch("/api/accounts");
    if (res.ok) setAccounts(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchAccounts(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--text)]">Accounts</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold-500 transition-colors cursor-pointer shadow-glow-gold"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Account
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-[var(--text-muted)] text-sm">Loading...</div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-[var(--text-muted)]">
          <p className="text-sm">No accounts yet</p>
          <button onClick={() => setModalOpen(true)} className="text-gold text-sm cursor-pointer hover:underline">Add your first account →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((a) => {
            const pnl = a.currentBalance - a.startingBalance;
            return (
              <Link key={a.id} href={`/accounts/${a.id}`}>
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4 hover:border-gold/40 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-semibold text-[var(--text)]">{a.name}</h2>
                      <p className="text-xs text-[var(--text-muted)]">{a.firm} · {a.assetClass}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Balance</p>
                      <p className="text-xl font-mono font-bold text-[var(--text)]">{formatCurrency(a.currentBalance, a.currency)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-muted)]">P&amp;L</p>
                      <p className={`font-mono font-semibold ${pnl >= 0 ? "text-win" : "text-loss"}`}>
                        {pnl >= 0 ? "+" : ""}{formatCurrency(pnl, a.currency)}
                      </p>
                    </div>
                  </div>

                  <PnlBar
                    current={a.currentBalance}
                    start={a.startingBalance}
                    target={a.profitTarget}
                    drawdown={a.maxDrawdownLimit}
                  />

                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>{a.phase}</span>
                    <span className="font-mono">{a.currency}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <AccountFormModal
          onSaved={() => { setModalOpen(false); fetchAccounts(); }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
