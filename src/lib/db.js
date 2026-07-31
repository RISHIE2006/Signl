import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "signl.db");

let db = null;

function getDb() {
  if (db) return db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initSchema(db);
  return db;
}

function initSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      data TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      stage TEXT NOT NULL DEFAULT 'applied',
      link TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      data TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS preps (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company TEXT DEFAULT '',
      role TEXT DEFAULT '',
      data TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS benchmarks (
      user_id TEXT PRIMARY KEY,
      data TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dna (
      user_id TEXT PRIMARY KEY,
      data TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS resumes (
      user_id TEXT PRIMARY KEY,
      data TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plans (
      user_id TEXT PRIMARY KEY,
      plan TEXT NOT NULL DEFAULT 'free',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      user_id TEXT PRIMARY KEY,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      plan TEXT NOT NULL DEFAULT 'free',
      status TEXT NOT NULL DEFAULT 'inactive',
      price_id TEXT,
      current_period_end TEXT,
      cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
    CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_id);
    CREATE INDEX IF NOT EXISTS idx_preps_user ON preps(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(stripe_customer_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription ON subscriptions(stripe_subscription_id);
  `);
}

function close() {
  if (db) {
    db.close();
    db = null;
  }
}

function parseRow(row) {
  if (!row) return null;
  const result = { ...row };
  if (typeof result.data === "string") {
    try {
      result.data = JSON.parse(result.data);
    } catch {}
  }
  return result;
}

// ── Profile ──
export function getProfile(userId) {
  const row = getDb()
    .prepare("SELECT * FROM profiles WHERE user_id = ?")
    .get(userId);
  return row ? parseRow(row).data : null;
}

export function saveProfile(userId, data) {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `
    INSERT INTO profiles (user_id, data, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET data = ?, updated_at = ?
  `,
    )
    .run(userId, JSON.stringify(data), now, now, JSON.stringify(data), now);
}

// ── Applications ──
export function getApplications(userId) {
  const rows = getDb()
    .prepare(
      "SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC",
    )
    .all(userId);
  return rows.map((r) => ({ ...r, data: undefined }));
}

export function getApplicationById(userId, appId) {
  const row = getDb()
    .prepare("SELECT * FROM applications WHERE user_id = ? AND id = ?")
    .get(userId, appId);
  return row || null;
}

export function addApplication(userId, app) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `
    INSERT INTO applications (id, user_id, company, role, stage, link, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    )
    .run(
      id,
      userId,
      app.company || "",
      app.role || "",
      app.stage || "applied",
      app.link || "",
      app.notes || "",
      now,
      now,
    );
  return { ...app, id, createdAt: now };
}

export function countApplications(userId) {
  return getDb()
    .prepare("SELECT COUNT(*) AS count FROM applications WHERE user_id = ?")
    .get(userId).count;
}

export function updateApplication(userId, appId, updates) {
  const now = new Date().toISOString();
  const existing = getDb()
    .prepare("SELECT * FROM applications WHERE user_id = ? AND id = ?")
    .get(userId, appId);
  if (!existing) return null;
  const merged = { ...existing, ...updates, updatedAt: now };
  getDb()
    .prepare(
      `
    UPDATE applications SET company = ?, role = ?, stage = ?, link = ?, notes = ?, updated_at = ?
    WHERE user_id = ? AND id = ?
  `,
    )
    .run(
      merged.company,
      merged.role,
      merged.stage,
      merged.link,
      merged.notes,
      now,
      userId,
      appId,
    );
  return merged;
}

export function deleteApplication(userId, appId) {
  getDb()
    .prepare("DELETE FROM applications WHERE user_id = ? AND id = ?")
    .run(userId, appId);
}

// ── Analyses ──
export function getAnalyses(userId) {
  const rows = getDb()
    .prepare(
      "SELECT * FROM analyses WHERE user_id = ? ORDER BY created_at DESC",
    )
    .all(userId);
  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    data: JSON.parse(r.data || "{}"),
    createdAt: r.created_at,
  }));
}

export function addAnalysis(userId, analysis) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `
    INSERT INTO analyses (id, user_id, data, created_at) VALUES (?, ?, ?, ?)
  `,
    )
    .run(id, userId, JSON.stringify(analysis), now);
  return { ...analysis, id, createdAt: now };
}

export function countAnalyses(userId) {
  return getDb()
    .prepare("SELECT COUNT(*) AS count FROM analyses WHERE user_id = ?")
    .get(userId).count;
}

// ── Preps ──
export function getPreps(userId) {
  const rows = getDb()
    .prepare("SELECT * FROM preps WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId);
  return rows.map((r) => ({
    id: r.id,
    company: r.company,
    role: r.role,
    data: JSON.parse(r.data || "{}"),
    createdAt: r.created_at,
  }));
}

export function addPrep(userId, prep) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `
    INSERT INTO preps (id, user_id, company, role, data, created_at) VALUES (?, ?, ?, ?, ?, ?)
  `,
    )
    .run(
      id,
      userId,
      prep.company || "",
      prep.role || "",
      JSON.stringify(prep.data || prep),
      now,
    );
  return { ...prep, id, createdAt: now };
}

export function countPreps(userId) {
  return getDb()
    .prepare("SELECT COUNT(*) AS count FROM preps WHERE user_id = ?")
    .get(userId).count;
}

export function deletePrep(userId, prepId) {
  getDb()
    .prepare("DELETE FROM preps WHERE user_id = ? AND id = ?")
    .run(userId, prepId);
}

// ── Benchmarks ──
export function getBenchmarks(userId) {
  const row = getDb()
    .prepare("SELECT * FROM benchmarks WHERE user_id = ?")
    .get(userId);
  return row ? JSON.parse(row.data) : null;
}

export function saveBenchmarks(userId, data) {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `
    INSERT INTO benchmarks (user_id, data, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET data = ?, updated_at = ?
  `,
    )
    .run(userId, JSON.stringify(data), now, now, JSON.stringify(data), now);
}

// ── DNA ──
export function getDNA(userId) {
  const row = getDb()
    .prepare("SELECT * FROM dna WHERE user_id = ?")
    .get(userId);
  return row ? JSON.parse(row.data) : null;
}

export function saveDNA(userId, data) {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `
    INSERT INTO dna (user_id, data, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET data = ?, updated_at = ?
  `,
    )
    .run(userId, JSON.stringify(data), now, now, JSON.stringify(data), now);
}

// ── Resume ──
export function getResume(userId) {
  const row = getDb()
    .prepare("SELECT * FROM resumes WHERE user_id = ?")
    .get(userId);
  return row ? JSON.parse(row.data) : null;
}

export function saveResume(userId, resumeData) {
  if (!resumeData) {
    getDb().prepare("DELETE FROM resumes WHERE user_id = ?").run(userId);
    return;
  }
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `
    INSERT INTO resumes (user_id, data, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET data = ?, updated_at = ?
  `,
    )
    .run(
      userId,
      JSON.stringify(resumeData),
      now,
      now,
      JSON.stringify(resumeData),
      now,
    );
}

// ── Plan ──
export function getPlan(userId) {
  const subscription = getSubscription(userId);
  if (subscription && ["active", "trialing"].includes(subscription.status)) {
    return subscription.plan || "free";
  }

  const row = getDb()
    .prepare("SELECT plan FROM plans WHERE user_id = ?")
    .get(userId);
  return row ? row.plan : "free";
}

export function savePlan(userId, plan) {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `
    INSERT INTO plans (user_id, plan, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET plan = ?, updated_at = ?
  `,
    )
    .run(userId, plan, now, now, plan, now);
}

export function getSubscription(userId) {
  const row = getDb()
    .prepare("SELECT * FROM subscriptions WHERE user_id = ?")
    .get(userId);
  if (!row) return null;
  return {
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    plan: row.plan,
    status: row.status,
    priceId: row.price_id,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: !!row.cancel_at_period_end,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getSubscriptionByStripeSubscriptionId(subscriptionId) {
  if (!subscriptionId) return null;
  const row = getDb()
    .prepare("SELECT * FROM subscriptions WHERE stripe_subscription_id = ?")
    .get(subscriptionId);
  return row ? getSubscription(row.user_id) : null;
}

export function saveStripeCustomer(userId, stripeCustomerId) {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `
    INSERT INTO subscriptions (user_id, stripe_customer_id, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET stripe_customer_id = ?, updated_at = ?
  `,
    )
    .run(userId, stripeCustomerId, now, now, stripeCustomerId, now);
}

export function saveSubscription(userId, subscription) {
  const now = new Date().toISOString();
  const plan = subscription.plan || "free";
  getDb()
    .prepare(
      `
    INSERT INTO subscriptions (
      user_id,
      stripe_customer_id,
      stripe_subscription_id,
      plan,
      status,
      price_id,
      current_period_end,
      cancel_at_period_end,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      stripe_customer_id = COALESCE(?, stripe_customer_id),
      stripe_subscription_id = ?,
      plan = ?,
      status = ?,
      price_id = ?,
      current_period_end = ?,
      cancel_at_period_end = ?,
      updated_at = ?
  `,
    )
    .run(
      userId,
      subscription.stripeCustomerId || null,
      subscription.stripeSubscriptionId || null,
      plan,
      subscription.status || "inactive",
      subscription.priceId || null,
      subscription.currentPeriodEnd || null,
      subscription.cancelAtPeriodEnd ? 1 : 0,
      now,
      now,
      subscription.stripeCustomerId || null,
      subscription.stripeSubscriptionId || null,
      plan,
      subscription.status || "inactive",
      subscription.priceId || null,
      subscription.currentPeriodEnd || null,
      subscription.cancelAtPeriodEnd ? 1 : 0,
      now,
    );

  savePlan(userId, ["active", "trialing"].includes(subscription.status) ? plan : "free");
}

// ── Clear all data for a user ──
export function clearAllData(userId) {
  const database = getDb();
  database.prepare("DELETE FROM profiles WHERE user_id = ?").run(userId);
  database.prepare("DELETE FROM applications WHERE user_id = ?").run(userId);
  database.prepare("DELETE FROM analyses WHERE user_id = ?").run(userId);
  database.prepare("DELETE FROM preps WHERE user_id = ?").run(userId);
  database.prepare("DELETE FROM benchmarks WHERE user_id = ?").run(userId);
  database.prepare("DELETE FROM dna WHERE user_id = ?").run(userId);
  database.prepare("DELETE FROM resumes WHERE user_id = ?").run(userId);
}

export { close, getDb };
