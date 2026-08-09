import { query, execute } from "../connection";
import type { Withdrawal, IWithdrawalRepository } from "../types";
import { randomUUID } from "crypto";

function rowToWithdrawal(row: Record<string, unknown>): Withdrawal {
  return {
    id:        row.id as string,
    userId:    row.user_id as string,
    accountId: row.account_id as string,
    amount:    Number(row.amount),
    date:      row.date as Date,
    notes:     (row.notes as string | null) ?? null,
    createdAt: row.created_at as Date,
  };
}

export class MysqlWithdrawalRepository implements IWithdrawalRepository {
  async findAll(userId: string): Promise<Withdrawal[]> {
    const rows = await query<Record<string, unknown>>(
      "SELECT * FROM withdrawals WHERE user_id = ? ORDER BY date DESC",
      [userId]
    );
    return rows.map(rowToWithdrawal);
  }

  async findByAccount(userId: string, accountId: string): Promise<Withdrawal[]> {
    const rows = await query<Record<string, unknown>>(
      "SELECT * FROM withdrawals WHERE user_id = ? AND account_id = ? ORDER BY date DESC",
      [userId, accountId]
    );
    return rows.map(rowToWithdrawal);
  }

  async create(data: Omit<Withdrawal, "id" | "createdAt">): Promise<Withdrawal> {
    const id  = randomUUID();
    const now = new Date();
    await execute(
      "INSERT INTO withdrawals (id, user_id, account_id, amount, date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, data.userId, data.accountId, data.amount, data.date, data.notes, now]
    );
    return { id, ...data, createdAt: now };
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await execute(
      "DELETE FROM withdrawals WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return result.affectedRows > 0;
  }
}
