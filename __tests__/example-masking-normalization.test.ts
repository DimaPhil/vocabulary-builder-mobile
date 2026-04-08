import {
  buildNormalizedForms,
  normalizeAnswerTokens,
  tokenizeExample,
  tokensMatch,
} from "@/features/practice/services/exampleMasking/normalization";

describe("example masking normalization", () => {
  it("expands contractions in answers", () => {
    expect(normalizeAnswerTokens("can't wrap your head around it")).toEqual([
      "can",
      "not",
      "wrap",
      "your",
      "head",
      "around",
      "it",
    ]);
  });

  it("expands contractions in examples while preserving the source span", () => {
    const tokens = tokenizeExample("They don't agree.");
    const expanded = tokens.filter((token) => token.lowerValue === "do" || token.lowerValue === "not");

    expect(expanded).toHaveLength(2);
    expect(expanded[0].start).toBe(expanded[1].start);
    expect(expanded[0].end).toBe(expanded[1].end);
  });

  it("normalizes possessive, reflexive, human, and object placeholder slots", () => {
    expect(buildNormalizedForms("your")).toContain("__possessive_determiner__");
    expect(buildNormalizedForms("himself")).toContain("__reflexive_pronoun__");
    expect(buildNormalizedForms("someone")).toContain("__human_reference__");
    expect(buildNormalizedForms("this")).toContain("__object_reference__");
  });

  it("derives adjective bases from adverbs across common suffix patterns", () => {
    expect(buildNormalizedForms("basically")).toContain("basic");
    expect(buildNormalizedForms("dramatically")).toContain("dramatic");
    expect(buildNormalizedForms("happily")).toContain("happy");
    expect(buildNormalizedForms("fully")).toContain("full");
    expect(buildNormalizedForms("slowly")).toContain("slow");
  });

  it("derives common British and American spelling variants", () => {
    expect(buildNormalizedForms("organisation")).toContain("organization");
    expect(buildNormalizedForms("organizer")).toContain("organiser");
    expect(buildNormalizedForms("organized")).toContain("organised");
    expect(buildNormalizedForms("organizing")).toContain("organising");
    expect(buildNormalizedForms("colour")).toContain("color");
    expect(buildNormalizedForms("traveled")).toContain("travelled");
    expect(buildNormalizedForms("travelling")).toContain("traveling");
  });

  it("matches tokens through normalization rather than exact form only", () => {
    const [surfaceToken] = tokenizeExample("notoriously");

    expect(tokensMatch(surfaceToken, "notorious")).toBe(true);
    expect(tokensMatch(surfaceToken, "ordinary")).toBe(false);
  });
});
