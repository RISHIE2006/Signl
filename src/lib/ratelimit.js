import Database from 'better-sqlite3';
import path from 'node:path';

const RATE_LIMITS = {
  ai: { requests: 10, windowMs: 60000 },
  db: { requests: 60, windowMs: 60000 },
  default: { requests: 10, windowMs: 60000 },
};

const DB_PATH = process.env.RATE_LIMIT_DB_PATH || path.join(process.cwd(), '.ratelimit-store.sqlite');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    timestamps TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

const getEntryStmt = db.prepare('SELECT timestamps FROM rate_limits WHERE key = ?');
const upsertEntryStmt = db.prepare(`
  INSERT INTO rate_limits (key, timestamps, updated_at)
  VALUES (?, ?, ?)
  ON CONFLICT(key) DO UPDATE SET timestamps = excluded.timestamps, updated_at = excluded.updated_at
`);
const deleteEntryStmt = db.prepare('DELETE FROM rate_limits WHERE key = ?');

function getLimitForPath(pathValue) {
  if (!pathValue) return RATE_LIMITS.default;
  if (pathValue.includes('/api/db/')) return RATE_LIMITS.db;
  if (pathValue.includes('/api/')) return RATE_LIMITS.ai;
  return RATE_LIMITS.default;
}

function getActiveTimestamps(key, config, now) {
  const row = getEntryStmt.get(key);
  const storedTimestamps = row ? JSON.parse(row.timestamps) : [];
  const activeTimestamps = storedTimestamps.filter((time) => now - time < config.windowMs);

  if (!activeTimestamps.length) {
    deleteEntryStmt.run(key);
    return [];
  }

  if (activeTimestamps.length !== storedTimestamps.length) {
    upsertEntryStmt.run(key, JSON.stringify(activeTimestamps), now);
  }

  return activeTimestamps;
}

export function rateLimit(ip, pathValue) {
  const now = Date.now();
  const config = getLimitForPath(pathValue);
  const key = `${ip}:${pathValue || 'default'}`;

  return db.transaction((keyValue, configValue, currentTime) => {
    const timestamps = getActiveTimestamps(keyValue, configValue, currentTime);

    if (timestamps.length >= configValue.requests) {
      return {
        success: false,
        limit: configValue.requests,
        remaining: 0,
        reset: timestamps[0] + configValue.windowMs,
      };
    }

    timestamps.push(currentTime);
    upsertEntryStmt.run(keyValue, JSON.stringify(timestamps), currentTime);

    return {
      success: true,
      limit: configValue.requests,
      remaining: configValue.requests - timestamps.length,
      reset: currentTime + configValue.windowMs,
    };
  })(key, config, now);
}
