import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";

import { queryKeys } from "@/lib/constants/queryKeys";
import {
  type AppSettingsInput,
  type CategoryInput,
  type VocabularyItemInput,
} from "@/lib/db/schemas";
import {
  createCategory,
  createVocabularyItem,
  deleteCategory,
  deleteVocabularyItem,
  getAppSettings,
  getCategories,
  getCategoryUsage,
  getDashboardStats,
  getAllVocabularyItems,
  updateAppSettings,
  updateCategory,
  updateVocabularyItem,
} from "@/lib/db/repositories";
import { syncWidgetSnapshot } from "@/lib/widget/snapshot";

export function useCategoriesQuery() {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => getCategories(db),
  });
}

export function useVocabularyItemsQuery() {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.items,
    queryFn: () => getAllVocabularyItems(db),
  });
}

export function useSettingsQuery() {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => getAppSettings(db),
  });
}

export function useStatsQuery() {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => getDashboardStats(db),
  });
}

function useInvalidateVocabularyData() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
      queryClient.invalidateQueries({ queryKey: queryKeys.items }),
      queryClient.invalidateQueries({ queryKey: queryKeys.settings }),
      queryClient.invalidateQueries({ queryKey: queryKeys.stats }),
    ]);
  };
}

export function useCreateCategoryMutation() {
  const db = useSQLiteContext();
  const invalidate = useInvalidateVocabularyData();

  return useMutation({
    mutationFn: async (input: CategoryInput) => {
      await createCategory(db, input);
      await syncWidgetSnapshot(db);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateCategoryMutation() {
  const db = useSQLiteContext();
  const invalidate = useInvalidateVocabularyData();

  return useMutation({
    mutationFn: async ({
      categoryId,
      input,
    }: {
      categoryId: number;
      input: CategoryInput;
    }) => {
      await updateCategory(db, categoryId, input);
      await syncWidgetSnapshot(db);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteCategoryMutation() {
  const db = useSQLiteContext();
  const invalidate = useInvalidateVocabularyData();

  return useMutation({
    mutationFn: async ({
      categoryId,
      reassignToCategoryId,
    }: {
      categoryId: number;
      reassignToCategoryId?: number;
    }) => {
      await deleteCategory(db, categoryId, reassignToCategoryId);
      await syncWidgetSnapshot(db);
    },
    onSuccess: invalidate,
  });
}

export function useCreateVocabularyItemMutation() {
  const db = useSQLiteContext();
  const invalidate = useInvalidateVocabularyData();

  return useMutation({
    mutationFn: async (input: VocabularyItemInput) => {
      await createVocabularyItem(db, input);
      await syncWidgetSnapshot(db);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateVocabularyItemMutation() {
  const db = useSQLiteContext();
  const invalidate = useInvalidateVocabularyData();

  return useMutation({
    mutationFn: async ({
      itemId,
      input,
    }: {
      itemId: number;
      input: VocabularyItemInput;
    }) => {
      await updateVocabularyItem(db, itemId, input);
      await syncWidgetSnapshot(db);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteVocabularyItemMutation() {
  const db = useSQLiteContext();
  const invalidate = useInvalidateVocabularyData();

  return useMutation({
    mutationFn: async (itemId: number) => {
      await deleteVocabularyItem(db, itemId);
      await syncWidgetSnapshot(db);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateSettingsMutation() {
  const db = useSQLiteContext();
  const invalidate = useInvalidateVocabularyData();

  return useMutation({
    mutationFn: async (input: AppSettingsInput) => {
      await updateAppSettings(db, input);
      await syncWidgetSnapshot(db);
    },
    onSuccess: invalidate,
  });
}

export function useCategoryUsageQuery(categoryId?: number) {
  const db = useSQLiteContext();

  return useQuery({
    enabled: Boolean(categoryId),
    queryKey: [...queryKeys.categories, "usage", categoryId],
    queryFn: () => getCategoryUsage(db, categoryId ?? 0),
  });
}
