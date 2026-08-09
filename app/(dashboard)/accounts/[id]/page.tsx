"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Account, Trade } from "@/lib/db/types";
import { formatCurrency, formatDate, isoDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { AccountFormModal } from "../components/AccountFormModal";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = { Win: "#22C55E", Loss: "#EF4444", BreakEven: "#F59E0B" };
const DAYS   = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const SESSIONS = ["Asia","London","NY-am","NY-pm"];

function MetricCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
      <p className={`text-lg font-mono font-bold ${accent ? "text-gold" : "text-[var(--text)]"}`}>{value}</p>
      {sub && <p className="text-xs text-[var(--text-subtle)] mt-0.5">{sub}</p>}
    </div>
  );
}

function chartTooltipStyle() {
  return {
    contentStyle: {
      background: "var(--bg-surface)",
      border:     "1px solid var(--border)",
      borderRadius: "8px",
      color:      "var(--text)",
      fontSize:   "12px",
    },
  };
}

export default function AccountDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [trades,  setTrades]  = useState<Trade[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [certs, setCerts] = useState<Array<{ id: string; filename: string }>>([]);
  const [certUploading, setCertUploading] = useState(false);

  async function loadCerts() {
    const res = await fetch(`/api/screenshots?accountId=${id}`);
    if (res.ok) setCerts(await res.json());
  }

  async function load() {
    const [accRes, tradeRes] = await Promise.all([
      fetch(`/api/accounts/${id}`),
      fetch(`/api/trades?accountId=${id}`),
    ]);
    if (accRes.ok)   setAccount(await accRes.json());
    if (tradeRes.ok) setTrades(await tradeRes.json());
    setLoading(false);
  }

  async function handleCertUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setCertUploading(true);
    const fd = new FormData();
    fd.append("accountId", id);
    for (const f of Array.from(files)) fd.append("files", f);
    await fetch("/api/screenshots", { method: "POST", body: fd });
    e.target.value = "";
    setCertUploading(false);
    await loadCerts();
  }

  async function handleCertDelete(certId: string) {
    await fetch(`/api/screenshots?id=${certId}`, { method: "DELETE" });
    setCerts((prev) => prev.filter((c) => c.id !== certId));
  }

  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (account?.status === "Passed") loadCerts(); }, [id, account?.status]);

  if (loading) return <div className="flex items-center justify-center h-64 text-[var(--text-muted)] text-sm">Loading...</div>;
  if (!account) return <div className="text-[var(--text-muted)] text-sm">Account not found.</div>;

  const settled = trades.filter((t) => !t.isDraft);
  const wins    = settled.filter((t) => t.result === "Win");
  const losses  = settled.filter((t) => t.result === "Loss");
  const bes     = settled.filter((t) => t.result === "BreakEven");
  const winRate = settled.length ? ((wins.length / settled.length) * 100).toFixed(1) : "0";
  const totalPnl = settled.reduce((s, t) => s + t.pnl, 0);
  const avgRR   = settled.filter((t) => t.actualRR).reduce((s, t) => s + parseFloat(t.actualRR.replace("1:", "") || "0"), 0) / (settled.length || 1);
  const sortedPnl = [...settled].sort((a, b) => b.pnl - a.pnl);
  const best    = sortedPnl[0];
  const worst   = sortedPnl[sortedPnl.length - 1];

  // Equity curve — cumulative PnL per day
  const equityByDay: Record<string, number> = {};
  for (const t of settled) {
    const key = isoDate(new Date(t.date));
    equityByDay[key] = (equityByDay[key] ?? 0) + t.pnl;
  }
  let running = account.startingBalance;
  const equityCurve = Object.entries(equityByDay).sort().map(([date, pnl]) => {
    running += pnl;
    return { date: date.slice(5), balance: parseFloat(running.toFixed(2)) };
  });

  // PnL by day of week
  const pnlByDay = DAYS.map((day) => {
    const dayTrades = settled.filter((t) => t.day === day);
    const avg = dayTrades.length ? dayTrades.reduce((s, t) => s + t.pnl, 0) / dayTrades.length : 0;
    return { day: day.slice(0, 3), avg: parseFloat(avg.toFixed(2)), count: dayTrades.length };
  });

  // PnL by session
  const pnlBySession = SESSIONS.map((session) => {
    const st = settled.filter((t) => t.session === session);
    const avg = st.length ? st.reduce((s, t) => s + t.pnl, 0) / st.length : 0;
    return { session, avg: parseFloat(avg.toFixed(2)) };
  });

  // PnL by instrument
  const instMap: Record<string, number[]> = {};
  for (const t of settled) {
    if (!instMap[t.instrument]) instMap[t.instrument] = [];
    instMap[t.instrument].push(t.pnl);
  }
  const pnlByInstrument = Object.entries(instMap).map(([inst, vals]) => ({
    instrument: inst,
    avg: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
  }));

  // Discipline trend
  const disciplineTrend = settled.slice(-20).map((t) => ({
    date:  isoDate(new Date(t.date)).slice(5),
    score: t.disciplineScore,
  }));

  // Streak
  let streak = 0; let streakType: "win" | "loss" | null = null;
  for (const t of [...settled].reverse()) {
    if (streak === 0) { streakType = t.result === "Win" ? "win" : t.result === "Loss" ? "loss" : null; streak = 1; }
    else if ((streakType === "win" && t.result === "Win") || (streakType === "loss" && t.result === "Loss")) streak++;
    else break;
  }

  // Progress
  const distToTarget      = account.profitTarget    - totalPnl;
  const distToDrawdown    = account.maxDrawdownLimit + totalPnl; // pnl can be negative
  const profitPct         = account.profitTarget > 0 ? Math.max(0, Math.min((totalPnl / account.profitTarget) * 100, 100)) : 0;
  const drawdownPct       = account.maxDrawdownLimit > 0 ? Math.min((Math.abs(Math.min(totalPnl, 0)) / account.maxDrawdownLimit) * 100, 100) : 0;
  const ddBarColor        = drawdownPct > 75 ? "bg-red-500" : drawdownPct > 50 ? "bg-amber-500" : "bg-green-500";

  // Daily drawdown — use the most recent trading day so it's visible whenever you view the account
  function localDateStr(d: Date | string): string {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  }
  const tradingDays       = Array.from(new Set(settled.map((t) => localDateStr(new Date(t.date))))).sort();
  const latestDay         = tradingDays[tradingDays.length - 1] ?? localDateStr(new Date());
  const latestDayTrades   = settled.filter((t) => localDateStr(new Date(t.date)) === latestDay);
  const todayPnl          = latestDayTrades.reduce((s, t) => s + t.pnl, 0);
  const dailyDDPct        = account.dailyDrawdownLimit > 0 ? Math.min((Math.abs(Math.min(todayPnl, 0)) / account.dailyDrawdownLimit) * 100, 100) : 0;
  const dailyDDBarColor   = dailyDDPct > 75 ? "bg-red-500" : dailyDDPct > 50 ? "bg-amber-500" : "bg-green-500";
  const distToDailyDD     = account.dailyDrawdownLimit + todayPnl;

  const statusVariant = (s: string) => s.toLowerCase() as "active"|"blown"|"passed"|"live";

  const barColor = (v: number) => v >= 0 ? "#22C55E" : "#EF4444";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => router.push("/accounts")} className="text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer text-sm">← Accounts</button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-[var(--text)]">{account.name}</h1>
            <Badge variant={statusVariant(account.status)}>{account.status}</Badge>
            <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-surface2)] px-2 py-0.5 rounded">{account.phase}</span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">{account.firm} · {account.assetClass} · {account.currency}</p>
        </div>
        <button onClick={() => setEditOpen(true)} className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer">Edit</button>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Total Trades"    value={String(settled.length)} />
        <MetricCard label="Win Rate"        value={`${winRate}%`} accent />
        <MetricCard label="Avg R:R"         value={`1:${avgRR.toFixed(2)}`} />
        <MetricCard label="Net P&L"         value={formatCurrency(totalPnl, account.currency)} accent={totalPnl >= 0} />
        <MetricCard label="Best Trade"      value={best ? formatCurrency(best.pnl, account.currency) : "—"} sub={best ? formatDate(best.date) : undefined} />
        <MetricCard label="Worst Trade"     value={worst ? formatCurrency(worst.pnl, account.currency) : "—"} sub={worst ? formatDate(worst.date) : undefined} />
        <MetricCard label="Current Balance" value={formatCurrency(account.currentBalance, account.currency)} />
        <MetricCard label="Streak"          value={streak > 0 ? `${streak} ${streakType === "win" ? "W" : "L"}` : "—"} accent />
      </div>

      {/* Progress bars */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--text)]">Progress</h2>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[var(--text-muted)]">Profit Target</span>
              <span className="font-mono text-[var(--text-muted)]">{formatCurrency(totalPnl)} / {formatCurrency(account.profitTarget)} ({profitPct.toFixed(1)}%)</span>
            </div>
            <div className="h-2 bg-[var(--bg-surface2)] rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${profitPct}%` }} />
            </div>
            <p className="text-xs text-[var(--text-subtle)] mt-1">{distToTarget > 0 ? `${formatCurrency(distToTarget)} remaining` : "Target reached!"}</p>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[var(--text-muted)]">Max Drawdown</span>
              <span className="font-mono text-[var(--text-muted)]">{drawdownPct.toFixed(1)}% used</span>
            </div>
            <div className="h-2 bg-[var(--bg-surface2)] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${ddBarColor}`} style={{ width: `${drawdownPct}%` }} />
            </div>
            <p className="text-xs text-[var(--text-subtle)] mt-1">{distToDrawdown > 0 ? `${formatCurrency(distToDrawdown)} remaining` : "Drawdown limit hit"}</p>
          </div>
          {account.dailyDrawdownLimit > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[var(--text-muted)]">Daily Drawdown ({latestDay})</span>
                <span className="font-mono text-[var(--text-muted)]">{dailyDDPct.toFixed(1)}% used</span>
              </div>
              <div className="h-2 bg-[var(--bg-surface2)] rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${dailyDDBarColor}`} style={{ width: `${dailyDDPct}%` }} />
              </div>
              <p className="text-xs text-[var(--text-subtle)] mt-1">{distToDailyDD > 0 ? `${formatCurrency(distToDailyDD)} remaining` : "Daily drawdown limit hit"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Certificate — visible only on Passed accounts */}
      {account.status === "Passed" && (
        <div className="bg-[var(--bg-surface)] border border-gold/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" />
              </svg>
              <h2 className="text-sm font-semibold text-[var(--text)]">Account Certificate</h2>
            </div>
            <label className={`px-3 py-1.5 text-xs rounded-lg bg-gold text-white font-medium cursor-pointer hover:opacity-90 shadow-glow-gold transition-opacity ${certUploading ? "opacity-50 pointer-events-none" : ""}`}>
              {certUploading ? "Uploading..." : "+ Upload Certificate"}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleCertUpload} disabled={certUploading} />
            </label>
          </div>
          {certs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-[var(--text-muted)]">
              <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">No certificate uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certs.map((c) => (
                <div key={c.id} className="relative group rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-surface2)]">
                  <img src={`/api/screenshots/${c.id}`} alt={c.filename} className="w-full object-contain max-h-64" />
                  <button
                    onClick={() => handleCertDelete(c.id)}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:bg-red-600"
                  >✕</button>
                  {c.filename && <p className="text-xs text-[var(--text-muted)] px-3 py-1.5 truncate border-t border-[var(--border)]">{c.filename}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Equity curve */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 col-span-full">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-4">Equity Curve</h2>
          {equityCurve.length < 2 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">Not enough data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={equityCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <Tooltip {...chartTooltipStyle()} formatter={(v) => [formatCurrency(Number(v)), "Balance"]} />
                <Line type="monotone" dataKey="balance" stroke="#F5A623" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Win/Loss/BE donut */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-4">Win / Loss / BE</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={[
                { name: "Win",       value: wins.length },
                { name: "Loss",      value: losses.length },
                { name: "BreakEven", value: bes.length },
              ]} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {["Win","Loss","BreakEven"].map((r) => <Cell key={r} fill={COLORS[r as keyof typeof COLORS]} />)}
              </Pie>
              <Tooltip {...chartTooltipStyle()} />
              <Legend formatter={(v) => <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* PnL by day */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-4">Avg P&L by Day of Week</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pnlByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip {...chartTooltipStyle()} formatter={(v) => [formatCurrency(Number(v)), "Avg P&L"]} />
              <Bar dataKey="avg" radius={[4,4,0,0]}>
                {pnlByDay.map((entry, i) => <Cell key={i} fill={barColor(entry.avg)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PnL by session */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-4">Avg P&L by Session</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pnlBySession}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="session" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip {...chartTooltipStyle()} formatter={(v) => [formatCurrency(Number(v)), "Avg P&L"]} />
              <Bar dataKey="avg" radius={[4,4,0,0]}>
                {pnlBySession.map((entry, i) => <Cell key={i} fill={barColor(entry.avg)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PnL by instrument */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-4">Avg P&L by Instrument</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pnlByInstrument}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="instrument" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip {...chartTooltipStyle()} formatter={(v) => [formatCurrency(Number(v)), "Avg P&L"]} />
              <Bar dataKey="avg" radius={[4,4,0,0]}>
                {pnlByInstrument.map((entry, i) => <Cell key={i} fill={barColor(entry.avg)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Discipline trend */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-4">Discipline Score Trend</h2>
          {disciplineTrend.length < 2 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">Not enough data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={disciplineTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis domain={[1,5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <Tooltip {...chartTooltipStyle()} />
                <Line type="monotone" dataKey="score" stroke="#F5A623" strokeWidth={2} dot={{ fill: "#F5A623", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {editOpen && (
        <AccountFormModal account={account} onSaved={() => { setEditOpen(false); load(); }} onClose={() => setEditOpen(false)} />
      )}
    </div>
  );
}
