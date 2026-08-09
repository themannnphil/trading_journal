import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db/connection";
import { readFile } from "fs/promises";
import { extname } from "path";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const row = await queryOne<{ filepath: string | null; url: string | null }>(
    "SELECT filepath, url FROM screenshots WHERE id = ?",
    [params.id]
  );
  if (!row) return new NextResponse("Not found", { status: 404 });

  if (row.url) return NextResponse.redirect(row.url);

  if (!row.filepath) return new NextResponse("No image", { status: 404 });

  const buffer = await readFile(row.filepath);
  const ext    = extname(row.filepath).toLowerCase();
  const mime   = MIME[ext] ?? "image/png";
  return new NextResponse(buffer, { headers: { "Content-Type": mime, "Cache-Control": "private, max-age=3600" } });
}
