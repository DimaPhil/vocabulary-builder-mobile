import type { PracticeCard, PracticeSessionConfig, VocabularyItem } from "@/lib/types";
import { shuffleArray } from "@/lib/utils/random";
import { escapeRegExp } from "@/lib/utils/strings";

export function maskExampleAnswer(example: string, answer: string) {
  if (!answer.trim()) {
    return example;
  }

  const pattern = new RegExp(escapeRegExp(answer), "gi");
  return example.replace(pattern, "____");
}

export function buildPracticeCards(
  items: VocabularyItem[],
  config: PracticeSessionConfig
): PracticeCard[] {
  const filteredItems =
    config.categoryIds.length === 0
      ? items
      : items.filter((item) => config.categoryIds.includes(item.categoryId));

  const preparedItems = filteredItems.map((item) => ({
    ...item,
    maskedExamples: item.examples.map((example) =>
      maskExampleAnswer(
        example,
        config.mode === "target_to_source" ? item.sourceText : item.targetText
      )
    ),
  }));

  return shuffleArray(preparedItems);
}
