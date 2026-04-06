import { atomWithStorage } from "jotai/utils";

import { createMmkvStorage } from "@/lib/storage/jotai";

export const libraryFiltersAtom = atomWithStorage<{
  search: string;
  categoryIds: number[];
}>(
  "library-filters",
  {
    search: "",
    categoryIds: [] as number[],
  },
  createMmkvStorage<{
    search: string;
    categoryIds: number[];
  }>()
);
