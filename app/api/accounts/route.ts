import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAccountRepo } from "@/lib/db/repos";

const repo = getAccountRepo();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const accounts = await repo.findAll(session.user.id);
  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (body.name && String(body.name).length > 100) return NextResponse.json({ error: "name too long" }, { status: 400 });
  if (body.firm && String(body.firm).length > 100) return NextResponse.json({ error: "firm too long" }, { status: 400 });
  const account = await repo.create({ ...body, userId: session.user.id, currentBalance: body.startingBalance });
  return NextResponse.json(account, { status: 201 });
}
