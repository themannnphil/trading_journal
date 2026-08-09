/**
 * One-time migration: MySQL → MongoDB Atlas
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." node scripts/migrate-to-mongo.mjs
 *
 * Keep DB_HOST / DB_USER / DB_PASSWORD set (your local MySQL) while running this.
 */

import mysql from "mysql2/promise";
import { MongoClient } from "mongodb";

const MYSQL = {
  host:     process.env.DB_HOST     || "localhost",
  port:     parseInt(process.env.DB_PORT || "3306"),
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "phil_trades_journal",
  timezone: "Z",
};

const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB  = process.env.MONGODB_DB  || "phil_trades_journal";

if (!MONGO_URI) { console.error("❌  MONGODB_URI is not set"); process.exit(1); }

async function main() {
  console.log("🔌  Connecting to MySQL...");
  const mysql_conn = await mysql.createConnection(MYSQL);

  console.log("🔌  Connecting to MongoDB...");
  const mongo = new MongoClient(MONGO_URI);
  await mongo.connect();
  const db = mongo.db(MONGO_DB);

  // ── Users ───────────────────────────────────────────────────────────
  console.log("\n👤  Migrating users...");
  const [users] = await mysql_conn.execute("SELECT * FROM users");
  if (users.length) {
    const col = db.collection("users");
    for (const row of users) {
      await col.updateOne(
        { _id: row.id },
        { $set: { _id: row.id, googleId: row.google_id, email: row.email, name: row.name, image: row.image ?? "", createdAt: row.created_at, updatedAt: row.updated_at } },
        { upsert: true }
      );
    }
    console.log(`   ✅  ${users.length} users`);
  }

  // ── Accounts ────────────────────────────────────────────────────────
  console.log("\n💳  Migrating accounts...");
  const [accounts] = await mysql_conn.execute("SELECT * FROM accounts");
  if (accounts.length) {
    const col = db.collection("accounts");
    for (const row of accounts) {
      await col.updateOne(
        { _id: row.id },
        { $set: {
          _id:                row.id,
          userId:             row.user_id,
          name:               row.name,
          firm:               row.firm,
          assetClass:         row.asset_class,
          startingBalance:    parseFloat(row.starting_balance),
          currentBalance:     parseFloat(row.current_balance),
          currency:           row.currency,
          status:             row.status,
          profitTarget:       parseFloat(row.profit_target),
          maxDrawdownLimit:   parseFloat(row.max_drawdown_limit),
          dailyDrawdownLimit: parseFloat(row.daily_drawdown_limit ?? 0),
          phase:              row.phase,
          createdAt:          row.created_at,
          updatedAt:          row.updated_at,
        }},
        { upsert: true }
      );
    }
    console.log(`   ✅  ${accounts.length} accounts`);
  }

  // ── Trades ──────────────────────────────────────────────────────────
  console.log("\n📈  Migrating trades...");
  const [trades] = await mysql_conn.execute("SELECT * FROM trades");
  if (trades.length) {
    const col = db.collection("trades");
    for (const row of trades) {
      await col.updateOne(
        { _id: row.id },
        { $set: {
          _id:              row.id,
          userId:           row.user_id,
          accountId:        row.account_id,
          tradeNumber:      row.trade_number,
          date:             row.date,
          day:              row.day,
          instrument:       row.instrument,
          direction:        row.direction,
          session:          row.session,
          entryPrice:       row.entry_price,
          stopLoss:         row.stop_loss,
          takeProfit:       row.take_profit,
          lotSize:          row.lot_size,
          plannedRR:        row.planned_rr,
          actualRR:         row.actual_rr,
          result:           row.result,
          pnl:              parseFloat(row.pnl),
          duration:         row.duration,
          marketCondition:  row.market_condition,
          setupStrategy:    row.setup_strategy,
          executionQuality: row.execution_quality,
          disciplineScore:  Number(row.discipline_score),
          emotions:         row.emotions,
          ruleViolation:    row.rule_violation,
          improvement:      row.improvement,
          notesReflection:  row.notes_reflection,
          dayResult:        row.day_result,
          tradingviewLink:  row.tradingview_link ?? null,
          commissionCost:   row.commission_cost != null ? parseFloat(row.commission_cost) : null,
          isDraft:          Boolean(row.is_draft),
          createdAt:        row.created_at,
          updatedAt:        row.updated_at,
        }},
        { upsert: true }
      );
    }
    console.log(`   ✅  ${trades.length} trades`);
  }

  // ── Daily Summary ───────────────────────────────────────────────────
  console.log("\n📅  Migrating daily summaries...");
  const [summaries] = await mysql_conn.execute("SELECT * FROM daily_summary");
  if (summaries.length) {
    const col = db.collection("daily_summary");
    for (const row of summaries) {
      await col.updateOne(
        { _id: row.id },
        { $set: { _id: row.id, userId: row.user_id, accountId: row.account_id, date: row.date, netPnl: parseFloat(row.net_pnl), tradeCount: Number(row.trade_count), updatedAt: row.updated_at } },
        { upsert: true }
      );
    }
    console.log(`   ✅  ${summaries.length} daily summaries`);
  }

  // ── Playbook ─────────────────────────────────────────────────────────
  console.log("\n📖  Migrating playbook...");
  const [playbooks] = await mysql_conn.execute("SELECT * FROM playbook");
  if (playbooks.length) {
    const col = db.collection("playbook");
    for (const row of playbooks) {
      await col.updateOne(
        { _id: row.id },
        { $set: { _id: row.id, userId: row.user_id, content: row.content, updatedAt: row.updated_at } },
        { upsert: true }
      );
    }
    console.log(`   ✅  ${playbooks.length} playbook entries`);
  }

  // ── Weekend Journal ──────────────────────────────────────────────────
  console.log("\n📓  Migrating weekend journals...");
  const [journals] = await mysql_conn.execute("SELECT * FROM weekend_journal");
  if (journals.length) {
    const col = db.collection("weekend_journal");
    for (const row of journals) {
      await col.updateOne(
        { _id: row.id },
        { $set: {
          _id:              row.id,
          userId:           row.user_id,
          date:             row.date,
          type:             row.type,
          generalNotes:     row.general_notes     ?? "",
          whatWentWell:     row.what_went_well     ?? "",
          whatWentWrong:    row.what_went_wrong    ?? "",
          keyLessons:       row.key_lessons        ?? "",
          emotionsWeek:     row.emotions_week      ?? "",
          ruleViolations:   row.rule_violations    ?? "",
          bestTrade:        row.best_trade         ?? "",
          worstTrade:       row.worst_trade        ?? "",
          disciplineScore:  row.discipline_score != null ? Number(row.discipline_score) : null,
          weekRating:       row.week_rating != null ? Number(row.week_rating) : null,
          improvements:     row.improvements       ?? "",
          marketBias:       row.market_bias        ?? "",
          keyEvents:        row.key_events         ?? "",
          instrumentsFocus: row.instruments_focus  ?? "",
          keyLevels:        row.key_levels         ?? "",
          tradingPlan:      row.trading_plan       ?? "",
          mentalPrep:       row.mental_prep        ?? "",
          weekGoals:        row.week_goals         ?? "",
          createdAt:        row.created_at,
          updatedAt:        row.updated_at,
        }},
        { upsert: true }
      );
    }
    console.log(`   ✅  ${journals.length} weekend journals`);
  }

  // ── Screenshots (URL-based only — local files can't be migrated) ─────
  console.log("\n🖼️   Migrating screenshots with URLs...");
  const [screenshots] = await mysql_conn.execute("SELECT * FROM screenshots WHERE url IS NOT NULL");
  if (screenshots.length) {
    const col = db.collection("screenshots");
    for (const row of screenshots) {
      await col.updateOne(
        { _id: row.id },
        { $set: { _id: row.id, tradeId: row.trade_id ?? null, journalId: row.journal_id ?? null, accountId: row.account_id ?? null, filename: row.filename, label: row.label ?? null, filepath: null, url: row.url, uploadDate: row.upload_date } },
        { upsert: true }
      );
    }
    console.log(`   ✅  ${screenshots.length} screenshots (URL-based)`);
  }

  const [localScreenshots] = await mysql_conn.execute("SELECT COUNT(*) as count FROM screenshots WHERE url IS NULL");
  const localCount = localScreenshots[0].count;
  if (localCount > 0) {
    console.log(`   ⚠️   ${localCount} screenshots stored as local files — upload them to Cloudinary manually`);
  }

  await mysql_conn.end();
  await mongo.close();
  console.log("\n🎉  Migration complete!");
}

main().catch(e => { console.error(e); process.exit(1); });
