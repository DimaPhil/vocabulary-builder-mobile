import lemmatizer from "wink-lemmatizer";

import {
  HUMAN_REFERENCE_TOKENS,
  OBJECT_REFERENCE_TOKENS,
  POSSESSIVE_DETERMINERS,
  REFLEXIVE_PRONOUNS,
  TOKEN_EXPANSIONS,
  TOKEN_PATTERN,
} from "@/features/practice/services/exampleMasking/constants";

export type ExampleMaskToken = {
  value: string;
  lowerValue: string;
  start: number;
  end: number;
  isWord: boolean;
};

function deriveAdverbBases(token: string) {
  const bases = new Set<string>();

  if (token.endsWith("ically") && token.length > 6) {
    const stem = token.slice(0, -4);
    bases.add(stem);
    bases.add(`${stem}al`);
    return [...bases];
  }

  if (token.endsWith("ally") && token.length > 5) {
    bases.add(token.slice(0, -2));
    bases.add(`${token.slice(0, -4)}al`);
    return [...bases];
  }

  if (token.endsWith("ily") && token.length > 4) {
    bases.add(`${token.slice(0, -3)}y`);
    return [...bases];
  }

  if (token.endsWith("lly") && token.length > 4) {
    bases.add(`${token.slice(0, -2)}l`);
    return [...bases];
  }

  if (token.endsWith("ly") && token.length > 3) {
    bases.add(token.slice(0, -2));
  }

  return [...bases];
}

function deriveSpellingVariants(token: string) {
  const variants = new Set<string>();

  if (token.endsWith("isation")) {
    variants.add(`${token.slice(0, -7)}ization`);
  } else if (token.endsWith("ization")) {
    variants.add(`${token.slice(0, -7)}isation`);
  }

  if (token.endsWith("iser")) {
    variants.add(`${token.slice(0, -4)}izer`);
  } else if (token.endsWith("izer")) {
    variants.add(`${token.slice(0, -4)}iser`);
  }

  if (token.endsWith("ised")) {
    variants.add(`${token.slice(0, -4)}ized`);
  } else if (token.endsWith("ized")) {
    variants.add(`${token.slice(0, -4)}ised`);
  }

  if (token.endsWith("ising")) {
    variants.add(`${token.slice(0, -5)}izing`);
  } else if (token.endsWith("izing")) {
    variants.add(`${token.slice(0, -5)}ising`);
  }

  if (token.endsWith("ise")) {
    variants.add(`${token.slice(0, -3)}ize`);
  } else if (token.endsWith("ize")) {
    variants.add(`${token.slice(0, -3)}ise`);
  }

  if (token.endsWith("our") && token.length > 4) {
    variants.add(`${token.slice(0, -3)}or`);
  } else if (token.endsWith("or") && token.length > 3) {
    variants.add(`${token.slice(0, -2)}our`);
  }

  if (token.endsWith("lled")) {
    variants.add(`${token.slice(0, -4)}led`);
  } else if (token.endsWith("led")) {
    variants.add(`${token.slice(0, -3)}lled`);
  }

  if (token.endsWith("lling")) {
    variants.add(`${token.slice(0, -5)}ling`);
  } else if (token.endsWith("ling")) {
    variants.add(`${token.slice(0, -4)}lling`);
  }

  return [...variants];
}

export function tokenizeExample(input: string) {
  return Array.from(input.matchAll(TOKEN_PATTERN)).flatMap((match) => {
    const value = match[0] ?? "";
    const start = match.index ?? 0;
    const lowerValue = value.toLowerCase();
    const isWord = /^[A-Za-z]+(?:['-][A-Za-z]+)?$/.test(value);
    const expansions = isWord ? TOKEN_EXPANSIONS[lowerValue] ?? [lowerValue] : [lowerValue];

    return expansions.map<ExampleMaskToken>((expanded) => ({
      value,
      lowerValue: expanded,
      start,
      end: start + value.length,
      isWord,
    }));
  });
}

export function normalizeAnswerTokens(answer: string) {
  return answer
    .trim()
    .split(/\s+/)
    .flatMap((token) => {
      const normalized = token.trim().toLowerCase();
      return normalized ? TOKEN_EXPANSIONS[normalized] ?? [normalized] : [];
    });
}

export function buildNormalizedForms(token: string) {
  const normalized = token.toLowerCase();
  const forms = new Set<string>([normalized]);

  if (POSSESSIVE_DETERMINERS.has(normalized)) {
    forms.add("__possessive_determiner__");
  }

  if (REFLEXIVE_PRONOUNS.has(normalized)) {
    forms.add("__reflexive_pronoun__");
  }

  if (HUMAN_REFERENCE_TOKENS.has(normalized)) {
    forms.add("__human_reference__");
  }

  if (OBJECT_REFERENCE_TOKENS.has(normalized)) {
    forms.add("__object_reference__");
  }

  for (const candidate of [
    lemmatizer.verb(normalized),
    lemmatizer.noun(normalized),
    lemmatizer.adjective(normalized),
    ...deriveAdverbBases(normalized),
    ...deriveSpellingVariants(normalized),
  ]) {
    if (candidate) {
      forms.add(candidate.toLowerCase());
    }
  }

  return forms;
}

export function tokensMatch(surfaceToken: ExampleMaskToken, answerToken: string) {
  if (!surfaceToken.isWord) {
    return false;
  }

  const surfaceForms = buildNormalizedForms(surfaceToken.lowerValue);
  const answerForms = buildNormalizedForms(answerToken);

  for (const form of surfaceForms) {
    if (answerForms.has(form)) {
      return true;
    }
  }

  return false;
}
