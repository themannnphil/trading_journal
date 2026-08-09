// Factory — picks MongoDB or MySQL based on MONGODB_URI.
// Both connections are lazy so importing both at module level is safe.
import type { IAccountRepository, ITradeRepository, IDailySummaryRepository, IPlaybookRepository } from "./types";
import type { MongoWeekendJournalRepository } from "./repositories/mongo/weekendJournal";
import type { MysqlWeekendJournalRepository } from "./repositories/weekendJournal";

import { MongoAccountRepository }        from "./repositories/mongo/accounts";
import { MongoTradeRepository }          from "./repositories/mongo/trades";
import { MongoDailySummaryRepository }   from "./repositories/mongo/dailySummary";
import { MongoPlaybookRepository }       from "./repositories/mongo/playbook";
import { MongoWeekendJournalRepository as _MongoWJ } from "./repositories/mongo/weekendJournal";

import { MysqlAccountRepository }        from "./repositories/accounts";
import { MysqlTradeRepository }          from "./repositories/trades";
import { MysqlDailySummaryRepository }   from "./repositories/dailySummary";
import { MysqlPlaybookRepository }       from "./repositories/playbook";
import { MysqlWeekendJournalRepository as _MysqlWJ } from "./repositories/weekendJournal";

function isMongo() { return !!process.env.MONGODB_URI; }

export function getAccountRepo(): IAccountRepository {
  return isMongo() ? new MongoAccountRepository() : new MysqlAccountRepository();
}
export function getTradeRepo(): ITradeRepository {
  return isMongo() ? new MongoTradeRepository() : new MysqlTradeRepository();
}
export function getDailySummaryRepo(): IDailySummaryRepository {
  return isMongo() ? new MongoDailySummaryRepository() : new MysqlDailySummaryRepository();
}
export function getPlaybookRepo(): IPlaybookRepository {
  return isMongo() ? new MongoPlaybookRepository() : new MysqlPlaybookRepository();
}
export function getWeekendJournalRepo(): MongoWeekendJournalRepository | MysqlWeekendJournalRepository {
  return isMongo() ? new _MongoWJ() : new _MysqlWJ();
}
