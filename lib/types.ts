export type Category = {
  id: number;
  slug: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type VocabularyImageKind = "none" | "remote" | "local";

export type VocabularyItem = {
  id: number;
  categoryId: number;
  categoryName?: string;
  categorySlug?: string;
  sourceText: string;
  targetText: string;
  sourceLanguage: string;
  targetLanguage: string;
  examples: string[];
  synonyms: string[];
  imageKind: VocabularyImageKind;
  imageUri: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PracticeMode = "source_to_target" | "target_to_source";

export type PracticeSessionConfig = {
  categoryIds: number[];
  mode: PracticeMode;
  showImageHints: boolean;
  showExamples: boolean;
};

export type PracticeCard = VocabularyItem & {
  maskedExamples: string[];
};

export type WidgetConfig = {
  rotationHours: number;
};

export type WidgetSnapshotItem = {
  id: number;
  sourceText: string;
  targetText: string;
};

export type WidgetSnapshot = {
  version: number;
  generatedAt: string;
  rotationHours: number;
  seed: string;
  items: WidgetSnapshotItem[];
};

export type AppSettings = {
  defaultSourceLanguage: string;
  defaultTargetLanguage: string;
  widgetRotationHours: number;
  widgetSeed: string;
};

export type DashboardStats = {
  totalItems: number;
  totalCategories: number;
  withImages: number;
};
