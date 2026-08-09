"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
} from "recharts";
import { format, subDays, subMonths, startOfMonth, startOfYear, parseISO } from "date-fns";
import { useTheme } from "@/components/providers/ThemeProvider";

interface AccountSummary {
  id: string;
  name: string;
  firm: string;
  currency: string;
  startingBalance: number;
  currentBalance: number;
  profitTarget: number;
  maxDrawdownLimit: number;
  status: string;
  phase: string;
}

interface DailyPnl {
  date: string;
  pnl: number;
  wins: number;
  losses: number;
  total: number;
}

interface WeeklyPnl {
  weekStart: string;
  pnl: number;
  wins: number;
  losses: number;
  total: number;
}

interface BreakdownRow {
  wins: number;
  losses: number;
  be: number;
  pnl: number;
  total: number;
}

interface AnalyticsData {
  dailyPnl: DailyPnl[];
  weeklyPnl: WeeklyPnl[];
  instrumentBreakdown: (BreakdownRow & { instrument: string })[];
  sessionBreakdown: (BreakdownRow & { session: string })[];
  stats: {
    totalPnl: number;
    winRate: number;
    totalTrades: number;
    avgRr: number;
    bestDay: number;
    worstDay: number;
    avgDiscipline: number;
  };
}

type Period = "daily" | "weekly";
type DateRange = "month" | "30d" | "3m" | "ytd" | "all";

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "month", label: "This Month" },
  { value: "30d",   label: "Last 30 Days" },
  { value: "3m",    label: "Last 3 Months" },
  { value: "ytd",   label: "YTD" },
  { value: "all",   label: "All Time" },
];

function getDateRange(range: DateRange) {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const to = fmt(now);
  if (range === "month") return { from: fmt(startOfMonth(now)), to };
  if (range === "30d")   return { from: fmt(subDays(now, 29)), to };
  if (range === "3m")    return { from: fmt(subMonths(now, 3)), to };
  if (range === "ytd")   return { from: fmt(startOfYear(now)), to };
  return {};
}

function fmtMoney(v: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtPct(v: number) {
  return `${v.toFixed(1)}%`;
}

function PnLTooltip({ active, payload }: { active?: boolean; payload?: { payload: DailyPnl & { label: string } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[var(--bg-surface2)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-[var(--text-muted)] mb-1">{d.label}</p>
      <p className={`font-mono font-semibold ${d.pnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
        {d.pnl >= 0 ? "+" : ""}{fmtMoney(d.pnl)}
      </p>
      {d.total > 0 && (
        <p className="text-xs text-[var(--text-subtle)] mt-0.5">
          {d.wins}W / {d.losses}L — {d.total} trades
        </p>
      )}
    </div>
  );
}

function DonutCard({
  title,
  usedLabel,
  remainingLabel,
  usedValue,
  remainingValue,
  usedColor,
  remainingColor,
  currency,
  pct,
}: {
  title: string;
  usedLabel: string;
  remainingLabel: string;
  usedValue: number;
  remainingValue: number;
  usedColor: string;
  remainingColor: string;
  currency: string;
  pct: number;
}) {
  const safe = Math.min(100, Math.max(0, pct));
  const data = [
    { name: usedLabel,      value: Math.max(0, usedValue) },
    { name: remainingLabel, value: Math.max(0, remainingValue) },
  ];
  if (data[0].value === 0 && data[1].value === 0) data[1].value = 1;

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">{title}</p>
      <div className="relative" style={{ width: 152, height: 152 }}>
        <PieChart width={152} height={152}>
          <Pie
            data={data}
            cx={71}
            cy={71}
            innerRadius={50}
            outerRadius={70}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            <Cell fill={usedColor} />
            <Cell fill={remainingColor} />
          </Pie>
        </PieChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-mono font-bold text-xl text-[var(--text)]">{fmtPct(safe)}</span>
          <span className="text-xs text-[var(--text-muted)]">used</span>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-xs w-full">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: usedColor }} />
            {usedLabel}
          </span>
          <span className="font-mono text-[var(--text)]">{fmtMoney(usedValue, currency)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: remainingColor }} />
            {remainingLabel}
          </span>
          <span className="font-mono text-[var(--text)]">{fmtMoney(Math.max(0, remainingValue), currency)}</span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsClient({ accounts }: { accounts: AccountSummary[] }) {
  const { theme } = useTheme();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [period, setPeriod]       = useState<Period>("daily");
  const [dateRange, setDateRange] = useState<DateRange>("month");
  const [data, setData]           = useState<AnalyticsData | null>(null);
  const [loading, setLoading]     = useState(true);

  const account = accounts.find(a => a.id === accountId) ?? accounts[0];

  const remainingColor = theme === "dark" ? "#2A2A2A" : "#E5E7EB";
  const gridColor      = theme === "dark" ? "#2A2A2A" : "#E5E7EB";
  const axisColor      = theme === "dark" ? "#666666" : "#94A3B8";

  const fetchData = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    const { from, to } = getDateRange(dateRange);
    const params = new URLSearchParams({ accountId });
    if (from) params.set("dateFrom", from);
    if (to)   params.set("dateTo", to);
    const res = await fetch(`/api/analytics?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [accountId, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const chartData = (period === "daily" ? data?.dailyPnl ?? [] : data?.weeklyPnl ?? []).map(d => ({
    ...d,
    label: format(parseISO("date" in d ? d.date : (d as WeeklyPnl).weekStart), "MMM d"),
  }));

  const stats = data?.stats;

  const ddUsed      = account ? Math.max(0, account.startingBalance - account.currentBalance) : 0;
  const ddRemaining = account ? Math.max(0, account.maxDrawdownLimit - ddUsed) : 0;
  const ddPct       = account && account.maxDrawdownLimit > 0 ? (ddUsed / account.maxDrawdownLimit) * 100 : 0;

  const profitGained    = account ? Math.max(0, account.currentBalance - account.startingBalance) : 0;
  const profitRemaining = account ? Math.max(0, account.profitTarget - profitGained) : 0;
  const profitPct       = account && account.profitTarget > 0 ? (profitGained / account.profitTarget) * 100 : 0;

  const currency = account?.currency ?? "USD";

  const statCards = [
    {
      label: "Net P&L",
      value: stats
        ? (stats.totalPnl >= 0 ? "+" : "") + fmtMoney(stats.totalPnl, currency)
        : "—",
      color: !stats ? "text-[var(--text)]"
        : stats.totalPnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]",
    },
    {
      label: "Win Rate",
      value: stats ? fmtPct(stats.winRate) : "—",
      color: !stats ? "text-[var(--text)]"
        : stats.winRate >= 50 ? "text-[#22C55E]" : "text-[var(--text)]",
    },
    {
      label: "Trades",
      value: stats ? String(stats.totalTrades) : "—",
      color: "text-[var(--text)]",
    },
    {
      label: "Avg RR",
      value: stats && stats.totalTrades > 0 ? `${stats.avgRr.toFixed(2)}R` : "—",
      color: "text-[var(--text)]",
    },
    {
      label: "Best Day",
      value: stats && stats.totalTrades > 0 ? "+" + fmtMoney(stats.bestDay, currency) : "—",
      color: "text-[#22C55E]",
    },
    {
      label: "Worst Day",
      value: stats && stats.totalTrades > 0 ? fmtMoney(stats.worstDay, currency) : "—",
      color: "text-[#EF4444]",
    },
  ];

  if (!accounts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-[var(--text-muted)]">
        <p className="text-lg font-medium mb-2">No accounts found</p>
        <p className="text-sm">Add an account first to view analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-[var(--text)]">Analytics</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            className="bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text)] text-sm rounded-lg px-3 py-1.5 outline-none cursor-pointer"
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name} — {a.firm}</option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value as DateRange)}
            className="bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text)] text-sm rounded-lg px-3 py-1.5 outline-none cursor-pointer"
          >
            {DATE_RANGES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <div className="flex bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-0.5">
            {(["daily", "weekly"] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  period === p
                    ? "bg-gold/10 text-gold"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {p === "daily" ? "Daily" : "Weekly"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(s => (
          <div
            key={s.label}
            className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4"
          >
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`font-mono font-bold text-lg ${s.color}`}>
              {loading ? "…" : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* P&L bar chart */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">
            {period === "daily" ? "Daily" : "Weekly"} P&L
          </h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-[var(--text-subtle)] text-sm">
              Loading…
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-[var(--text-subtle)] text-sm">
              No trades in this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={chartData} barCategoryGap="35%">
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: axisColor }}
                  tickLine={false}
                  axisLine={false}
                  interval={period === "daily" && chartData.length > 20
                    ? Math.ceil(chartData.length / 12)
                    : 0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: axisColor }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => fmtMoney(v, currency)}
                  width={72}
                />
                <Tooltip
                  content={<PnLTooltip />}
                  cursor={{ fill: theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
                />
                <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.pnl >= 0 ? "#22C55E" : "#EF4444"}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Account progress */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Account Progress
          </h2>
          {account && (
            <p className="text-xs text-[var(--text-subtle)] mb-5">
              Balance:{" "}
              <span className="font-mono text-[var(--text)]">
                {fmtMoney(account.currentBalance, currency)}
              </span>
            </p>
          )}
          <div className="flex flex-col items-center gap-7">
            <DonutCard
              title="Drawdown Used"
              usedLabel="DD Used"
              remainingLabel="DD Left"
              usedValue={ddUsed}
              remainingValue={ddRemaining}
              usedColor="#EF4444"
              remainingColor={remainingColor}
              currency={currency}
              pct={ddPct}
            />
            <div className="w-full border-t border-[var(--border)]" />
            <DonutCard
              title="Profit Target"
              usedLabel="Gained"
              remainingLabel="Remaining"
              usedValue={profitGained}
              remainingValue={profitRemaining}
              usedColor="#22C55E"
              remainingColor={remainingColor}
              currency={currency}
              pct={profitPct}
            />
          </div>
        </div>
      </div>

      {/* Breakdown row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Instrument */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">
            By Instrument
          </h2>
          {loading ? (
            <p className="text-sm text-[var(--text-subtle)]">Loading…</p>
          ) : !data?.instrumentBreakdown?.length ? (
            <p className="text-sm text-[var(--text-subtle)]">No data for this period</p>
          ) : (
            <div className="space-y-3">
              {data.instrumentBreakdown.map(row => {
                const wr = row.total > 0 ? (row.wins / row.total) * 100 : 0;
                return (
                  <div key={row.instrument}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-mono text-[var(--text)]">{row.instrument}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--text-muted)]">
                          {row.total} trades · {fmtPct(wr)} WR
                        </span>
                        <span className={`text-xs font-mono font-semibold ${row.pnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                          {row.pnl >= 0 ? "+" : ""}{fmtMoney(row.pnl, currency)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[var(--bg-surface2)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${wr}%`,
                          background: wr >= 50 ? "#22C55E" : "#EF4444",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By Session */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">
            By Session
          </h2>
          {loading ? (
            <p className="text-sm text-[var(--text-subtle)]">Loading…</p>
          ) : !data?.sessionBreakdown?.length ? (
            <p className="text-sm text-[var(--text-subtle)]">No data for this period</p>
          ) : (
            <div className="space-y-3">
              {(["Asia", "London", "NY-am", "NY-pm"] as const).map(sess => {
                const row = data.sessionBreakdown.find(s => s.session === sess);
                if (!row) {
                  return (
                    <div key={sess} className="flex justify-between items-center opacity-30">
                      <span className="text-sm text-[var(--text-muted)]">{sess}</span>
                      <span className="text-xs text-[var(--text-subtle)]">No trades</span>
                    </div>
                  );
                }
                const wr = row.total > 0 ? (row.wins / row.total) * 100 : 0;
                return (
                  <div key={sess}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-[var(--text)]">{sess}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--text-muted)]">
                          {row.total} trades · {fmtPct(wr)} WR
                        </span>
                        <span className={`text-xs font-mono font-semibold ${row.pnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                          {row.pnl >= 0 ? "+" : ""}{fmtMoney(row.pnl, currency)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[var(--bg-surface2)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${wr}%`,
                          background: wr >= 50 ? "#22C55E" : "#EF4444",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
