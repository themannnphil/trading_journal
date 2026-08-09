import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWithdrawalRepo } from "@/lib/db/repos";

const repo = getWithdrawalRepo();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = req.nextUrl.searchParams.get("accountId");
  const withdrawals = accountId
    ? await repo.findByAccount(session.user.id, accountId)
    : await repo.findAll(session.user.id);
  return NextResponse.json(withdrawals);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accountId, amount, date, notes } = await req.json();
  if (!accountId || !amount || !date) {
    return NextResponse.json({ error: "accountId, amount and date are required" }, { status: 400 });
  }

  const withdrawal = await repo.create({
    userId: session.user.id,
    accountId,
    amount: parseFloat(amount),
    date: new Date(date),
    notes: notes || null,
  });
  return NextResponse.json(withdrawal, { status: 201 });
}
