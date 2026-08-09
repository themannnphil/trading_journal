import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MongoTradeRepository as MysqlTradeRepository } from "@/lib/db/repositories/mongo/trades";
import { MongoDailySummaryRepository as MysqlDailySummaryRepository } from "@/lib/db/repositories/mongo/dailySummary";
import { MongoAccountRepository as MysqlAccountRepository } from "@/lib/db/repositories/mongo/accounts";
import type { TradeFilters } from "@/lib/db/types";

const tradeRepo   = new MysqlTradeRepository();
const summaryRepo = new MysqlDailySummaryRepository();
const accountRepo = new MysqlAccountRepository();

async function refreshDailySummary(userId: string, accountId: string, date: Date) {
  const start = new Date(date); start.setHours(0,0,0,0);
  const end   = new Date(date); end.setHours(23,59,59,999);
  const trades = await tradeRepo.findAll(userId, { accountId, dateFrom: start, dateTo: end });
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
  await summaryRepo.upsert({ userId, accountId, date, netPnl, tradeCount: trades.length });

  const allTrades = await tradeRepo.findAll(userId, { accountId });
  const account   = await accountRepo.findById(accountId, userId);
  if (account) {
    const totalPnl = allTrades.reduce((s, t) => s + t.pnl, 0);
    await accountRepo.update(accountId, userId, { currentBalance: account.startingBalance + totalPnl });

    if (account.status === "Active") {
      if (account.profitTarget > 0 && totalPnl >= account.profitTarget) {
        await accountRepo.update(accountId, userId, { status: "Passed" });
      } else if (account.maxDrawdownLimit > 0 && totalPnl <= -account.maxDrawdownLimit) {
        await accountRepo.update(accountId, userId, { status: "Blown" });
      } else if (account.dailyDrawdownLimit > 0 && netPnl <= -account.dailyDrawdownLimit) {
        await accountRepo.update(accountId, userId, { status: "Blown" });
      }
    }
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const filters: TradeFilters = {
    accountId:  p.get("accountId")  ?? undefined,
    instrument: (p.get("instrument") as TradeFilters["instrument"]) ?? undefined,
    result:     (p.get("result")     as TradeFilters["result"])     ?? undefined,
    session:    (p.get("session")    as TradeFilters["session"])    ?? undefined,
    day:        (p.get("day")        as TradeFilters["day"])        ?? undefined,
    dateFrom:   p.get("dateFrom")  ? new Date(p.get("dateFrom")!)  : undefined,
    dateTo:     p.get("dateTo")    ? new Date(p.get("dateTo")!)    : undefined,
    search:     p.get("search")      ?? undefined,
  };

  const trades = await tradeRepo.findAll(session.user.id, filters);
  return NextResponse.json(trades);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { accountId, isDraft, date } = body;

  // Auto-generate trade number: Trade 001, 002... per month per account
  const d = new Date(date);
  const count = await tradeRepo.countByMonth(session.user.id, accountId, d.getFullYear(), d.getMonth() + 1);
  const tradeNumber = `Trade ${String(count + 1).padStart(3, "0")}`;

  const trade = await tradeRepo.create({
    ...body,
    userId: session.user.id,
    tradeNumber,
    date: d,
    isDraft: isDraft ?? false,
  });

  if (!isDraft) {
    await refreshDailySummary(session.user.id, accountId, d);
  }

  return NextResponse.json(trade, { status: 201 });
}
