import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MongoTradeRepository as MysqlTradeRepository } from "@/lib/db/repositories/mongo/trades";
import { MongoDailySummaryRepository as MysqlDailySummaryRepository } from "@/lib/db/repositories/mongo/dailySummary";
import { MongoAccountRepository as MysqlAccountRepository } from "@/lib/db/repositories/mongo/accounts";

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

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const trade = await tradeRepo.findById(params.id, session.user.id);
  if (!trade) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(trade);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body  = await req.json();
  const trade = await tradeRepo.update(params.id, session.user.id, body);
  if (!trade) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!trade.isDraft) {
    await refreshDailySummary(session.user.id, trade.accountId, new Date(trade.date));
  }
  return NextResponse.json(trade);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const trade = await tradeRepo.findById(params.id, session.user.id);
  if (!trade) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await tradeRepo.delete(params.id, session.user.id);
  await refreshDailySummary(session.user.id, trade.accountId, new Date(trade.date));
  return NextResponse.json({ ok: true });
}
