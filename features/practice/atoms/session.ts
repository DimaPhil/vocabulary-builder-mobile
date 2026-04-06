import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import type { PracticeCard, PracticeSessionConfig } from "@/lib/types";
import { createMmkvStorage } from "@/lib/storage/jotai";

export const practiceDraftAtom = atomWithStorage<PracticeSessionConfig>(
  "practice-draft",
  {
    categoryIds: [],
    mode: "source_to_target",
    showExamples: false,
    showImageHints: false,
  },
  createMmkvStorage<PracticeSessionConfig>()
);

export const currentPracticeSessionAtom = atom<{
  cards: PracticeCard[];
  config: PracticeSessionConfig;
} | null>(null);
