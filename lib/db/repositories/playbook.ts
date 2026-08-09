import { queryOne, execute } from "../connection";
import type { Playbook, IPlaybookRepository } from "../types";
import { randomUUID } from "crypto";

const DEFAULT_CONTENT = `# Phil Trades Journal — Playbook

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

export class MysqlPlaybookRepository implements IPlaybookRepository {
  async findByUser(userId: string): Promise<Playbook | null> {
    const row = await queryOne<Record<string, unknown>>(
      "SELECT * FROM playbook WHERE user_id = ?",
      [userId]
    );
    return row
      ? { id: row.id as string, userId: row.user_id as string, content: row.content as string, updatedAt: row.updated_at as Date }
      : null;
  }

  async upsert(userId: string, content: string): Promise<Playbook> {
    const id = randomUUID();
    await execute(
      `INSERT INTO playbook (id, user_id, content) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE content = VALUES(content)`,
      [id, userId, content]
    );
    return (await this.findByUser(userId))!;
  }

  async seed(userId: string): Promise<Playbook> {
    return this.upsert(userId, DEFAULT_CONTENT);
  }
}
