import { z } from "zod";

import {
  DEFAULT_SOURCE_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
  DEFAULT_WIDGET_ROTATION_HOURS,
  WIDGET_ROTATION_MAX_HOURS,
  WIDGET_ROTATION_MIN_HOURS,
} from "@/lib/constants/app";
import { slugify } from "@/lib/utils/strings";

const languageCodeSchema = z
  .string()
  .trim()
  .regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, "Use a valid BCP-47 language tag.");

const textListSchema = z.array(z.string().trim().min(1)).default([]);

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required."),
  slug: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? "")
    .transform((value) => slugify(value)),
});

export const categoryInputSchema = categorySchema.transform((value) => ({
  ...value,
  slug: value.slug || slugify(value.name),
}));

export const itemImageSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("none"),
    uri: z.null(),
  }),
  z.object({
    kind: z.literal("remote"),
    uri: z.string().url().startsWith("https://"),
  }),
  z.object({
    kind: z.literal("local"),
    uri: z.string().min(1),
  }),
]);

export const vocabularyItemSchema = z.object({
  categoryId: z.number().int().positive(),
  sourceText: z.string().trim().min(1, "Source text is required."),
  targetText: z.string().trim().min(1, "Translation or explanation is required."),
  sourceLanguage: languageCodeSchema.default(DEFAULT_SOURCE_LANGUAGE),
  targetLanguage: languageCodeSchema.default(DEFAULT_TARGET_LANGUAGE),
  examples: textListSchema,
  synonyms: textListSchema,
  image: itemImageSchema.default({
    kind: "none",
    uri: null,
  }),
});

export const appSettingsSchema = z.object({
  defaultSourceLanguage: languageCodeSchema.default(DEFAULT_SOURCE_LANGUAGE),
  defaultTargetLanguage: languageCodeSchema.default(DEFAULT_TARGET_LANGUAGE),
  widgetRotationHours: z
    .number()
    .int()
    .min(WIDGET_ROTATION_MIN_HOURS)
    .max(WIDGET_ROTATION_MAX_HOURS)
    .default(DEFAULT_WIDGET_ROTATION_HOURS),
  widgetSeed: z.string().trim().min(1),
});

const importCategorySchema = z.object({
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
});

const importItemSchema = z.object({
  category: z.string().trim().min(1),
  sourceText: z.string().trim().min(1),
  targetText: z.string().trim().min(1),
  sourceLanguage: languageCodeSchema,
  targetLanguage: languageCodeSchema,
  examples: textListSchema.optional().default([]),
  synonyms: textListSchema.optional().default([]),
  imageUrl: z.string().url().startsWith("https://").optional(),
});

export const importPayloadSchema = z.object({
  categories: z.array(importCategorySchema),
  items: z.array(importItemSchema),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type VocabularyItemInput = z.infer<typeof vocabularyItemSchema>;
export type AppSettingsInput = z.infer<typeof appSettingsSchema>;
export type ImportPayload = z.infer<typeof importPayloadSchema>;
