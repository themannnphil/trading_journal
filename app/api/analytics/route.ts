import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MysqlTradeRepository } from "@/lib/db/repositories/trades";
import type { TradeFilters } from "@/lib/db/types";

const tradeRepo = new MysqlTradeRepository();

function getWeekMonday(date: Date): string {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const filters: TradeFilters = {
    accountId: p.get("accountId") ?? undefined,
    dateFrom:  p.get("dateFrom") ? new Date(p.get("dateFrom")!) : undefined,
    dateTo:    p.get("dateTo")   ? new Date(p.get("dateTo")!)   : undefined,
  };

  const allTrades = await tradeRepo.findAll(session.user.id, filters);
  const trades = allTrades.filter(t => !t.isDraft);

  // Daily P&L
  const dailyMap = new Map<string, { pnl: number; wins: number; losses: number; total: number }>();
  for (const t of trades) {
    const key = new Date(t.date).toISOString().split("T")[0];
    const e = dailyMap.get(key) ?? { pnl: 0, wins: 0, losses: 0, total: 0 };
    e.pnl += t.pnl;
    e.total += 1;
    if (t.result === "Win") e.wins += 1;
    else if (t.result === "Loss") e.losses += 1;
    dailyMap.set(key, e);
  }
  const dailyPnl = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, ...d }));

  // Weekly P&L
  const weeklyMap = new Map<string, { weekStart: string; pnl: number; wins: number; losses: number; total: number }>();
  for (const t of trades) {
    const weekStart = getWeekMonday(new Date(t.date));
    const e = weeklyMap.get(weekStart) ?? { weekStart, pnl: 0, wins: 0, losses: 0, total: 0 };
    e.pnl += t.pnl;
    e.total += 1;
    if (t.result === "Win") e.wins += 1;
    else if (t.result === "Loss") e.losses += 1;
    weeklyMap.set(weekStart, e);
  }
  const weeklyPnl = Array.from(weeklyMap.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  // Instrument breakdown
  const instMap = new Map<string, { wins: number; losses: number; be: number; pnl: number }>();
  for (const t of trades) {
    const e = instMap.get(t.instrument) ?? { wins: 0, losses: 0, be: 0, pnl: 0 };
    e.pnl += t.pnl;
    if (t.result === "Win") e.wins += 1;
    else if (t.result === "Loss") e.losses += 1;
    else e.be += 1;
    instMap.set(t.instrument, e);
  }
  const instrumentBreakdown = Array.from(instMap.entries())
    .map(([instrument, d]) => ({ instrument, ...d, total: d.wins + d.losses + d.be }))
    .sort((a, b) => b.total - a.total);

  // Session breakdown
  const sessMap = new Map<string, { wins: number; losses: number; be: number; pnl: number }>();
  for (const t of trades) {
    const e = sessMap.get(t.session) ?? { wins: 0, losses: 0, be: 0, pnl: 0 };
    e.pnl += t.pnl;
    if (t.result === "Win") e.wins += 1;
    else if (t.result === "Loss") e.losses += 1;
    else e.be += 1;
    sessMap.set(t.session, e);
  }
  const sessionBreakdown = Array.from(sessMap.entries())
    .map(([session, d]) => ({ session, ...d, total: d.wins + d.losses + d.be }));

  // Stats
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.result === "Win").length;
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const validRR = trades.filter(t => t.actualRR && !isNaN(parseFloat(t.actualRR)));
  const avgRr = validRR.length > 0
    ? validRR.reduce((s, t) => s + parseFloat(t.actualRR), 0) / validRR.length
    : 0;
  const bestDay  = dailyPnl.length > 0 ? Math.max(...dailyPnl.map(d => d.pnl)) : 0;
  const worstDay = dailyPnl.length > 0 ? Math.min(...dailyPnl.map(d => d.pnl)) : 0;
  const avgDiscipline = totalTrades > 0
    ? trades.reduce((s, t) => s + t.disciplineScore, 0) / totalTrades
    : 0;

  return NextResponse.json({
    dailyPnl,
    weeklyPnl,
    instrumentBreakdown,
    sessionBreakdown,
    stats: { totalPnl, winRate, totalTrades, avgRr, bestDay, worstDay, avgDiscipline },
  });
}
