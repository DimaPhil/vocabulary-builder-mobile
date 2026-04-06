import type { SQLiteDatabase } from "expo-sqlite";

import {
  DEFAULT_SOURCE_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
  DEFAULT_WIDGET_ROTATION_HOURS,
} from "@/lib/constants/app";
import { createSeed } from "@/lib/utils/random";

export async function runMigrations(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS vocabulary_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      source_text TEXT NOT NULL,
      target_text TEXT NOT NULL,
      source_language TEXT NOT NULL,
      target_language TEXT NOT NULL,
      examples_json TEXT NOT NULL DEFAULT '[]',
      synonyms_json TEXT NOT NULL DEFAULT '[]',
      image_kind TEXT NOT NULL DEFAULT 'none',
      image_uri TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS vocabulary_items_category_id_idx ON vocabulary_items(category_id);
    CREATE INDEX IF NOT EXISTS vocabulary_items_source_text_idx ON vocabulary_items(source_text);
    CREATE INDEX IF NOT EXISTS vocabulary_items_target_text_idx ON vocabulary_items(target_text);
  `);

  await seedSettings(db);
}

async function seedSettings(db: SQLiteDatabase) {
  const defaults = [
    ["default_source_language", DEFAULT_SOURCE_LANGUAGE],
    ["default_target_language", DEFAULT_TARGET_LANGUAGE],
    ["widget_rotation_hours", String(DEFAULT_WIDGET_ROTATION_HOURS)],
    ["widget_seed", createSeed()],
  ];

  for (const [key, value] of defaults) {
    await db.runAsync(
      `
        INSERT INTO app_settings (key, value)
        SELECT ?, ?
        WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = ?)
      `,
      key,
      value,
      key
    );
  }
}
