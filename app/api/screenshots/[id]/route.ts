import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MongoScreenshotRepository } from "@/lib/db/repositories/mongo/screenshots";
import { readFile } from "fs/promises";
import { extname } from "path";

const repo = new MongoScreenshotRepository();

const MIME: Record<string, string> = {
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".webp": "image/webp",
};

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const doc = await repo.findById(params.id);
  if (!doc) return new NextResponse("Not found", { status: 404 });

  if (doc.url) return NextResponse.redirect(doc.url);

  if (!doc.filepath) return new NextResponse("No image", { status: 404 });

  const buffer = await readFile(doc.filepath);
  const ext    = extname(doc.filepath).toLowerCase();
  const mime   = MIME[ext] ?? "image/png";
  return new NextResponse(buffer, { headers: { "Content-Type": mime, "Cache-Control": "private, max-age=3600" } });
}
