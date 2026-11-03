CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_label TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('critical','active','observed','support')),
  description TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  lat REAL,
  lng REAL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_reports_public ON reports(status, observed_at);
