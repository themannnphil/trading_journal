import { getDb } from "../../mongoConnection";
import { randomUUID } from "crypto";

export type ScreenshotDoc = {
  _id: string;
  tradeId:   string | null;
  journalId: string | null;
  accountId: string | null;
  filename:  string;
  label:     string | null;
  filepath:  string | null;
  url:       string | null;
  uploadDate: Date;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToRow(doc: any): ScreenshotDoc {
  return {
    _id:        doc._id,
    tradeId:    doc.tradeId   ?? null,
    journalId:  doc.journalId ?? null,
    accountId:  doc.accountId ?? null,
    filename:   doc.filename,
    label:      doc.label     ?? null,
    filepath:   doc.filepath  ?? null,
    url:        doc.url       ?? null,
    uploadDate: doc.uploadDate,
  };
}

export class MongoScreenshotRepository {
  private async col() {
    const db = await getDb();
    return db.collection("screenshots");
  }

  async insert(data: Omit<ScreenshotDoc, "_id">): Promise<ScreenshotDoc> {
    const col = await this.col();
    const _id = randomUUID();
    const doc = { _id, ...data };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await col.insertOne(doc as any);
    return docToRow(doc);
  }

  async findById(id: string): Promise<ScreenshotDoc | null> {
    const col = await this.col();
    const doc = await col.findOne({ _id: id });
    return doc ? docToRow(doc) : null;
  }

  async findByField(field: "tradeId" | "journalId" | "accountId", value: string): Promise<ScreenshotDoc[]> {
    const col  = await this.col();
    const docs = await col.find({ [field]: value }).sort({ uploadDate: -1 }).toArray();
    return docs.map(docToRow);
  }

  async delete(id: string): Promise<void> {
    const col = await this.col();
    await col.deleteOne({ _id: id });
  }
}
