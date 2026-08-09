import { getDb } from "../../mongoConnection";
import type { Account, IAccountRepository } from "../../types";
import { randomUUID } from "crypto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToAccount(doc: any): Account {
  return {
    id:                 doc._id,
    userId:             doc.userId,
    name:               doc.name,
    firm:               doc.firm,
    assetClass:         doc.assetClass,
    startingBalance:    doc.startingBalance,
    currentBalance:     doc.currentBalance,
    currency:           doc.currency,
    status:             doc.status,
    profitTarget:       doc.profitTarget,
    maxDrawdownLimit:   doc.maxDrawdownLimit,
    dailyDrawdownLimit: doc.dailyDrawdownLimit ?? 0,
    phase:              doc.phase,
    createdAt:          doc.createdAt,
    updatedAt:          doc.updatedAt,
  };
}

export class MongoAccountRepository implements IAccountRepository {
  private async col() {
    const db = await getDb();
    return db.collection<{ _id: string } & Record<string, unknown>>("accounts");
  }

  async findAll(userId: string): Promise<Account[]> {
    const col = await this.col();
    const docs = await col.find({ userId }).sort({ createdAt: 1 }).toArray();
    return docs.map(docToAccount);
  }

  async findById(id: string, userId: string): Promise<Account | null> {
    const col = await this.col();
    const doc = await col.findOne({ _id: id, userId });
    return doc ? docToAccount(doc) : null;
  }

  async create(data: Omit<Account, "id" | "createdAt" | "updatedAt">): Promise<Account> {
    const col = await this.col();
    const _id = randomUUID();
    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await col.insertOne({ _id, ...data, createdAt: now, updatedAt: now } as any);
    return (await this.findById(_id, data.userId))!;
  }

  async update(id: string, userId: string, data: Partial<Account>): Promise<Account | null> {
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
}
