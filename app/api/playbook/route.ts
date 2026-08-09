import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MongoPlaybookRepository as MysqlPlaybookRepository } from "@/lib/db/repositories/mongo/playbook";

const repo = new MysqlPlaybookRepository();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const playbook = await repo.findByUser(session.user.id);
  return NextResponse.json(playbook);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { content } = await req.json();
  const playbook = await repo.upsert(session.user.id, content);
  return NextResponse.json(playbook);
}
