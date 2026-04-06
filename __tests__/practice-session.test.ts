import { buildPracticeCards, maskExampleAnswer } from "@/features/practice/schemas/session";
import type { PracticeSessionConfig, VocabularyItem } from "@/lib/types";

const baseItem: VocabularyItem = {
  id: 1,
  categoryId: 10,
  categoryName: "Kitchen",
  categorySlug: "kitchen",
  sourceText: "stir up",
  targetText: "mix",
  sourceLanguage: "en",
  targetLanguage: "ru",
  examples: ["They stir up trouble quickly."],
  synonyms: ["agitate"],
  imageKind: "none",
  imageUri: null,
  createdAt: "",
  updatedAt: "",
};

describe("practice session helpers", () => {
  it("masks the answer phrase with underscores", () => {
    expect(maskExampleAnswer("They stir up trouble quickly.", "stir up")).toBe(
      "They ____ trouble quickly."
    );
  });

  it("builds masked practice cards for translation mode", () => {
    const config: PracticeSessionConfig = {
      categoryIds: [10],
      mode: "target_to_source",
      showExamples: true,
      showImageHints: false,
    };

    const cards = buildPracticeCards([baseItem], config);

    expect(cards).toHaveLength(1);
    expect(cards[0].maskedExamples[0]).toContain("____");
  });
});
