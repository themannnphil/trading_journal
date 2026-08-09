import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MysqlAccountRepository } from "@/lib/db/repositories/accounts";

const repo = new MysqlAccountRepository();

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
  const account = await repo.create({ ...body, userId: session.user.id, currentBalance: body.startingBalance });
  return NextResponse.json(account, { status: 201 });
}
