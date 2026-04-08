import { MASK_TOKEN, MOVABLE_PHRASAL_PARTICLES } from "@/features/practice/services/exampleMasking/constants";
import {
  normalizeAnswerTokens,
  tokenizeExample,
  tokensMatch,
  type ExampleMaskToken,
} from "@/features/practice/services/exampleMasking/normalization";

type MaskRange = {
  start: number;
  end: number;
};

function findContiguousMatches(exampleTokens: ExampleMaskToken[], answerTokens: string[]) {
  const ranges: MaskRange[] = [];
  const wordTokens = exampleTokens.filter((token) => token.isWord);

  if (answerTokens.length === 0 || wordTokens.length < answerTokens.length) {
    return ranges;
  }

  for (let index = 0; index <= wordTokens.length - answerTokens.length; index += 1) {
    const slice = wordTokens.slice(index, index + answerTokens.length);
    const matches = slice.every((token, sliceIndex) => tokensMatch(token, answerTokens[sliceIndex]));

    if (!matches) {
      continue;
    }

    ranges.push({
      start: slice[0].start,
      end: slice.at(-1)?.end ?? slice[0].end,
    });
  }

  return ranges;
}

function findSplitPhrasalMatches(exampleTokens: ExampleMaskToken[], answerTokens: string[]) {
  const ranges: MaskRange[] = [];

  if (answerTokens.length !== 2) {
    return ranges;
  }

  const [answerVerb, answerParticle] = answerTokens;

  if (!MOVABLE_PHRASAL_PARTICLES.has(answerParticle)) {
    return ranges;
  }

  const wordTokens = exampleTokens.filter((token) => token.isWord);

  for (let index = 0; index < wordTokens.length - 1; index += 1) {
    const first = wordTokens[index];

    if (!tokensMatch(first, answerVerb)) {
      continue;
    }

    for (let gap = 1; gap <= 3; gap += 1) {
      const particleIndex = index + gap + 1;
      const particle = wordTokens[particleIndex];

      if (!particle) {
        break;
      }

      if (!tokensMatch(particle, answerParticle)) {
        continue;
      }

      ranges.push({
        start: first.start,
        end: particle.end,
      });
      break;
    }
  }

  return ranges;
}

function mergeRanges(ranges: MaskRange[]) {
  return ranges
    .sort((left, right) => left.start - right.start)
    .reduce<MaskRange[]>((merged, range) => {
      const last = merged.at(-1);

      if (!last || range.start > last.end) {
        merged.push(range);
        return merged;
      }

      last.end = Math.max(last.end, range.end);
      return merged;
    }, []);
}

function applyMaskRanges(example: string, ranges: MaskRange[]) {
  if (ranges.length === 0) {
    return example;
  }

  let cursor = 0;
  let masked = "";

  for (const range of ranges) {
    masked += example.slice(cursor, range.start);
    masked += MASK_TOKEN;
    cursor = range.end;
  }

  masked += example.slice(cursor);
  return masked;
}

export function maskExampleAnswer(example: string, answer: string) {
  const answerTokens = normalizeAnswerTokens(answer);

  if (answerTokens.length === 0) {
    return example;
  }

  const exampleTokens = tokenizeExample(example);
  const ranges = mergeRanges([
    ...findSplitPhrasalMatches(exampleTokens, answerTokens),
    ...findContiguousMatches(exampleTokens, answerTokens),
  ]);

  return applyMaskRanges(example, ranges);
}
