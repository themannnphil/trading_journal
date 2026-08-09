-- Phil Trades Journal — MySQL Schema
-- Column names mirror the MongoDB document field names for easy migration

CREATE DATABASE IF NOT EXISTS phil_trades_journal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE phil_trades_journal;

CREATE TABLE IF NOT EXISTS users (
  id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  google_id   VARCHAR(255) NOT NULL UNIQUE,
  email       VARCHAR(255) NOT NULL UNIQUE,
  name        VARCHAR(255) NOT NULL,
  image       TEXT,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_google_id (google_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS accounts (
  id                VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  user_id           VARCHAR(36)   NOT NULL,
  name              VARCHAR(255)  NOT NULL,
  firm              VARCHAR(255)  NOT NULL,
  asset_class       ENUM('Forex','Indices','Futures') NOT NULL DEFAULT 'Futures',
  starting_balance  DECIMAL(12,2) NOT NULL DEFAULT 0,
  current_balance   DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency          VARCHAR(3)    NOT NULL DEFAULT 'USD',
  status            ENUM('Active','Blown','Passed','Live') NOT NULL DEFAULT 'Active',
  profit_target     DECIMAL(12,2) NOT NULL DEFAULT 0,
  max_drawdown_limit   DECIMAL(12,2) NOT NULL DEFAULT 0,
  daily_drawdown_limit DECIMAL(12,2) NOT NULL DEFAULT 0,
  phase             ENUM('Evaluation Phase 1','Evaluation Phase 2','Live') NOT NULL DEFAULT 'Evaluation Phase 1',
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS trades (
  id                  VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  user_id             VARCHAR(36)   NOT NULL,
  account_id          VARCHAR(36)   NOT NULL,
  trade_number        VARCHAR(20)   NOT NULL,
  date                DATE          NOT NULL,
  day                 ENUM('Monday','Tuesday','Wednesday','Thursday','Friday') NOT NULL,
  instrument          ENUM('G/U','E/U','S&P','Nasdaq','G/J','U/J','E/C','A/U','XAU/USD') NOT NULL,
  direction           ENUM('Long','Short') NOT NULL,
  session             ENUM('Asia','London','NY-am','NY-pm') NOT NULL,
  entry_price         VARCHAR(20)   NOT NULL DEFAULT '',
  stop_loss           VARCHAR(20)   NOT NULL DEFAULT '',
  take_profit         VARCHAR(20)   NOT NULL DEFAULT '',
  lot_size            VARCHAR(20)   NOT NULL DEFAULT '',
  planned_rr          VARCHAR(20)   NOT NULL DEFAULT '',
  actual_rr           VARCHAR(20)   NOT NULL DEFAULT '',
  result              ENUM('Win','Loss','BreakEven') NOT NULL DEFAULT 'Loss',
  pnl                 DECIMAL(12,2) NOT NULL DEFAULT 0,
  duration            VARCHAR(50)   NOT NULL DEFAULT '',
  market_condition    TEXT,
  setup_strategy      TEXT,
  execution_quality   TEXT,
  discipline_score    TINYINT       NOT NULL DEFAULT 3,
  emotions            TEXT,
  rule_violation      TEXT,
  improvement         TEXT,
  notes_reflection    TEXT,
  day_result          ENUM('Profitable','Loss','No Trade','Break Even') NOT NULL DEFAULT 'No Trade',
  tradingview_link    TEXT,
  commission_cost     DECIMAL(10,2) DEFAULT NULL,
  is_draft            TINYINT(1)    NOT NULL DEFAULT 0,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_user_date      (user_id, date),
  INDEX idx_account_date   (account_id, date),
  INDEX idx_user_result    (user_id, result)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS screenshots (
  id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  trade_id    VARCHAR(36)  DEFAULT NULL,
  journal_id  VARCHAR(36)  DEFAULT NULL,
  account_id  VARCHAR(36)  DEFAULT NULL,
  filename    VARCHAR(500) NOT NULL,
  label       VARCHAR(255) DEFAULT NULL,
  filepath    TEXT         DEFAULT NULL,
  url         TEXT         DEFAULT NULL,
  upload_date DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (trade_id)   REFERENCES trades(id)          ON DELETE CASCADE,
  FOREIGN KEY (journal_id) REFERENCES weekend_journal(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id)        ON DELETE CASCADE,
  INDEX idx_trade_id   (trade_id),
  INDEX idx_journal_id (journal_id),
  INDEX idx_account_id (account_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS playbook (
  id         VARCHAR(36) NOT NULL DEFAULT (UUID()),
  user_id    VARCHAR(36) NOT NULL UNIQUE,
  content    LONGTEXT    NOT NULL,
  updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS weekend_journal (
  id                VARCHAR(36) NOT NULL DEFAULT (UUID()),
  user_id           VARCHAR(36) NOT NULL,
  date              DATE        NOT NULL,
  type              ENUM('weekly_review','weekly_outlook') NOT NULL,
  -- Shared
  general_notes     TEXT,
  -- Weekly Review (Saturday)
  what_went_well    TEXT,
  what_went_wrong   TEXT,
  key_lessons       TEXT,
  emotions_week     TEXT,
  rule_violations   TEXT,
  best_trade        TEXT,
  worst_trade       TEXT,
  discipline_score  TINYINT,
  week_rating       TINYINT,
  improvements      TEXT,
  -- Weekly Outlook (Sunday)
  market_bias       TEXT,
  key_events        TEXT,
  instruments_focus TEXT,
  key_levels        TEXT,
  trading_plan      TEXT,
  mental_prep       TEXT,
  week_goals        TEXT,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_date_type (user_id, date, type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS daily_summary (
  id          VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  user_id     VARCHAR(36)   NOT NULL,
  account_id  VARCHAR(36)   NOT NULL,
  date        DATE          NOT NULL,
  net_pnl     DECIMAL(12,2) NOT NULL DEFAULT 0,
  trade_count INT           NOT NULL DEFAULT 0,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_account_date (user_id, account_id, date),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_user_month (user_id, date)
) ENGINE=InnoDB;
