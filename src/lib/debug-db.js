import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'signl.db');

function quoteIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

export function getDebugDatabaseSnapshot() {
  if (!fs.existsSync(DB_PATH)) {
    return { tables: [] };
  }

  const db = new Database(DB_PATH, { fileMustExist: true });

  try {
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all();

    return {
      databasePath: DB_PATH,
      tables: tables.map(({ name }) => {
        const columns = db.prepare(`PRAGMA table_info(${quoteIdentifier(name)})`).all();
        const rows = db.prepare(`SELECT * FROM ${quoteIdentifier(name)} ORDER BY rowid DESC LIMIT 20`).all();
        return {
          name,
          columns: columns.map((column) => ({
            name: column.name,
            type: column.type,
            notNull: Boolean(column.notnull),
            pk: Boolean(column.pk),
          })),
          rows,
        };
      }),
    };
  } finally {
    db.close();
  }
}
