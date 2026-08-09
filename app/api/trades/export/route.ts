import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTradeRepo } from "@/lib/db/repos";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = req.nextUrl.searchParams.get("accountId") ?? undefined;
  const repo   = getTradeRepo();
  const trades = await repo.findAll(session.user.id, accountId ? { accountId } : undefined);

  const headers = [
    "Date","Day","Instrument","Direction","Session","Entry Price","Stop Loss",
    "Take Profit","Lot Size","Planned R:R","Actual R:R","Result","P&L",
    "Duration","Market Condition","Setup/Strategy","Execution Quality",
    "Discipline Score","Emotions","Rule Violation","Improvement","Notes","Commission"
  ];

  function esc(v: unknown): string {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  const rows = trades
    .filter((t) => !t.isDraft)
    .map((t) => [
      esc(new Date(t.date).toISOString().slice(0, 10)),
      esc(t.day), esc(t.instrument), esc(t.direction), esc(t.session),
      esc(t.entryPrice), esc(t.stopLoss), esc(t.takeProfit), esc(t.lotSize),
      esc(t.plannedRR), esc(t.actualRR), esc(t.result), esc(t.pnl),
      esc(t.duration), esc(t.marketCondition), esc(t.setupStrategy),
      esc(t.executionQuality), esc(t.disciplineScore), esc(t.emotions),
      esc(t.ruleViolation), esc(t.improvement), esc(t.notesReflection),
      esc(t.commissionCost),
    ].join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = accountId ? `trades-${accountId}.csv` : "trades.csv";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
