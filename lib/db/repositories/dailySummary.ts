import { query, execute } from "../connection";
import type { DailySummary, IDailySummaryRepository } from "../types";
import { randomUUID } from "crypto";

function rowToSummary(row: Record<string, unknown>): DailySummary {
  return {
    id:         row.id as string,
    userId:     row.user_id as string,
    accountId:  row.account_id as string,
    date:       row.date as Date,
    netPnl:     Number(row.net_pnl),
    tradeCount: Number(row.trade_count),
    updatedAt:  row.updated_at as Date,
  };
}

export class MysqlDailySummaryRepository implements IDailySummaryRepository {
  async findByMonth(userId: string, year: number, month: number): Promise<DailySummary[]> {
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM daily_summary
       WHERE user_id = ? AND YEAR(date) = ? AND MONTH(date) = ?
       ORDER BY date ASC`,
      [userId, year, month]
    );
    return rows.map(rowToSummary);
  }

  async upsert(data: Omit<DailySummary, "id" | "updatedAt">): Promise<DailySummary> {
    const id = randomUUID();
    await execute(
      `INSERT INTO daily_summary (id, user_id, account_id, date, net_pnl, trade_count)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE net_pnl = VALUES(net_pnl), trade_count = VALUES(trade_count)`,
      [id, data.userId, data.accountId, data.date, data.netPnl, data.tradeCount]
    );
    const rows = await query<Record<string, unknown>>(
      "SELECT * FROM daily_summary WHERE user_id = ? AND account_id = ? AND date = ?",
      [data.userId, data.accountId, data.date]
    );
    return rowToSummary(rows[0]);
  }
}
