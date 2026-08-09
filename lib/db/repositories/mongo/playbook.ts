import { getDb } from "../../mongoConnection";
import type { Playbook, IPlaybookRepository } from "../../types";
import { randomUUID } from "crypto";

const DEFAULT_CONTENT = `# TradeLog — Playbook

## Core Methodology
**ICT Concepts — Smart Money / Institutional Order Flow**

## Primary Session
New York AM (9:30am–11:00am EST)

---

## Pre-Market Preparation

1. **Higher Timeframe Narrative** — Establish weekly/daily bias, premium or discount, draw on liquidity
2. **Opening Range Gap (ORG)** — Mark overnight range gap
3. **Relative Equal Highs and Lows** — Identify REH/REL formed prior to open as liquidity pools

---

## Entry Logic

- **Step 1:** Identify which side gets violated (buy-side or sell-side)
- **Step 2:** Identify Draw on Liquidity on the opposite side
- **Step 3:** Wait for price to deliver into a PD Array (FVG, Breaker Block, Order Block, Midnight Open, NDOG, ORG, Asian High/Low)
- **Step 4:** Execute on price action confirmation — no anticipation

---

## Pre-Trade Checklist

- [ ] HTF narrative established
- [ ] REH or REL identified pre-market
- [ ] One side violated?
- [ ] Draw on Liquidity identified on opposite side
- [ ] Price delivering into PD Array toward DOL?
- [ ] First 30 mins after open passed?
- [ ] Target named before entry?
- [ ] Am I entering because the setup is ready, or because I want it to be?

---

## Risk Framework

| Parameter | Rule |
|-----------|------|
| Lot size | 0.3 micros max (current) |
| Daily profit target | $100 |
| Risk per trade | ~$75 (25 handles at 0.3) |
| R:R minimum | 1:3 |
| Daily max drawdown | 4% — stop before hitting it |
| Max losses per day | 2 — session closed after 2nd SL |
| Max trading days/week | 3 |
| Friday trading | Prohibited (current rule) |

---

> **Personal Rule**
>
> *"Price will do its time so Prince don't FOMO"*
`;

export class MongoPlaybookRepository implements IPlaybookRepository {
  private async col() {
    const db = await getDb();
    return db.collection<{ _id: string } & Record<string, unknown>>("playbook");
  }

  async findByUser(userId: string): Promise<Playbook | null> {
    const col = await this.col();
    const doc = await col.findOne({ userId });
    return doc
      ? { id: doc._id as string, userId: doc.userId as string, content: doc.content as string, updatedAt: doc.updatedAt as Date }
      : null;
  }

  async upsert(userId: string, content: string): Promise<Playbook> {
    const col = await this.col();
    const now = new Date();
    await col.findOneAndUpdate(
      { userId },
      {
        $set:         { content, updatedAt: now },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $setOnInsert: { _id: randomUUID(), userId } as any,
      },
      { upsert: true }
    );
    return (await this.findByUser(userId))!;
  }

  async seed(userId: string): Promise<Playbook> {
    return this.upsert(userId, DEFAULT_CONTENT);
  }
}
