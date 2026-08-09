import { getDb } from "./db/mongoConnection";

const WINDOW_MS   = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export async function checkRateLimit(
  ip: string,
  action: string
): Promise<{ allowed: boolean }> {
  const db  = await getDb();
  const col = db.collection("rate_limits");
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  const count = await col.countDocuments({ ip, action, createdAt: { $gte: windowStart } });

  if (count >= MAX_ATTEMPTS) return { allowed: false };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await col.insertOne({ ip, action, createdAt: now } as any);

  // Prune entries older than the window to keep the collection small
  col.deleteMany({ createdAt: { $lt: windowStart } }).catch(() => {});

  return { allowed: true };
}
