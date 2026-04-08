import type { SQLiteDatabase } from "expo-sqlite";

import type {
  AppSettingsInput,
  CategoryInput,
  VocabularyItemInput,
} from "@/lib/db/schemas";
import { mapCategoryRow, mapVocabularyRow } from "@/lib/db/serializers";
import type { AppSettings, Category, DashboardStats, VocabularyItem } from "@/lib/types";
import { isoNow } from "@/lib/utils/date";

export async function getCategories(db: SQLiteDatabase): Promise<Category[]> {
  const rows = await db.getAllAsync<{
    id: number;
    slug: string;
    name: string;
    created_at: string;
    updated_at: string;
  }>("SELECT * FROM categories ORDER BY name ASC");

  return rows.map(mapCategoryRow);
}

export async function createCategory(
  db: SQLiteDatabase,
  input: CategoryInput
) {
  const now = isoNow();
  await db.runAsync(
    `
      INSERT INTO categories (slug, name, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `,
    input.slug,
    input.name,
    now,
    now
  );
}

export async function updateCategory(
  db: SQLiteDatabase,
  categoryId: number,
  input: CategoryInput
) {
  await db.runAsync(
    `
      UPDATE categories
      SET slug = ?, name = ?, updated_at = ?
      WHERE id = ?
    `,
    input.slug,
    input.name,
    isoNow(),
    categoryId
  );
}

export async function getCategoryUsage(
  db: SQLiteDatabase,
  categoryId: number
) {
  const row = await db.getFirstAsync<{ total: number }>(
    `
      SELECT COUNT(*) AS total
      FROM vocabulary_items
      WHERE category_id = ?
    `,
    categoryId
  );

  return row?.total ?? 0;
}

export async function deleteCategory(
  db: SQLiteDatabase,
  categoryId: number,
  options?: {
    reassignToCategoryId?: number;
    deleteItems?: boolean;
  }
) {
  if (options?.deleteItems) {
    await db.runAsync(
      `
        DELETE FROM vocabulary_items
        WHERE category_id = ?
      `,
      categoryId
    );
  } else if (options?.reassignToCategoryId) {
    await db.runAsync(
      `
        UPDATE vocabulary_items
        SET category_id = ?, updated_at = ?
        WHERE category_id = ?
      `,
      options.reassignToCategoryId,
      isoNow(),
      categoryId
    );
  }

  await db.runAsync("DELETE FROM categories WHERE id = ?", categoryId);
}

export async function getAllVocabularyItems(
  db: SQLiteDatabase
): Promise<VocabularyItem[]> {
  const rows = await db.getAllAsync<any>(`
    SELECT
      vocabulary_items.*,
      categories.name AS category_name,
      categories.slug AS category_slug
    FROM vocabulary_items
    INNER JOIN categories ON categories.id = vocabulary_items.category_id
    ORDER BY vocabulary_items.source_text COLLATE NOCASE ASC
  `);

  return rows.map(mapVocabularyRow);
}

export async function getVocabularyItemById(
  db: SQLiteDatabase,
  itemId: number
) {
  const row = await db.getFirstAsync<any>(
    `
      SELECT
        vocabulary_items.*,
        categories.name AS category_name,
        categories.slug AS category_slug
      FROM vocabulary_items
      INNER JOIN categories ON categories.id = vocabulary_items.category_id
      WHERE vocabulary_items.id = ?
    `,
    itemId
  );

  return row ? mapVocabularyRow(row) : null;
}

export async function createVocabularyItem(
  db: SQLiteDatabase,
  input: VocabularyItemInput
) {
  const now = isoNow();
  await db.runAsync(
    `
      INSERT INTO vocabulary_items (
        category_id,
        source_text,
        target_text,
        source_language,
        target_language,
        examples_json,
        synonyms_json,
        image_kind,
        image_uri,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    input.categoryId,
    input.sourceText,
    input.targetText,
    input.sourceLanguage,
    input.targetLanguage,
    JSON.stringify(input.examples),
    JSON.stringify(input.synonyms),
    input.image.kind,
    input.image.uri,
    now,
    now
  );
}

export async function updateVocabularyItem(
  db: SQLiteDatabase,
  itemId: number,
  input: VocabularyItemInput
) {
  await db.runAsync(
    `
      UPDATE vocabulary_items
      SET
        category_id = ?,
        source_text = ?,
        target_text = ?,
        source_language = ?,
        target_language = ?,
        examples_json = ?,
        synonyms_json = ?,
        image_kind = ?,
        image_uri = ?,
        updated_at = ?
      WHERE id = ?
    `,
    input.categoryId,
    input.sourceText,
    input.targetText,
    input.sourceLanguage,
    input.targetLanguage,
    JSON.stringify(input.examples),
    JSON.stringify(input.synonyms),
    input.image.kind,
    input.image.uri,
    isoNow(),
    itemId
  );
}

export async function deleteVocabularyItem(db: SQLiteDatabase, itemId: number) {
  await db.runAsync("DELETE FROM vocabulary_items WHERE id = ?", itemId);
}

export async function getAppSettings(db: SQLiteDatabase): Promise<AppSettings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    "SELECT key, value FROM app_settings"
  );

  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  return {
    defaultSourceLanguage: map.default_source_language,
    defaultTargetLanguage: map.default_target_language,
    widgetRotationHours: Number(map.widget_rotation_hours),
    widgetSeed: map.widget_seed,
  };
}

export async function updateAppSettings(
  db: SQLiteDatabase,
  settings: AppSettingsInput
) {
  const pairs = [
    ["default_source_language", settings.defaultSourceLanguage],
    ["default_target_language", settings.defaultTargetLanguage],
    ["widget_rotation_hours", String(settings.widgetRotationHours)],
    ["widget_seed", settings.widgetSeed],
  ] as const;

  for (const [key, value] of pairs) {
    await db.runAsync(
      `
        INSERT INTO app_settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `,
      key,
      value
    );
  }
}

export async function getDashboardStats(
  db: SQLiteDatabase
): Promise<DashboardStats> {
  const row = await db.getFirstAsync<{
    totalItems: number;
    totalCategories: number;
    withImages: number;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM vocabulary_items) AS totalItems,
      (SELECT COUNT(*) FROM categories) AS totalCategories,
      (SELECT COUNT(*) FROM vocabulary_items WHERE image_kind != 'none') AS withImages
  `);

  return {
    totalItems: row?.totalItems ?? 0,
    totalCategories: row?.totalCategories ?? 0,
    withImages: row?.withImages ?? 0,
  };
}
