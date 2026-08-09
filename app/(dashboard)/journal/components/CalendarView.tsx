"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Trade, WeekendJournal } from "@/lib/db/types";
import { formatCurrency, isoDate } from "@/lib/utils";
import { WeekendJournalDrawer } from "./WeekendJournalDrawer";

interface Props {
  trades: Trade[];
  onDayTradeClick: (t: Trade) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function CalendarView({ trades, onDayTradeClick }: Props) {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [weekendDrawer, setWeekendDrawer] = useState<{ date: Date; type: "weekly_review" | "weekly_outlook" } | null>(null);
  const [weekendJournals, setWeekendJournals] = useState<WeekendJournal[]>([]);

  const fetchJournals = useCallback(async (y: number, m: number) => {
    const res = await fetch(`/api/weekend-journal?year=${y}&month=${m + 1}`);
    if (res.ok) setWeekendJournals(await res.json());
  }, []);

  useEffect(() => { fetchJournals(year, month); }, [year, month, fetchJournals]);

  const tradesByDay = useMemo(() => {
    const map: Record<string, Trade[]> = {};
    for (const t of trades) {
      const key = isoDate(new Date(t.date));
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return map;
  }, [trades]);

  const journalsByDay = useMemo(() => {
    const map: Record<string, WeekendJournal> = {};
    for (const j of weekendJournals) {
      map[isoDate(new Date(j.date))] = j;
    }
    return map;
  }, [weekendJournals]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const firstDay    = new Date(year, month, 1);
  const lastDay     = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function tileClass(netPnl: number | null, tradeCount: number): string {
    if (tradeCount === 0 || netPnl === null) return "bg-[var(--bg-surface2)]";
    if (netPnl > 0)  return "bg-day-win  dark:bg-green-900/20";
    if (netPnl < 0)  return "bg-day-loss dark:bg-red-900/20";
    return "bg-day-be dark:bg-amber-900/20";
  }

  function pnlColor(pnl: number) { return pnl >= 0 ? "text-win" : "text-loss"; }

  function handleWeekendClick(date: Date) {
    const type = date.getDay() === 6 ? "weekly_review" : "weekly_outlook";
    setWeekendDrawer({ date, type });
  }

  function handleJournalSaved(j: WeekendJournal) {
    setWeekendJournals((prev) => {
      const idx = prev.findIndex((x) => x.id === j.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = j; return next; }
      return [...prev, j];
    });
    setWeekendDrawer(null);
  }

  function handleJournalDeleted() {
    const key = weekendDrawer ? isoDate(weekendDrawer.date) : null;
    if (key) setWeekendJournals((prev) => prev.filter((j) => isoDate(new Date(j.date)) !== key));
    setWeekendDrawer(null);
  }

  const drawerJournal = weekendDrawer ? (journalsByDay[isoDate(weekendDrawer.date)] ?? null) : null;

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-[var(--bg-surface2)] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-[var(--text)]">{MONTH_NAMES[month]} {year}</h2>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-[var(--bg-surface2)] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
          Sat — Weekly Review
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
          Sun — Weekly Outlook
        </span>
      </div>

      {/* Calendar grid */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[var(--border)]">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={`py-2 text-center text-xs font-medium uppercase tracking-wide ${
                i === 5 ? "text-[#8B5CF6]" : i === 6 ? "text-[#3B82F6]" : "text-[var(--text-muted)]"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="grid grid-cols-7">
          {cells.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="h-24 border-b border-r border-[var(--border)] bg-[var(--bg)]" />;
            }

            const key       = isoDate(date);
            const dayOfWeek = date.getDay();
            const isSat     = dayOfWeek === 6;
            const isSun     = dayOfWeek === 0;
            const isWeekend = isSat || isSun;
            const isToday   = key === isoDate(new Date());

            if (isWeekend) {
              const hasJournal   = !!journalsByDay[key];
              const accentColor  = isSat ? "#8B5CF6" : "#3B82F6";
              const bgClass      = isSat ? "bg-purple-950/20" : "bg-blue-950/20";
              const label        = isSat ? "Review" : "Outlook";

              return (
                <div
                  key={key}
                  onClick={() => handleWeekendClick(date)}
                  className={`min-h-24 border-b border-r border-[var(--border)] p-2 cursor-pointer transition-all duration-150 hover:brightness-125 ${bgClass} group`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`text-sm font-medium ${isToday ? "w-6 h-6 rounded-full bg-gold text-white flex items-center justify-center text-xs" : ""}`}
                      style={!isToday ? { color: accentColor } : {}}
                    >
                      {date.getDate()}
                    </span>
                    {hasJournal && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white leading-none"
                        style={{ backgroundColor: accentColor }}
                      >
                        {label}
                      </span>
                    )}
                  </div>
                  {!hasJournal && (
                    <p
                      className="mt-2 text-[10px] opacity-0 group-hover:opacity-50 transition-opacity"
                      style={{ color: accentColor }}
                    >
                      + Add {label}
                    </p>
                  )}
                  {hasJournal && (
                    <p className="mt-1 text-[10px] text-[var(--text-subtle)]">tap to edit</p>
                  )}
                </div>
              );
            }

            // Weekday tile
            const dayTrades  = tradesByDay[key] ?? [];
            const netPnl     = dayTrades.length ? dayTrades.reduce((s, t) => s + t.pnl, 0) : null;
            const isExpanded = expandedDay === key;

            return (
              <div
                key={key}
                onClick={() => setExpandedDay(isExpanded ? null : key)}
                className={`min-h-24 border-b border-r border-[var(--border)] p-2 cursor-pointer transition-colors duration-150 hover:brightness-95 ${tileClass(netPnl, dayTrades.length)}`}
              >
                <div className="flex items-start justify-between">
                  <span className={`text-sm font-medium ${isToday ? "w-6 h-6 rounded-full bg-gold text-white flex items-center justify-center text-xs" : "text-[var(--text)]"}`}>
                    {date.getDate()}
                  </span>
                  {dayTrades.length > 0 && (
                    <span className="text-xs text-[var(--text-muted)]">{dayTrades.length}t</span>
                  )}
                </div>
                {netPnl !== null && (
                  <p className={`mt-1 text-xs font-mono font-medium ${pnlColor(netPnl)}`}>
                    {netPnl >= 0 ? "+" : ""}{formatCurrency(netPnl)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded weekday trades */}
      {expandedDay && tradesByDay[expandedDay] && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 space-y-2 animate-fade-in">
          <h3 className="text-sm font-semibold text-[var(--text)]">
            {new Date(expandedDay + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </h3>
          {tradesByDay[expandedDay].map((t) => (
            <div
              key={t.id}
              onClick={() => onDayTradeClick(t)}
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-surface2)] hover:bg-[var(--bg)] cursor-pointer transition-colors border border-[var(--border)]"
            >
              <span className="font-mono text-xs text-[var(--text-muted)] w-20">{t.tradeNumber}</span>
              <span className="font-mono text-sm text-[var(--text)]">{t.instrument}</span>
              <span className={`text-xs ${t.direction === "Long" ? "text-win" : "text-loss"}`}>{t.direction}</span>
              <span className="text-xs text-[var(--text-muted)]">{t.session}</span>
              <span className={`ml-auto font-mono text-sm font-medium ${t.pnl >= 0 ? "text-win" : "text-loss"}`}>
                {t.pnl >= 0 ? "+" : ""}{formatCurrency(t.pnl)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Weekend journal drawer */}
      {weekendDrawer && (
        <WeekendJournalDrawer
          date={weekendDrawer.date}
          type={weekendDrawer.type}
          existing={drawerJournal}
          onSaved={handleJournalSaved}
          onDeleted={handleJournalDeleted}
          onClose={() => setWeekendDrawer(null)}
        />
      )}
    </div>
  );
}
