import type { Category, VocabularyItem } from "@/lib/types";

type CategoryRow = {
  id: number;
  slug: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type VocabularyRow = {
  id: number;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  source_text: string;
  target_text: string;
  source_language: string;
  target_language: string;
  examples_json: string;
  synonyms_json: string;
  image_kind: VocabularyItem["imageKind"];
  image_uri: string | null;
  created_at: string;
  updated_at: string;
};

export function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapVocabularyRow(row: VocabularyRow): VocabularyItem {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    sourceText: row.source_text,
    targetText: row.target_text,
    sourceLanguage: row.source_language,
    targetLanguage: row.target_language,
    examples: JSON.parse(row.examples_json) as string[],
    synonyms: JSON.parse(row.synonyms_json) as string[],
    imageKind: row.image_kind,
    imageUri: row.image_uri,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
