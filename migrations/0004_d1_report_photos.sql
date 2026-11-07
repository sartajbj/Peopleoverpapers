CREATE TABLE IF NOT EXISTS report_photos (
  report_id TEXT PRIMARY KEY REFERENCES reports(id) ON DELETE CASCADE,
  image BLOB NOT NULL,
  mime TEXT NOT NULL CHECK (mime = 'image/webp'),
  bytes INTEGER NOT NULL CHECK (bytes > 0 AND bytes <= 102400),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
