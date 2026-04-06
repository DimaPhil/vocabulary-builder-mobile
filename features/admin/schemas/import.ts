import type { SQLiteDatabase } from "expo-sqlite";
import { z } from "zod";

import { importPayloadSchema } from "@/lib/db/schemas";
import {
  createCategory,
  createVocabularyItem,
  getCategories,
} from "@/lib/db/repositories";
import { validateRemoteImageUrl } from "@/lib/images/service";
import { syncWidgetSnapshot } from "@/lib/widget/snapshot";

export type ImportPreview = {
  errors: string[];
  payload: z.infer<typeof importPayloadSchema> | null;
};

export async function previewImportPayload(rawValue: string): Promise<ImportPreview> {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawValue);
  } catch {
    return {
      errors: ["Import must be valid JSON."],
      payload: null,
    };
  }

  const result = importPayloadSchema.safeParse(parsedJson);

  if (!result.success) {
    return {
      errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      payload: null,
    };
  }

  const imageErrors = await Promise.all(
    result.data.items.map(async (item, index) => {
      if (!item.imageUrl) {
        return null;
      }

      try {
        await validateRemoteImageUrl(item.imageUrl);
        return null;
      } catch (error) {
        return `items[${index}].imageUrl: ${
          error instanceof Error ? error.message : "Image URL is invalid."
        }`;
      }
    })
  );

  const duplicateCategorySlugs = findDuplicates(
    result.data.categories.map((category) => category.slug)
  );

  const errors = [
    ...imageErrors.filter(Boolean),
    ...duplicateCategorySlugs.map(
      (slug) => `categories: duplicate slug "${slug}" appears more than once.`
    ),
  ] as string[];

  return {
    errors,
    payload: errors.length ? null : result.data,
  };
}

export async function commitImportPayload(
  db: SQLiteDatabase,
  payload: z.infer<typeof importPayloadSchema>
) {
  const existingCategories = await getCategories(db);
  const categoryIdBySlug = new Map(
    existingCategories.map((category) => [category.slug, category.id])
  );

  for (const category of payload.categories) {
    if (categoryIdBySlug.has(category.slug)) {
      continue;
    }

    await createCategory(db, category);
    const nextCategories = await getCategories(db);
    const createdCategory = nextCategories.find(
      (item) => item.slug === category.slug
    );

    if (createdCategory) {
      categoryIdBySlug.set(createdCategory.slug, createdCategory.id);
    }
  }

  for (const item of payload.items) {
    const categoryId = categoryIdBySlug.get(item.category);

    if (!categoryId) {
      throw new Error(`Category "${item.category}" does not exist.`);
    }

    await createVocabularyItem(db, {
      categoryId,
      sourceText: item.sourceText,
      targetText: item.targetText,
      sourceLanguage: item.sourceLanguage,
      targetLanguage: item.targetLanguage,
      examples: item.examples ?? [],
      synonyms: item.synonyms ?? [],
      image: item.imageUrl
        ? {
            kind: "remote",
            uri: item.imageUrl,
          }
        : {
            kind: "none",
            uri: null,
          },
    });
  }

  await syncWidgetSnapshot(db);
}

function findDuplicates(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
      return;
    }

    seen.add(value);
  });

  return [...duplicates];
}
