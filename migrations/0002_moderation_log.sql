CREATE TABLE IF NOT EXISTS moderation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('approved','rejected')),
  actor_email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(report_id) REFERENCES reports(id)
);
CREATE INDEX IF NOT EXISTS idx_moderation_report ON moderation_log(report_id, created_at);
