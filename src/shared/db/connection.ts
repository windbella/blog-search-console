import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { DB_PATH } from "../constants.js";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dir = dirname(DB_PATH);
  mkdirSync(dir, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  return db;
}
