CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('critical','active','observed','support')),
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  description TEXT NOT NULL,
  observed_date TEXT NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected'))
);
CREATE INDEX IF NOT EXISTS idx_reports_public ON reports(status, submitted_at);
CREATE INDEX IF NOT EXISTS idx_reports_pending ON reports(status, submitted_at);