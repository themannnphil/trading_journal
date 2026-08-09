import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDailySummaryRepo } from "@/lib/db/repos";

const repo = getDailySummaryRepo();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const year  = parseInt(req.nextUrl.searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(req.nextUrl.searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const summaries = await repo.findByMonth(session.user.id, year, month);
  return NextResponse.json(summaries);
}
