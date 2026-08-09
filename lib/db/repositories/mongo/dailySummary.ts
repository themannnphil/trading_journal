import { getDb } from "../../mongoConnection";
import type { DailySummary, IDailySummaryRepository } from "../../types";
import { randomUUID } from "crypto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToSummary(doc: any): DailySummary {
  return {
    id:         doc._id,
    userId:     doc.userId,
    accountId:  doc.accountId,
    date:       doc.date,
    netPnl:     doc.netPnl,
    tradeCount: doc.tradeCount,
    updatedAt:  doc.updatedAt,
  };
}

export class MongoDailySummaryRepository implements IDailySummaryRepository {
  private async col() {
    const db = await getDb();
    return db.collection("daily_summary");
  }

  async findByMonth(userId: string, year: number, month: number): Promise<DailySummary[]> {
    const col   = await this.col();
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 1);
    const docs  = await col.find({ userId, date: { $gte: start, $lt: end } }).sort({ date: 1 }).toArray();
    return docs.map(docToSummary);
  }

  async upsert(data: Omit<DailySummary, "id" | "updatedAt">): Promise<DailySummary> {
    const col = await this.col();
    const now = new Date();
    const result = await col.findOneAndUpdate(
      { userId: data.userId, accountId: data.accountId, date: data.date },
      {
        $set:         { netPnl: data.netPnl, tradeCount: data.tradeCount, updatedAt: now },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $setOnInsert: { _id: randomUUID(), userId: data.userId, accountId: data.accountId, date: data.date } as any,
      },
      { upsert: true, returnDocument: "after" }
    );
    return docToSummary(result!);
  }
}
