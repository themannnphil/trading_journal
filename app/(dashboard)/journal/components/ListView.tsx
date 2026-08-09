"use client";

import { useState, useMemo } from "react";
import type { Trade, Account, TradeResult, TradeSession, TradeDay, TradeInstrument } from "@/lib/db/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

type SortKey = "date" | "result" | "pnl" | "disciplineScore";
type SortDir = "asc" | "desc";

const INSTRUMENTS: TradeInstrument[] = ["G/U","E/U","S&P","Nasdaq","G/J","U/J","E/C","A/U","XAU/USD"];
const RESULTS: TradeResult[]         = ["Win","Loss","BreakEven"];
const SESSIONS: TradeSession[]       = ["Asia","London","NY-am","NY-pm"];
const DAYS: TradeDay[]               = ["Monday","Tuesday","Wednesday","Thursday","Friday"];

interface Props {
  trades:    Trade[];
  accounts:  Account[];
  onRowClick: (t: Trade) => void;
  onEdit:    (t: Trade) => void;
  onDelete:  (id: string) => void;
  onRefresh: () => void;
}

export function ListView({ trades, accounts, onRowClick, onEdit, onDelete }: Props) {
  const [search,     setSearch]     = useState("");
  const [filterAcct, setFilterAcct] = useState("");
  const [filterInst, setFilterInst] = useState("");
  const [filterRes,  setFilterRes]  = useState("");
  const [filterSess, setFilterSess] = useState("");
  const [filterDay,  setFilterDay]  = useState("");
  const [sortKey,    setSortKey]    = useState<SortKey>("date");
  const [sortDir,    setSortDir]    = useState<SortDir>("desc");
  const [deleteId,   setDeleteId]   = useState<string | null>(null);

  const accountMap = useMemo(() =>
    Object.fromEntries(accounts.map((a) => [a.id, a.name])),
    [accounts]
  );

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (filterAcct && t.accountId  !== filterAcct)  return false;
      if (filterInst && t.instrument !== filterInst)  return false;
      if (filterRes  && t.result     !== filterRes)   return false;
      if (filterSess && t.session    !== filterSess)  return false;
      if (filterDay  && t.day        !== filterDay)   return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.tradeNumber.toLowerCase().includes(q) ||
          t.instrument.toLowerCase().includes(q)  ||
          (t.setupStrategy ?? "").toLowerCase().includes(q) ||
          (t.notesReflection ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [trades, filterAcct, filterInst, filterRes, filterSess, filterDay, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let diff = 0;
      if (sortKey === "date")           diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortKey === "pnl")       diff = a.pnl - b.pnl;
      else if (sortKey === "disciplineScore") diff = a.disciplineScore - b.disciplineScore;
      else if (sortKey === "result")    diff = a.result.localeCompare(b.result);
      return sortDir === "asc" ? diff : -diff;
    });
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="opacity-30">↕</span>;
    return <span className="text-gold">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const resultVariant = (r: TradeResult) => r === "Win" ? "win" : r === "Loss" ? "loss" : "be";

  const selectClass = "bg-[var(--bg-surface2)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-gold/50 cursor-pointer";

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search trades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[var(--bg-surface2)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-1 focus:ring-gold/50 w-44"
          />
          <select value={filterAcct} onChange={(e) => setFilterAcct(e.target.value)} className={selectClass}>
            <option value="">All accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={filterInst} onChange={(e) => setFilterInst(e.target.value)} className={selectClass}>
            <option value="">All instruments</option>
            {INSTRUMENTS.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={filterRes} onChange={(e) => setFilterRes(e.target.value)} className={selectClass}>
            <option value="">All results</option>
            {RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterSess} onChange={(e) => setFilterSess(e.target.value)} className={selectClass}>
            <option value="">All sessions</option>
            {SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} className={selectClass}>
            <option value="">All days</option>
            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {(search || filterAcct || filterInst || filterRes || filterSess || filterDay) && (
            <button
              onClick={() => { setSearch(""); setFilterAcct(""); setFilterInst(""); setFilterRes(""); setFilterSess(""); setFilterDay(""); }}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer underline"
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-[var(--text-muted)]">{sorted.length} trade{sorted.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Mobile cards — shown below sm */}
      <div className="sm:hidden space-y-2">
        {sorted.length === 0 ? (
          <p className="text-center text-[var(--text-muted)] text-sm py-8">No trades found</p>
        ) : sorted.map((trade) => (
          <div
            key={trade.id}
            onClick={() => onRowClick(trade)}
            className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 cursor-pointer active:bg-[var(--bg-surface2)] transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${trade.direction === "Long" ? "text-win" : "text-loss"}`}>
                  {trade.direction === "Long" ? "▲" : "▼"}
                </span>
                <span className="font-mono font-semibold text-[var(--text)]">{trade.instrument}</span>
                <Badge variant={resultVariant(trade.result)}>{trade.result}</Badge>
              </div>
              <span className={`font-mono font-bold ${trade.pnl >= 0 ? "text-win" : "text-loss"}`}>
                {formatCurrency(trade.pnl)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span>{formatDate(trade.date)}</span>
              <span>·</span>
              <span>{trade.session}</span>
              {trade.actualRR && (
                <>
                  <span>·</span>
                  <span className="font-mono">{trade.actualRR}</span>
                </>
              )}
            </div>
            {accountMap[trade.accountId] && (
              <p className="text-xs text-[var(--text-subtle)] mt-1 truncate">{accountMap[trade.accountId]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table — hidden below sm */}
      <div className="hidden sm:block bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-surface2)]">
                {[
                  { label: "Trade #",    key: null },
                  { label: "Date",       key: "date" as SortKey },
                  { label: "Account",    key: null },
                  { label: "Instrument", key: null },
                  { label: "Direction",  key: null },
                  { label: "Session",    key: null },
                  { label: "Result",     key: "result" as SortKey },
                  { label: "P&L",        key: "pnl" as SortKey },
                  { label: "R:R",        key: null },
                  { label: "Score",      key: "disciplineScore" as SortKey },
                  { label: "",           key: null },
                ].map(({ label, key }) => (
                  <th
                    key={label}
                    onClick={() => key && toggleSort(key)}
                    className={`px-3 py-2.5 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap ${key ? "cursor-pointer hover:text-[var(--text)]" : ""}`}
                  >
                    {label} {key && <SortIcon k={key} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-[var(--text-muted)] text-sm">
                    No trades found
                  </td>
                </tr>
              )}
              {sorted.map((trade) => (
                <tr
                  key={trade.id}
                  onClick={() => onRowClick(trade)}
                  className="border-b border-[var(--border)] hover:bg-[var(--bg-surface2)] transition-colors duration-100 cursor-pointer group"
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-[var(--text-muted)]">{trade.tradeNumber}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-[var(--text)]">{formatDate(trade.date)}</td>
                  <td className="px-3 py-2.5 text-[var(--text-muted)] max-w-[120px] truncate">{accountMap[trade.accountId] ?? "—"}</td>
                  <td className="px-3 py-2.5 font-mono text-[var(--text)]">{trade.instrument}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs font-medium ${trade.direction === "Long" ? "text-win" : "text-loss"}`}>
                      {trade.direction === "Long" ? "▲ Long" : "▼ Short"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[var(--text-muted)]">{trade.session}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant={resultVariant(trade.result)}>{trade.result}</Badge>
                  </td>
                  <td className={`px-3 py-2.5 font-mono font-medium ${trade.pnl >= 0 ? "text-win" : "text-loss"}`}>
                    {formatCurrency(trade.pnl)}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[var(--text-muted)]">{trade.actualRR || "—"}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${i < trade.disciplineScore ? "bg-gold" : "bg-[var(--border)]"}`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(trade); }}
                        className="p-1 rounded hover:bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                        title="Edit"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(trade.id); }}
                        className="p-1 rounded hover:bg-[var(--bg)] text-[var(--text-muted)] hover:text-loss cursor-pointer"
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 w-80 space-y-4">
            <h3 className="font-semibold text-[var(--text)]">Delete trade?</h3>
            <p className="text-sm text-[var(--text-muted)]">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer">Cancel</button>
              <button onClick={() => { onDelete(deleteId); setDeleteId(null); }} className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
