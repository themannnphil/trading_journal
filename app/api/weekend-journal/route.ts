import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MysqlWeekendJournalRepository } from "@/lib/db/repositories/weekendJournal";
import type { WeekendJournalType } from "@/lib/db/types";

const repo = new MysqlWeekendJournalRepository();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const year  = parseInt(req.nextUrl.searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(req.nextUrl.searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const journals = await repo.findByMonth(session.user.id, year, month);
  return NextResponse.json(journals);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { date, type, ...data } = body;
  if (!date || !type) return NextResponse.json({ error: "date and type required" }, { status: 400 });
  const journal = await repo.upsert(session.user.id, date, type as WeekendJournalType, data);
  return NextResponse.json(journal);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await repo.delete(id, session.user.id);
  return NextResponse.json({ ok: true });
}
