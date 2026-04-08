import { buildPracticeCards } from "@/features/practice/schemas/session";
import { maskExampleAnswer } from "@/features/practice/services/exampleMasking";
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

  it("masks inflected contiguous verb phrases", () => {
    expect(maskExampleAnswer("They stirred up trouble quickly.", "stir up")).toBe(
      "They ____ trouble quickly."
    );
  });

  it("masks split phrasal verbs", () => {
    expect(maskExampleAnswer("They split it off from the main file.", "split off")).toBe(
      "They ____ from the main file."
    );
  });

  it("masks irregular verb forms in phrasal verbs", () => {
    expect(maskExampleAnswer("She took her coat off by the door.", "take off")).toBe(
      "She ____ by the door."
    );
  });

  it("masks plural noun forms", () => {
    expect(maskExampleAnswer("The pigs were sleeping outside.", "pig")).toBe(
      "The ____ were sleeping outside."
    );
  });

  it("masks normalized noun forms inside a larger phrase", () => {
    expect(maskExampleAnswer("The little pigs ran away.", "little pig")).toBe(
      "The ____ ran away."
    );
  });

  it("masks adverb forms derived from an adjective", () => {
    expect(maskExampleAnswer("They were notoriously slow to respond.", "notorious")).toBe(
      "They were ____ slow to respond."
    );
  });

  it("masks larger phrases with possessive-word variation", () => {
    expect(maskExampleAnswer("He could not wrap his head around the idea.", "wrap your head around")).toBe(
      "He could not ____ the idea."
    );
  });

  it("masks larger phrases with reflexive-pronoun variation", () => {
    expect(maskExampleAnswer("He needs to pull himself together soon.", "pull yourself together")).toBe(
      "He needs to ____ soon."
    );
  });

  it("masks larger phrases with human placeholder variation", () => {
    expect(
      maskExampleAnswer(
        "I gave her the benefit of the doubt.",
        "give someone the benefit of the doubt"
      )
    ).toBe("I ____.");
  });

  it("masks larger phrases with object placeholder variation", () => {
    expect(maskExampleAnswer("Please check this out later.", "check it out")).toBe(
      "Please ____ later."
    );
  });

  it("masks contractions against uncontracted phrases", () => {
    expect(maskExampleAnswer("They don't get along.", "do not get along")).toBe(
      "They ____."
    );
  });

  it("masks common British and American spelling variants", () => {
    expect(maskExampleAnswer("They organised the event quickly.", "organize the event quickly")).toBe(
      "They ____."
    );
  });

  it("does not mask partial matches inside larger words", () => {
    expect(maskExampleAnswer("The startup kept growing.", "start up")).toBe(
      "The startup kept growing."
    );
  });

  it("masks longer verb phrases with an inflected leading verb", () => {
    expect(maskExampleAnswer("I'm looking forward to the trip.", "look forward to")).toBe(
      "I'm ____ the trip."
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
