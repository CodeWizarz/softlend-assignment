CREATE TABLE IF NOT EXISTS customers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  mobile          TEXT NOT NULL UNIQUE,
  pan             TEXT NOT NULL,
  cibil_score     INTEGER DEFAULT NULL,
  score_fetched_at TEXT DEFAULT NULL,
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS credit_gaps (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id           INTEGER NOT NULL,
  factor                TEXT NOT NULL,
  current_value         TEXT NOT NULL,
  ideal_value           TEXT NOT NULL,
  impact                TEXT NOT NULL CHECK(impact IN ('high','medium','low')),
  estimated_score_gain  INTEGER NOT NULL,
  action_description    TEXT NOT NULL,
  status                TEXT DEFAULT 'open' CHECK(status IN ('open','resolved')),
  resolved_at           TEXT DEFAULT NULL,
  created_at            TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS offers (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id         INTEGER NOT NULL,
  lender              TEXT NOT NULL,
  amount              REAL NOT NULL,
  interest_rate       REAL NOT NULL,
  tenure_months       INTEGER NOT NULL,
  min_score_required  INTEGER NOT NULL DEFAULT 650,
  status              TEXT DEFAULT 'pending' CHECK(status IN ('pending','active','disbursed')),
  created_at          TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_credit_gaps_customer ON credit_gaps(customer_id);
CREATE INDEX IF NOT EXISTS idx_offers_customer ON offers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
