import { getDb } from "../../mongoConnection";
import type { Trade, ITradeRepository, TradeFilters } from "../../types";
import { randomUUID } from "crypto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToTrade(doc: any): Trade {
  return {
    id:               doc._id,
    userId:           doc.userId,
    accountId:        doc.accountId,
    tradeNumber:      doc.tradeNumber,
    date:             doc.date,
    day:              doc.day,
    instrument:       doc.instrument,
    direction:        doc.direction,
    session:          doc.session,
    entryPrice:       doc.entryPrice,
    stopLoss:         doc.stopLoss,
    takeProfit:       doc.takeProfit,
    lotSize:          doc.lotSize,
    plannedRR:        doc.plannedRR,
    actualRR:         doc.actualRR,
    result:           doc.result,
    pnl:              doc.pnl,
    duration:         doc.duration,
    marketCondition:  doc.marketCondition,
    setupStrategy:    doc.setupStrategy,
    executionQuality: doc.executionQuality,
    disciplineScore:  doc.disciplineScore,
    emotions:         doc.emotions,
    ruleViolation:    doc.ruleViolation,
    improvement:      doc.improvement,
    notesReflection:  doc.notesReflection,
    dayResult:        doc.dayResult,
    tradingviewLink:  doc.tradingviewLink,
    commissionCost:   doc.commissionCost ?? null,
    isDraft:          doc.isDraft,
    createdAt:        doc.createdAt,
    updatedAt:        doc.updatedAt,
  };
}

export class MongoTradeRepository implements ITradeRepository {
  private async col() {
    const db = await getDb();
    return db.collection("trades");
  }

  async findAll(userId: string, filters?: TradeFilters): Promise<Trade[]> {
    const col = await this.col();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const match: Record<string, any> = { userId };

    if (filters?.accountId)  match.accountId  = filters.accountId;
    if (filters?.instrument) match.instrument  = filters.instrument;
    if (filters?.result)     match.result      = filters.result;
    if (filters?.session)    match.session     = filters.session;
    if (filters?.day)        match.day         = filters.day;

    if (filters?.dateFrom || filters?.dateTo) {
      match.date = {};
      if (filters.dateFrom) match.date.$gte = filters.dateFrom;
      if (filters.dateTo)   match.date.$lte = filters.dateTo;
    }

    if (filters?.search) {
      const re = { $regex: filters.search, $options: "i" };
      match.$or = [{ tradeNumber: re }, { setupStrategy: re }, { notesReflection: re }];
    }

    const docs = await col.find(match).sort({ date: -1, createdAt: -1 }).toArray();
    return docs.map(docToTrade);
  }

  async findById(id: string, userId: string): Promise<Trade | null> {
    const col = await this.col();
    const doc = await col.findOne({ _id: id, userId });
    return doc ? docToTrade(doc) : null;
  }

  async create(data: Omit<Trade, "id" | "createdAt" | "updatedAt">): Promise<Trade> {
    const col = await this.col();
    const _id = randomUUID();
    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await col.insertOne({ _id, ...data, createdAt: now, updatedAt: now } as any);
    return (await this.findById(_id, data.userId))!;
  }

  async update(id: string, userId: string, data: Partial<Trade>): Promise<Trade | null> {
    const col = await this.col();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _removed, ...rest } = data as Record<string, unknown>;
    if (Object.keys(rest).length) {
      await col.updateOne({ _id: id, userId }, { $set: { ...rest, updatedAt: new Date() } });
    }
    return this.findById(id, userId);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const col = await this.col();
    const result = await col.deleteOne({ _id: id, userId });
    return result.deletedCount > 0;
  }

  async countByMonth(userId: string, accountId: string, year: number, month: number): Promise<number> {
    const col = await this.col();
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 1);
    return col.countDocuments({ userId, accountId, isDraft: false, date: { $gte: start, $lt: end } });
  }
}
