import { getDb } from "../../mongoConnection";
import type { WeekendJournal, WeekendJournalType } from "../../types";
import { randomUUID } from "crypto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToJournal(doc: any): WeekendJournal {
  return {
    id:               doc._id,
    userId:           doc.userId,
    date:             doc.date,
    type:             doc.type,
    generalNotes:     doc.generalNotes     ?? "",
    whatWentWell:     doc.whatWentWell     ?? "",
    whatWentWrong:    doc.whatWentWrong    ?? "",
    keyLessons:       doc.keyLessons       ?? "",
    emotionsWeek:     doc.emotionsWeek     ?? "",
    ruleViolations:   doc.ruleViolations   ?? "",
    bestTrade:        doc.bestTrade        ?? "",
    worstTrade:       doc.worstTrade       ?? "",
    disciplineScore:  doc.disciplineScore  ?? null,
    weekRating:       doc.weekRating       ?? null,
    improvements:     doc.improvements     ?? "",
    marketBias:       doc.marketBias       ?? "",
    keyEvents:        doc.keyEvents        ?? "",
    instrumentsFocus: doc.instrumentsFocus ?? "",
    keyLevels:        doc.keyLevels        ?? "",
    tradingPlan:      doc.tradingPlan      ?? "",
    mentalPrep:       doc.mentalPrep       ?? "",
    weekGoals:        doc.weekGoals        ?? "",
    createdAt:        doc.createdAt,
    updatedAt:        doc.updatedAt,
  };
}

export class MongoWeekendJournalRepository {
  private async col() {
    const db = await getDb();
    return db.collection("weekend_journal");
  }

  async findByMonth(userId: string, year: number, month: number): Promise<WeekendJournal[]> {
    const col   = await this.col();
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 1);
    const docs  = await col.find({ userId, date: { $gte: start, $lt: end } }).sort({ date: 1 }).toArray();
    return docs.map(docToJournal);
  }

  async upsert(userId: string, date: string, type: WeekendJournalType, data: Partial<WeekendJournal>): Promise<WeekendJournal> {
    const col     = await this.col();
    const dateObj = new Date(date);
    const now     = new Date();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, createdAt: _ca, updatedAt: _ua, userId: _ui, date: _d, type: _t, ...fields } = data as Record<string, unknown>;
    await col.findOneAndUpdate(
      { userId, date: dateObj, type },
      {
        $set:         { ...fields, updatedAt: now },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $setOnInsert: { _id: randomUUID(), userId, date: dateObj, type, createdAt: now } as any,
      },
      { upsert: true }
    );
    const doc = await col.findOne({ userId, date: dateObj, type });
    return docToJournal(doc!);
  }

  async delete(id: string, userId: string): Promise<void> {
    const col = await this.col();
    await col.deleteOne({ _id: id, userId });
  }
}
