PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  username      TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  username   TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS medicines (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  scientific         TEXT NOT NULL DEFAULT '',
  category           TEXT NOT NULL DEFAULT '',
  form               TEXT NOT NULL DEFAULT '',
  strength           TEXT NOT NULL DEFAULT '',
  batch              TEXT NOT NULL DEFAULT '',
  prod_date          TEXT NOT NULL DEFAULT '',
  expiry             TEXT NOT NULL DEFAULT '',
  qty                INTEGER NOT NULL DEFAULT 0,
  min_qty            INTEGER NOT NULL DEFAULT 0,
  buy_price          INTEGER NOT NULL DEFAULT 0,
  sell_price         INTEGER NOT NULL DEFAULT 0,
  company            TEXT NOT NULL DEFAULT '',
  strips_per_piece   INTEGER NOT NULL DEFAULT 1,
  pieces_per_carton  INTEGER NOT NULL DEFAULT 1,
  created_at         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS customers (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  kind       TEXT NOT NULL CHECK (kind IN ('pharmacy', 'warehouse')),
  phone      TEXT NOT NULL DEFAULT '',
  city       TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS invoices (
  id           TEXT PRIMARY KEY,
  number       INTEGER NOT NULL UNIQUE,
  date         TEXT NOT NULL,
  customer_id  TEXT NOT NULL DEFAULT '',
  customer     TEXT NOT NULL DEFAULT '',
  payment      TEXT NOT NULL DEFAULT 'نقدي',
  settled      INTEGER NOT NULL DEFAULT 0,
  approved     INTEGER NOT NULL DEFAULT 1,
  prep_time    TEXT,
  sale_time    TEXT,
  list_date    TEXT,
  prepared_by  TEXT,
  notes        TEXT,
  total        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id   TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  medicine_id  TEXT NOT NULL DEFAULT '',
  name         TEXT NOT NULL DEFAULT '',
  strength     TEXT NOT NULL DEFAULT '',
  unit         TEXT NOT NULL DEFAULT 'piece',
  qty          INTEGER NOT NULL DEFAULT 0,
  strips       INTEGER NOT NULL DEFAULT 0,
  price        INTEGER NOT NULL DEFAULT 0,
  cost         INTEGER NOT NULL DEFAULT 0,
  discount_pct REAL NOT NULL DEFAULT 0,
  total        INTEGER NOT NULL DEFAULT 0,
  lines_json   TEXT
);

CREATE TABLE IF NOT EXISTS purchases (
  id       TEXT PRIMARY KEY,
  number   INTEGER NOT NULL UNIQUE,
  date     TEXT NOT NULL,
  company  TEXT NOT NULL DEFAULT '',
  total    INTEGER NOT NULL DEFAULT 0,
  received INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id  TEXT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  medicine_id  TEXT NOT NULL DEFAULT '',
  name         TEXT NOT NULL DEFAULT '',
  strength     TEXT NOT NULL DEFAULT '',
  qty          INTEGER NOT NULL DEFAULT 0,
  cost         INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sessions_exp ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_meds_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_inv ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_po ON purchase_items(purchase_id);
