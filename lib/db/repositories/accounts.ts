import { query, queryOne, execute } from "../connection";
import type { Account, IAccountRepository } from "../types";
import { randomUUID } from "crypto";

function rowToAccount(row: Record<string, unknown>): Account {
  return {
    id:               row.id as string,
    userId:           row.user_id as string,
    name:             row.name as string,
    firm:             row.firm as string,
    assetClass:       row.asset_class as Account["assetClass"],
    startingBalance:  Number(row.starting_balance),
    currentBalance:   Number(row.current_balance),
    currency:         row.currency as string,
    status:           row.status as Account["status"],
    profitTarget:        Number(row.profit_target),
    maxDrawdownLimit:    Number(row.max_drawdown_limit),
    dailyDrawdownLimit:  Number(row.daily_drawdown_limit),
    phase:               row.phase as Account["phase"],
    createdAt:        row.created_at as Date,
    updatedAt:        row.updated_at as Date,
  };
}

export class MysqlAccountRepository implements IAccountRepository {
  async findAll(userId: string): Promise<Account[]> {
    const rows = await query<Record<string, unknown>>(
      "SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at ASC",
      [userId]
    );
    return rows.map(rowToAccount);
  }

  async findById(id: string, userId: string): Promise<Account | null> {
    const row = await queryOne<Record<string, unknown>>(
      "SELECT * FROM accounts WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return row ? rowToAccount(row) : null;
  }

  async create(data: Omit<Account, "id" | "createdAt" | "updatedAt">): Promise<Account> {
    const id = randomUUID();
    await execute(
      `INSERT INTO accounts (id, user_id, name, firm, asset_class, starting_balance, current_balance,
        currency, status, profit_target, max_drawdown_limit, daily_drawdown_limit, phase)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, data.userId, data.name, data.firm, data.assetClass,
        data.startingBalance, data.currentBalance, data.currency,
        data.status, data.profitTarget, data.maxDrawdownLimit, data.dailyDrawdownLimit, data.phase,
      ]
    );
    return (await this.findById(id, data.userId))!;
  }

  async update(id: string, userId: string, data: Partial<Account>): Promise<Account | null> {
    const fields: string[] = [];
    const params: unknown[] = [];
    const map: Record<string, string> = {
      name: "name", firm: "firm", assetClass: "asset_class",
      startingBalance: "starting_balance", currentBalance: "current_balance",
      currency: "currency", status: "status", profitTarget: "profit_target",
      maxDrawdownLimit: "max_drawdown_limit", dailyDrawdownLimit: "daily_drawdown_limit", phase: "phase",
    };
    for (const [key, col] of Object.entries(map)) {
      if (key in data) { fields.push(`${col} = ?`); params.push((data as Record<string, unknown>)[key]); }
    }
    if (!fields.length) return this.findById(id, userId);
    params.push(id, userId);
    await execute(`UPDATE accounts SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, params);
    return this.findById(id, userId);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const res = await execute("DELETE FROM accounts WHERE id = ? AND user_id = ?", [id, userId]);
    return res.affectedRows > 0;
  }
}
