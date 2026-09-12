// Connexion et schéma SQLite (module natif node:sqlite, aucune dépendance native à compiler)

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "data", "pac-assistant.sqlite");

export const db = new DatabaseSync(dbPath);

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nom_exploitation TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS parcelles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    culture TEXT NOT NULL,
    surface_ha REAL NOT NULL,
    commune TEXT,
    ilot TEXT,
    campagne INTEGER NOT NULL DEFAULT 2026,
    latitude REAL,
    longitude REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cheptels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    espece TEXT NOT NULL,
    effectif INTEGER NOT NULL,
    commune TEXT,
    campagne INTEGER NOT NULL DEFAULT 2026,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Migrations légères : ajoute les colonnes manquantes si la base existait déjà
// sans elles (SQLite n'a pas d'ADD COLUMN IF NOT EXISTS, on vérifie via PRAGMA).
const currentYear = new Date().getFullYear();
const migrations = {
  parcelles: [
    { name: "campagne", ddl: `INTEGER NOT NULL DEFAULT ${currentYear}` },
    { name: "latitude", ddl: "REAL" },
    { name: "longitude", ddl: "REAL" },
  ],
  cheptels: [{ name: "campagne", ddl: `INTEGER NOT NULL DEFAULT ${currentYear}` }],
};

for (const [table, columnsToAdd] of Object.entries(migrations)) {
  const existingColumns = db.prepare(`PRAGMA table_info(${table})`).all().map((col) => col.name);
  for (const { name, ddl } of columnsToAdd) {
    if (!existingColumns.includes(name)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${ddl}`);
    }
  }
}
