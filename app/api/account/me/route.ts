import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db/mongoConnection";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const db = await getDb();

  // Delete all user data across every collection
  await Promise.all([
    db.collection("trades").deleteMany({ userId }),
    db.collection("accounts").deleteMany({ userId }),
    db.collection("daily_summary").deleteMany({ userId }),
    db.collection("weekend_journal").deleteMany({ userId }),
    db.collection("playbook").deleteMany({ userId }),
    db.collection("withdrawals").deleteMany({ userId }),
    db.collection("screenshots").deleteMany({ userId: userId }),
  ]);

  // Delete the user record last
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.collection("users").deleteOne({ _id: userId as any });

  return NextResponse.json({ ok: true });
}
