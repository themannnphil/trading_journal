import { query, execute } from "../connection";
import type { WeekendJournal, WeekendJournalType } from "../types";
import { randomUUID } from "crypto";

function rowToJournal(row: Record<string, unknown>): WeekendJournal {
  return {
    id:               row.id as string,
    userId:           row.user_id as string,
    date:             row.date as Date,
    type:             row.type as WeekendJournalType,
    generalNotes:     (row.general_notes as string) ?? "",
    whatWentWell:     (row.what_went_well as string) ?? "",
    whatWentWrong:    (row.what_went_wrong as string) ?? "",
    keyLessons:       (row.key_lessons as string) ?? "",
    emotionsWeek:     (row.emotions_week as string) ?? "",
    ruleViolations:   (row.rule_violations as string) ?? "",
    bestTrade:        (row.best_trade as string) ?? "",
    worstTrade:       (row.worst_trade as string) ?? "",
    disciplineScore:  row.discipline_score != null ? Number(row.discipline_score) : null,
    weekRating:       row.week_rating != null ? Number(row.week_rating) : null,
    improvements:     (row.improvements as string) ?? "",
    marketBias:       (row.market_bias as string) ?? "",
    keyEvents:        (row.key_events as string) ?? "",
    instrumentsFocus: (row.instruments_focus as string) ?? "",
    keyLevels:        (row.key_levels as string) ?? "",
    tradingPlan:      (row.trading_plan as string) ?? "",
    mentalPrep:       (row.mental_prep as string) ?? "",
    weekGoals:        (row.week_goals as string) ?? "",
    createdAt:        row.created_at as Date,
    updatedAt:        row.updated_at as Date,
  };
}

export class MysqlWeekendJournalRepository {
  async findByMonth(userId: string, year: number, month: number): Promise<WeekendJournal[]> {
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM weekend_journal
       WHERE user_id = ? AND YEAR(date) = ? AND MONTH(date) = ?
       ORDER BY date ASC`,
      [userId, year, month]
    );
    return rows.map(rowToJournal);
  }

  async upsert(userId: string, date: string, type: WeekendJournalType, data: Partial<WeekendJournal>): Promise<WeekendJournal> {
    const id = randomUUID();
    await execute(
      `INSERT INTO weekend_journal (
        id, user_id, date, type,
        general_notes, what_went_well, what_went_wrong, key_lessons,
        emotions_week, rule_violations, best_trade, worst_trade,
        discipline_score, week_rating, improvements,
        market_bias, key_events, instruments_focus, key_levels,
        trading_plan, mental_prep, week_goals
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        general_notes     = VALUES(general_notes),
        what_went_well    = VALUES(what_went_well),
        what_went_wrong   = VALUES(what_went_wrong),
        key_lessons       = VALUES(key_lessons),
        emotions_week     = VALUES(emotions_week),
        rule_violations   = VALUES(rule_violations),
        best_trade        = VALUES(best_trade),
        worst_trade       = VALUES(worst_trade),
        discipline_score  = VALUES(discipline_score),
        week_rating       = VALUES(week_rating),
        improvements      = VALUES(improvements),
        market_bias       = VALUES(market_bias),
        key_events        = VALUES(key_events),
        instruments_focus = VALUES(instruments_focus),
        key_levels        = VALUES(key_levels),
        trading_plan      = VALUES(trading_plan),
        mental_prep       = VALUES(mental_prep),
        week_goals        = VALUES(week_goals)`,
      [
        id, userId, date, type,
        data.generalNotes ?? null,
        data.whatWentWell ?? null,
        data.whatWentWrong ?? null,
        data.keyLessons ?? null,
        data.emotionsWeek ?? null,
        data.ruleViolations ?? null,
        data.bestTrade ?? null,
        data.worstTrade ?? null,
        data.disciplineScore ?? null,
        data.weekRating ?? null,
        data.improvements ?? null,
        data.marketBias ?? null,
        data.keyEvents ?? null,
        data.instrumentsFocus ?? null,
        data.keyLevels ?? null,
        data.tradingPlan ?? null,
        data.mentalPrep ?? null,
        data.weekGoals ?? null,
      ]
    );
    const rows = await query<Record<string, unknown>>(
      "SELECT * FROM weekend_journal WHERE user_id = ? AND date = ? AND type = ?",
      [userId, date, type]
    );
    return rowToJournal(rows[0]);
  }

  async delete(id: string, userId: string): Promise<void> {
    await execute("DELETE FROM weekend_journal WHERE id = ? AND user_id = ?", [id, userId]);
  }
}
