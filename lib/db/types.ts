// Shared domain types — identical shape whether backed by MySQL or MongoDB

export type AssetClass = "Forex" | "Indices" | "Futures";
export type AccountStatus = "Active" | "Blown" | "Passed" | "Live";
export type AccountPhase = "Evaluation Phase 1" | "Evaluation Phase 2" | "Live";
export type TradeDirection = "Long" | "Short";
export type TradeSession = "Asia" | "London" | "NY-am" | "NY-pm";
export type TradeResult = "Win" | "Loss" | "BreakEven";
export type TradeDay = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
export type DayResult = "Profitable" | "Loss" | "No Trade" | "Break Even";
export type TradeInstrument = "G/U" | "E/U" | "S&P" | "Nasdaq" | "G/J" | "U/J" | "E/C" | "A/U" | "XAU/USD";

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  firm: string;
  assetClass: AssetClass;
  startingBalance: number;
  currentBalance: number;
  currency: string;
  status: AccountStatus;
  profitTarget: number;
  maxDrawdownLimit: number;
  dailyDrawdownLimit: number;
  phase: AccountPhase;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trade {
  id: string;
  userId: string;
  accountId: string;
  tradeNumber: string;
  date: Date;
  day: TradeDay;
  instrument: TradeInstrument;
  direction: TradeDirection;
  session: TradeSession;
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  lotSize: string;
  plannedRR: string;
  actualRR: string;
  result: TradeResult;
  pnl: number;
  duration: string;
  marketCondition: string;
  setupStrategy: string;
  executionQuality: string;
  disciplineScore: number;
  emotions: string;
  ruleViolation: string;
  improvement: string;
  notesReflection: string;
  dayResult: DayResult;
  tradingviewLink?: string;
  commissionCost?: number | null;
  isDraft: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Screenshot {
  id: string;
  tradeId?: string | null;
  journalId?: string | null;
  accountId?: string | null;
  filename: string;
  label?: string | null;
  filepath?: string | null;
  url?: string | null;
  uploadDate: Date;
}

export interface Playbook {
  id: string;
  userId: string;
  content: string;
  updatedAt: Date;
}

export type WeekendJournalType = "weekly_review" | "weekly_outlook";

export interface WeekendJournal {
  id: string;
  userId: string;
  date: Date;
  type: WeekendJournalType;
  // Shared
  generalNotes: string;
  // Weekly Review (Saturday)
  whatWentWell: string;
  whatWentWrong: string;
  keyLessons: string;
  emotionsWeek: string;
  ruleViolations: string;
  bestTrade: string;
  worstTrade: string;
  disciplineScore: number | null;
  weekRating: number | null;
  improvements: string;
  // Weekly Outlook (Sunday)
  marketBias: string;
  keyEvents: string;
  instrumentsFocus: string;
  keyLevels: string;
  tradingPlan: string;
  mentalPrep: string;
  weekGoals: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailySummary {
  id: string;
  userId: string;
  accountId: string;
  date: Date;
  netPnl: number;
  tradeCount: number;
  updatedAt: Date;
}

// Repository interfaces — swap the implementation to migrate to MongoDB
export interface ITradeRepository {
  findAll(userId: string, filters?: TradeFilters): Promise<Trade[]>;
  findById(id: string, userId: string): Promise<Trade | null>;
  create(data: Omit<Trade, "id" | "createdAt" | "updatedAt">): Promise<Trade>;
  update(id: string, userId: string, data: Partial<Trade>): Promise<Trade | null>;
  delete(id: string, userId: string): Promise<boolean>;
  countByMonth(userId: string, accountId: string, year: number, month: number): Promise<number>;
}

export interface IAccountRepository {
  findAll(userId: string): Promise<Account[]>;
  findById(id: string, userId: string): Promise<Account | null>;
  create(data: Omit<Account, "id" | "createdAt" | "updatedAt">): Promise<Account>;
  update(id: string, userId: string, data: Partial<Account>): Promise<Account | null>;
  delete(id: string, userId: string): Promise<boolean>;
}

export interface IDailySummaryRepository {
  findByMonth(userId: string, year: number, month: number): Promise<DailySummary[]>;
  upsert(data: Omit<DailySummary, "id" | "updatedAt">): Promise<DailySummary>;
}

export interface IPlaybookRepository {
  findByUser(userId: string): Promise<Playbook | null>;
  upsert(userId: string, content: string): Promise<Playbook>;
}

export interface Withdrawal {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  date: Date;
  notes: string | null;
  createdAt: Date;
}

export interface IWithdrawalRepository {
  findAll(userId: string): Promise<Withdrawal[]>;
  findByAccount(userId: string, accountId: string): Promise<Withdrawal[]>;
  create(data: Omit<Withdrawal, "id" | "createdAt">): Promise<Withdrawal>;
  delete(id: string, userId: string): Promise<boolean>;
}

export interface TradeFilters {
  accountId?: string;
  instrument?: TradeInstrument;
  result?: TradeResult;
  session?: TradeSession;
  day?: TradeDay;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}
