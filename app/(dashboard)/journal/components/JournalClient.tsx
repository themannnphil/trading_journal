"use client";

import { useEffect, useState } from "react";
import type { Trade, Account } from "@/lib/db/types";
import { ListView } from "./ListView";
import { CalendarView } from "./CalendarView";
import { TradeFormModal } from "./TradeFormModal";
import { TradeDrawer } from "./TradeDrawer";

type ViewMode = "list" | "calendar";

export function JournalClient() {
  const [view, setView]                   = useState<ViewMode>("list");
  const [trades, setTrades]               = useState<Trade[]>([]);
  const [accounts, setAccounts]           = useState<Account[]>([]);
  const [loading, setLoading]             = useState(true);
  const [formOpen, setFormOpen]           = useState(false);
  const [editTrade, setEditTrade]         = useState<Trade | null>(null);
  const [drawerTrade, setDrawerTrade]     = useState<Trade | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("journalView") as ViewMode | null;
    if (stored) setView(stored);
  }, []);

  function switchView(v: ViewMode) {
    setView(v);
    localStorage.setItem("journalView", v);
  }

  async function fetchTrades() {
    const res = await fetch("/api/trades");
    if (res.ok) setTrades(await res.json());
  }

  async function fetchAccounts() {
    const res = await fetch("/api/accounts");
    if (res.ok) setAccounts(await res.json());
  }

  useEffect(() => {
    Promise.all([fetchTrades(), fetchAccounts()]).finally(() => setLoading(false));
  }, []);

  function handleSaved() {
    setFormOpen(false);
    setEditTrade(null);
    fetchTrades();
  }

  function handleEdit(trade: Trade) {
    setDrawerTrade(null);
    setEditTrade(trade);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/trades/${id}`, { method: "DELETE" });
    setDrawerTrade(null);
    fetchTrades();
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold text-[var(--text)]">TradeLog</h1>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-[var(--bg-surface2)] rounded-lg p-0.5 border border-[var(--border)]">
            {(["list", "calendar"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => switchView(v)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer capitalize ${
                  view === v
                    ? "bg-[var(--bg-surface)] text-[var(--text)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {v === "list" ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    List
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Calendar
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            onClick={() => { window.location.href = "/api/trades/export"; }}
            className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-150 cursor-pointer"
            title="Export CSV"
          >
            <span className="hidden sm:inline">↓ Export CSV</span>
            <span className="sm:hidden">↓</span>
          </button>

          {/* New Trade */}
          <button
            onClick={() => { setEditTrade(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold-500 transition-colors duration-150 cursor-pointer shadow-glow-gold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Trade
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-3 flex items-center gap-4 animate-pulse">
              <div className="h-4 bg-[var(--bg-surface2)] rounded w-20" />
              <div className="h-4 bg-[var(--bg-surface2)] rounded w-16" />
              <div className="h-4 bg-[var(--bg-surface2)] rounded flex-1" />
              <div className="h-5 bg-[var(--bg-surface2)] rounded w-12" />
            </div>
          ))}
        </div>
      ) : view === "list" && trades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-2xl">📈</div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">No trades yet</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">Log your first trade to start building your journal.</p>
          </div>
        </div>
      ) : view === "list" ? (
        <ListView
          trades={trades}
          accounts={accounts}
          onRowClick={setDrawerTrade}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={fetchTrades}
        />
      ) : (
        <CalendarView
          trades={trades}
          onDayTradeClick={setDrawerTrade}
        />
      )}

      {formOpen && (
        <TradeFormModal
          trade={editTrade}
          accounts={accounts}
          onSaved={handleSaved}
          onClose={() => { setFormOpen(false); setEditTrade(null); }}
        />
      )}

      {drawerTrade && (
        <TradeDrawer
          trade={drawerTrade}
          accounts={accounts}
          onEdit={() => handleEdit(drawerTrade)}
          onDelete={() => handleDelete(drawerTrade.id)}
          onClose={() => setDrawerTrade(null)}
        />
      )}
    </div>
  );
}
