import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MongoScreenshotRepository } from "@/lib/db/repositories/mongo/screenshots";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";
import { v2 as cloudinary } from "cloudinary";

const repo = new MongoScreenshotRepository();

function cloudinaryEnabled(): boolean {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return false;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return true;
}

async function uploadToCloud(buffer: Buffer): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "phil-trades-journal", resource_type: "image" },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    ).end(buffer);
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";

  // JSON body = URL-based screenshot
  if (contentType.includes("application/json")) {
    const body = await req.json();
    const { tradeId, journalId, accountId, url, label } = body;
    if (!url || (!tradeId && !journalId && !accountId)) {
      return NextResponse.json({ error: "url and one of (tradeId, journalId, accountId) required" }, { status: 400 });
    }
    const doc = await repo.insert({ tradeId: tradeId ?? null, journalId: journalId ?? null, accountId: accountId ?? null, filename: label ?? url, label: label ?? null, filepath: null, url, uploadDate: new Date() });
    return NextResponse.json({ id: doc._id, label: doc.label, url: doc.url, filename: doc.filename }, { status: 201 });
  }

  // FormData = file upload
  const formData  = await req.formData();
  const tradeId   = formData.get("tradeId")   as string | null;
  const journalId = formData.get("journalId") as string | null;
  const accountId = formData.get("accountId") as string | null;
  const files     = formData.getAll("files")  as File[];
  const labelsRaw = formData.get("labels");
  const labels: string[] = labelsRaw ? JSON.parse(labelsRaw as string) : [];

  if (!files.length || (!tradeId && !journalId && !accountId)) {
    return NextResponse.json({ error: "files and one of (tradeId, journalId, accountId) required" }, { status: 400 });
  }

  const useCloud = cloudinaryEnabled();
  const saved: { id: string; filename: string; label: string | null }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file   = files[i];
    const label  = labels[i] ?? null;
    const buffer = Buffer.from(await file.arrayBuffer());

    if (useCloud) {
      const { url, publicId } = await uploadToCloud(buffer);
      const doc = await repo.insert({ tradeId: tradeId ?? null, journalId: journalId ?? null, accountId: accountId ?? null, filename: file.name, label, filepath: publicId, url, uploadDate: new Date() });
      saved.push({ id: doc._id, filename: doc.filename, label: doc.label });
    } else {
      const storagePath = process.env.SCREENSHOT_STORAGE_PATH ?? "/tmp/trading-screenshots";
      const subDir      = tradeId ?? journalId ?? accountId!;
      const dir         = join(storagePath, subDir);
      await mkdir(dir, { recursive: true });
      const filename = `${randomUUID()}${extname(file.name) || ".png"}`;
      const filepath = join(dir, filename);
      await writeFile(filepath, buffer);
      const doc = await repo.insert({ tradeId: tradeId ?? null, journalId: journalId ?? null, accountId: accountId ?? null, filename: file.name, label, filepath, url: null, uploadDate: new Date() });
      saved.push({ id: doc._id, filename: doc.filename, label: doc.label });
    }
  }

  return NextResponse.json(saved, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p         = req.nextUrl.searchParams;
  const tradeId   = p.get("tradeId");
  const journalId = p.get("journalId");
  const accountId = p.get("accountId");
  if (!tradeId && !journalId && !accountId) return NextResponse.json({ error: "tradeId, journalId, or accountId required" }, { status: 400 });
  const field = tradeId ? "tradeId" : journalId ? "journalId" : "accountId";
  const value = (tradeId ?? journalId ?? accountId)!;
  const docs  = await repo.findByField(field, value);
  return NextResponse.json(docs.map(d => ({ id: d._id, filename: d.filename, label: d.label, filepath: d.filepath, url: d.url, uploadDate: d.uploadDate })));
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (cloudinaryEnabled()) {
    const doc = await repo.findById(id);
    if (doc?.filepath && !doc.filepath.startsWith("/")) {
      try { await cloudinary.uploader.destroy(doc.filepath); } catch { /* best-effort */ }
    }
  }

  await repo.delete(id);
  return NextResponse.json({ ok: true });
}
