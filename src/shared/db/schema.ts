import { getDb } from "./connection.js";

export function initSchema(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS blogs (
      blogId       TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      description  TEXT NOT NULL DEFAULT '',
      profileImage TEXT,
      active       INTEGER NOT NULL DEFAULT 1,
      createdAt    TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      logNo       TEXT NOT NULL,
      blogId      TEXT NOT NULL,
      title       TEXT NOT NULL,
      summary     TEXT NOT NULL DEFAULT '',
      thumbnailUrl TEXT,
      mobileUrl   TEXT NOT NULL,
      originalUrl TEXT NOT NULL,
      category    TEXT NOT NULL DEFAULT '',
      tags        TEXT NOT NULL DEFAULT '[]',
      pubDate     TEXT NOT NULL,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      PRIMARY KEY (blogId, logNo),
      FOREIGN KEY (blogId) REFERENCES blogs(blogId)
    );

    CREATE INDEX IF NOT EXISTS idx_posts_pubDate ON posts(pubDate DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_blogId ON posts(blogId);
    CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(blogId, category);
  `);
}
