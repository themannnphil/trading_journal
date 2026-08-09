import { getDb } from "../../mongoConnection";
import type { Withdrawal, IWithdrawalRepository } from "../../types";
import { randomUUID } from "crypto";

function docToWithdrawal(doc: Record<string, unknown>): Withdrawal {
  return {
    id:        doc._id as string,
    userId:    doc.userId as string,
    accountId: doc.accountId as string,
    amount:    doc.amount as number,
    date:      doc.date as Date,
    notes:     (doc.notes as string | null) ?? null,
    createdAt: doc.createdAt as Date,
  };
}

export class MongoWithdrawalRepository implements IWithdrawalRepository {
  private async col() {
    const db = await getDb();
    return db.collection<{ _id: string } & Record<string, unknown>>("withdrawals");
  }

  async findAll(userId: string): Promise<Withdrawal[]> {
    const col  = await this.col();
    const docs = await col.find({ userId }).sort({ date: -1 }).toArray();
    return docs.map(docToWithdrawal);
  }

  async findByAccount(userId: string, accountId: string): Promise<Withdrawal[]> {
    const col  = await this.col();
    const docs = await col.find({ userId, accountId }).sort({ date: -1 }).toArray();
    return docs.map(docToWithdrawal);
  }

  async create(data: Omit<Withdrawal, "id" | "createdAt">): Promise<Withdrawal> {
    const col = await this.col();
    const id  = randomUUID();
    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await col.insertOne({ _id: id, ...data, createdAt: now } as any);
    return { id, ...data, createdAt: now };
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const col    = await this.col();
    const result = await col.deleteOne({ _id: id, userId });
    return result.deletedCount > 0;
  }
}
