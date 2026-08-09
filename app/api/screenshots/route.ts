import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { execute, query, queryOne } from "@/lib/db/connection";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";
import { v2 as cloudinary } from "cloudinary";

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
    const id = randomUUID();
    await execute(
      "INSERT INTO screenshots (id, trade_id, journal_id, account_id, filename, label, filepath, url) VALUES (?,?,?,?,?,?,NULL,?)",
      [id, tradeId ?? null, journalId ?? null, accountId ?? null, label ?? url, label ?? null, url]
    );
    return NextResponse.json({ id, label: label ?? null, url, filename: label ?? url }, { status: 201 });
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
    const id     = randomUUID();

    if (useCloud) {
      const { url, publicId } = await uploadToCloud(buffer);
      await execute(
        "INSERT INTO screenshots (id, trade_id, journal_id, account_id, filename, label, filepath, url) VALUES (?,?,?,?,?,?,?,?)",
        [id, tradeId ?? null, journalId ?? null, accountId ?? null, file.name, label, publicId, url]
      );
    } else {
      const storagePath = process.env.SCREENSHOT_STORAGE_PATH ?? "/tmp/trading-screenshots";
      const subDir      = tradeId ?? journalId ?? accountId!;
      const dir         = join(storagePath, subDir);
      await mkdir(dir, { recursive: true });
      const filename = `${randomUUID()}${extname(file.name) || ".png"}`;
      const filepath = join(dir, filename);
      await writeFile(filepath, buffer);
      await execute(
        "INSERT INTO screenshots (id, trade_id, journal_id, account_id, filename, label, filepath, url) VALUES (?,?,?,?,?,?,?,NULL)",
        [id, tradeId ?? null, journalId ?? null, accountId ?? null, file.name, label, filepath]
      );
    }

    saved.push({ id, filename: file.name, label });
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
  const col  = tradeId ? "trade_id" : journalId ? "journal_id" : "account_id";
  const val  = tradeId ?? journalId ?? accountId;
  const rows = await query("SELECT id, trade_id, journal_id, account_id, filename, label, filepath, url, upload_date FROM screenshots WHERE " + col + " = ?", [val]);
  return NextResponse.json(rows);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Delete from Cloudinary if applicable (filepath holds the public_id for cloud uploads)
  if (cloudinaryEnabled()) {
    const row = await queryOne<{ filepath: string | null }>("SELECT filepath FROM screenshots WHERE id = ?", [id]);
    if (row?.filepath && !row.filepath.startsWith("/")) {
      try { await cloudinary.uploader.destroy(row.filepath); } catch { /* best-effort */ }
    }
  }

  await execute("DELETE FROM screenshots WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
