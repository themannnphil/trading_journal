import { query, queryOne, execute } from "../connection";
import type { Trade, ITradeRepository, TradeFilters } from "../types";
import { randomUUID } from "crypto";

function rowToTrade(row: Record<string, unknown>): Trade {
  return {
    id:               row.id as string,
    userId:           row.user_id as string,
    accountId:        row.account_id as string,
    tradeNumber:      row.trade_number as string,
    date:             row.date as Date,
    day:              row.day as Trade["day"],
    instrument:       row.instrument as Trade["instrument"],
    direction:        row.direction as Trade["direction"],
    session:          row.session as Trade["session"],
    entryPrice:       row.entry_price as string,
    stopLoss:         row.stop_loss as string,
    takeProfit:       row.take_profit as string,
    lotSize:          row.lot_size as string,
    plannedRR:        row.planned_rr as string,
    actualRR:         row.actual_rr as string,
    result:           row.result as Trade["result"],
    pnl:              Number(row.pnl),
    duration:         row.duration as string,
    marketCondition:  row.market_condition as string,
    setupStrategy:    row.setup_strategy as string,
    executionQuality: row.execution_quality as string,
    disciplineScore:  Number(row.discipline_score),
    emotions:         row.emotions as string,
    ruleViolation:    row.rule_violation as string,
    improvement:      row.improvement as string,
    notesReflection:  row.notes_reflection as string,
    dayResult:        row.day_result as Trade["dayResult"],
    tradingviewLink:  row.tradingview_link as string | undefined,
    commissionCost:   row.commission_cost != null ? Number(row.commission_cost) : null,
    isDraft:          Boolean(row.is_draft),
    createdAt:        row.created_at as Date,
    updatedAt:        row.updated_at as Date,
  };
}

export class MysqlTradeRepository implements ITradeRepository {
  async findAll(userId: string, filters?: TradeFilters): Promise<Trade[]> {
    const conditions = ["t.user_id = ?"];
    const params: unknown[] = [userId];

    if (filters?.accountId) { conditions.push("t.account_id = ?"); params.push(filters.accountId); }
    if (filters?.instrument) { conditions.push("t.instrument = ?"); params.push(filters.instrument); }
    if (filters?.result)     { conditions.push("t.result = ?");     params.push(filters.result); }
    if (filters?.session)    { conditions.push("t.session = ?");    params.push(filters.session); }
    if (filters?.day)        { conditions.push("t.day = ?");        params.push(filters.day); }
    if (filters?.dateFrom)   { conditions.push("t.date >= ?");      params.push(filters.dateFrom); }
    if (filters?.dateTo)     { conditions.push("t.date <= ?");      params.push(filters.dateTo); }
    if (filters?.search) {
      conditions.push("(t.trade_number LIKE ? OR t.setup_strategy LIKE ? OR t.notes_reflection LIKE ?)");
      const like = `%${filters.search}%`;
      params.push(like, like, like);
    }

    const sql = `
      SELECT t.* FROM trades t
      WHERE ${conditions.join(" AND ")}
      ORDER BY t.date DESC, t.created_at DESC
    `;
    const rows = await query<Record<string, unknown>>(sql, params);
    return rows.map(rowToTrade);
  }

  async findById(id: string, userId: string): Promise<Trade | null> {
    const row = await queryOne<Record<string, unknown>>(
      "SELECT * FROM trades WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return row ? rowToTrade(row) : null;
  }

  async create(data: Omit<Trade, "id" | "createdAt" | "updatedAt">): Promise<Trade> {
    const id = randomUUID();
    await execute(
      `INSERT INTO trades (id, user_id, account_id, trade_number, date, day, instrument, direction,
        session, entry_price, stop_loss, take_profit, lot_size, planned_rr, actual_rr, result,
        pnl, duration, market_condition, setup_strategy, execution_quality, discipline_score,
        emotions, rule_violation, improvement, notes_reflection, day_result, tradingview_link,
        commission_cost, is_draft)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, data.userId, data.accountId, data.tradeNumber, data.date, data.day,
        data.instrument, data.direction, data.session, data.entryPrice, data.stopLoss,
        data.takeProfit, data.lotSize, data.plannedRR, data.actualRR, data.result,
        data.pnl, data.duration, data.marketCondition, data.setupStrategy,
        data.executionQuality, data.disciplineScore, data.emotions, data.ruleViolation,
        data.improvement, data.notesReflection, data.dayResult,
        data.tradingviewLink ?? null, data.commissionCost ?? null, data.isDraft ? 1 : 0,
      ]
    );
    return (await this.findById(id, data.userId))!;
  }

  async update(id: string, userId: string, data: Partial<Trade>): Promise<Trade | null> {
    const fields: string[] = [];
    const params: unknown[] = [];

    const map: Record<string, string> = {
      accountId: "account_id", tradeNumber: "trade_number", date: "date", day: "day",
      instrument: "instrument", direction: "direction", session: "session",
      entryPrice: "entry_price", stopLoss: "stop_loss", takeProfit: "take_profit",
      lotSize: "lot_size", plannedRR: "planned_rr", actualRR: "actual_rr",
      result: "result", pnl: "pnl", duration: "duration",
      marketCondition: "market_condition", setupStrategy: "setup_strategy",
      executionQuality: "execution_quality", disciplineScore: "discipline_score",
      emotions: "emotions", ruleViolation: "rule_violation", improvement: "improvement",
      notesReflection: "notes_reflection", dayResult: "day_result",
      tradingviewLink: "tradingview_link", commissionCost: "commission_cost", isDraft: "is_draft",
    };

    for (const [key, col] of Object.entries(map)) {
      if (key in data) {
        fields.push(`${col} = ?`);
        const val = (data as Record<string, unknown>)[key];
        params.push(key === "isDraft" ? (val ? 1 : 0) : val);
      }
    }

    if (!fields.length) return this.findById(id, userId);

    params.push(id, userId);
    await execute(`UPDATE trades SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, params);
    return this.findById(id, userId);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const res = await execute("DELETE FROM trades WHERE id = ? AND user_id = ?", [id, userId]);
    return res.affectedRows > 0;
  }

  async countByMonth(userId: string, accountId: string, year: number, month: number): Promise<number> {
    const rows = await query<{ count: number }>(
      "SELECT COUNT(*) as count FROM trades WHERE user_id = ? AND account_id = ? AND YEAR(date) = ? AND MONTH(date) = ? AND is_draft = 0",
      [userId, accountId, year, month]
    );
    return rows[0]?.count ?? 0;
  }
}
