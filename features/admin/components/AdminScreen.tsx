import { zodResolver } from "@hookform/resolvers/zod";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useSQLiteContext } from "expo-sqlite";
import { useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Image,
  Modal,
  View,
} from "react-native";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Page } from "@/components/ui/Page";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Text } from "@/components/ui/Text";
import { TextField } from "@/components/ui/TextField";
import { DEFAULT_SOURCE_LANGUAGE, DEFAULT_TARGET_LANGUAGE } from "@/lib/constants/app";
import { queryKeys } from "@/lib/constants/queryKeys";
import {
  categoryInputSchema,
  vocabularyItemSchema,
  appSettingsSchema,
} from "@/lib/db/schemas";
import type { Category, VocabularyItem } from "@/lib/types";
import { copyImageToAppStorage, validateRemoteImageUrl } from "@/lib/images/service";
import { useAppTheme } from "@/lib/theme";
import {
  commitImportPayload,
  previewImportPayload,
  type ImportPreview,
} from "@/features/admin/schemas/import";
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useCreateVocabularyItemMutation,
  useDeleteCategoryMutation,
  useDeleteVocabularyItemMutation,
  useSettingsQuery,
  useUpdateCategoryMutation,
  useUpdateSettingsMutation,
  useUpdateVocabularyItemMutation,
  useVocabularyItemsQuery,
} from "@/hooks/useVocabularyData";

const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Category name is required."),
  slug: z.string().trim().optional(),
});

const itemFormSchema = z.object({
  categoryId: z.number().int().positive("Select a category."),
  sourceText: z.string().trim().min(1, "Source text is required."),
  targetText: z.string().trim().min(1, "Translation or explanation is required."),
  sourceLanguage: z.string().trim().min(2),
  targetLanguage: z.string().trim().min(2),
  examplesText: z.string(),
  synonymsText: z.string(),
  imageMode: z.enum(["none", "remote", "local"]),
  imageUri: z.string(),
});

const settingsFormSchema = z.object({
  defaultSourceLanguage: z.string().trim().min(2),
  defaultTargetLanguage: z.string().trim().min(2),
  widgetRotationHours: z
    .string()
    .trim()
    .regex(/^\d+$/, "Rotation must be a whole number."),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;
type ItemFormValues = z.infer<typeof itemFormSchema>;
type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export function AdminScreen() {
  const theme = useAppTheme();
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategoriesQuery();
  const { data: items = [] } = useVocabularyItemsQuery();
  const { data: settings } = useSettingsQuery();
  const createCategoryMutation = useCreateCategoryMutation();
  const updateCategoryMutation = useUpdateCategoryMutation();
  const deleteCategoryMutation = useDeleteCategoryMutation();
  const createItemMutation = useCreateVocabularyItemMutation();
  const updateItemMutation = useUpdateVocabularyItemMutation();
  const deleteItemMutation = useDeleteVocabularyItemMutation();
  const updateSettingsMutation = useUpdateSettingsMutation();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<VocabularyItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const deferredItemSearch = useDeferredValue(itemSearch);

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const itemForm = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      categoryId: categories[0]?.id ?? 0,
      sourceText: "",
      targetText: "",
      sourceLanguage: settings?.defaultSourceLanguage ?? DEFAULT_SOURCE_LANGUAGE,
      targetLanguage: settings?.defaultTargetLanguage ?? DEFAULT_TARGET_LANGUAGE,
      examplesText: "",
      synonymsText: "",
      imageMode: "none",
      imageUri: "",
    },
  });

  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    values: {
      defaultSourceLanguage:
        settings?.defaultSourceLanguage ?? DEFAULT_SOURCE_LANGUAGE,
      defaultTargetLanguage:
        settings?.defaultTargetLanguage ?? DEFAULT_TARGET_LANGUAGE,
      widgetRotationHours: String(settings?.widgetRotationHours ?? 1),
    },
  });

  const filteredItems = items.filter((item) => {
    const query = deferredItemSearch.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      item.sourceText.toLowerCase().includes(query) ||
      item.targetText.toLowerCase().includes(query) ||
      (item.categoryName ?? "").toLowerCase().includes(query)
    );
  });

  async function handleCategorySubmit(values: CategoryFormValues) {
    const input = categoryInputSchema.parse(values);

    if (editingCategory) {
      await updateCategoryMutation.mutateAsync({
        categoryId: editingCategory.id,
        input,
      });
      setEditingCategory(null);
    } else {
      await createCategoryMutation.mutateAsync(input);
    }

    categoryForm.reset({
      name: "",
      slug: "",
    });
  }

  async function handleItemSubmit(values: ItemFormValues) {
    let image: {
      kind: "none" | "remote" | "local";
      uri: string | null;
    } = {
      kind: "none",
      uri: null,
    };

    if (values.imageMode === "remote" && values.imageUri.trim()) {
      image = {
        kind: "remote",
        uri: await validateRemoteImageUrl(values.imageUri.trim()),
      };
    }

    if (values.imageMode === "local" && values.imageUri.trim()) {
      image = {
        kind: "local",
        uri:
          editingItem?.imageKind === "local" && editingItem.imageUri === values.imageUri
            ? values.imageUri
            : await copyImageToAppStorage(values.imageUri),
      };
    }

    const input = vocabularyItemSchema.parse({
      categoryId: values.categoryId,
      sourceText: values.sourceText,
      targetText: values.targetText,
      sourceLanguage: values.sourceLanguage,
      targetLanguage: values.targetLanguage,
      examples: values.examplesText
        .split("\n")
        .map((entry) => entry.trim())
        .filter(Boolean),
      synonyms: values.synonymsText
        .split("\n")
        .map((entry) => entry.trim())
        .filter(Boolean),
      image,
    });

    if (editingItem) {
      await updateItemMutation.mutateAsync({
        itemId: editingItem.id,
        input,
      });
    } else {
      await createItemMutation.mutateAsync(input);
    }

    closeItemModal();
  }

  async function handleSettingsSubmit(values: SettingsFormValues) {
    if (!settings) {
      return;
    }

    const input = appSettingsSchema.parse({
      defaultSourceLanguage: values.defaultSourceLanguage,
      defaultTargetLanguage: values.defaultTargetLanguage,
      widgetRotationHours: Number(values.widgetRotationHours),
      widgetSeed: settings.widgetSeed,
    });

    await updateSettingsMutation.mutateAsync(input);
  }

  async function handleLoadImportFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    const file = new File(asset.uri);
    const text = await file.text();

    setImportText(text);
    setImportPreview(null);
  }

  async function handlePreviewImport() {
    const preview = await previewImportPayload(importText);
    setImportPreview(preview);
  }

  async function handleCommitImport() {
    if (!importPreview?.payload) {
      return;
    }

    setImporting(true);

    try {
      await commitImportPayload(db, importPreview.payload);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
        queryClient.invalidateQueries({ queryKey: queryKeys.items }),
        queryClient.invalidateQueries({ queryKey: queryKeys.settings }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stats }),
      ]);
      setImportText("");
      setImportPreview(null);
    } finally {
      setImporting(false);
    }
  }

  function openCreateItemModal() {
    itemForm.reset({
      categoryId: categories[0]?.id ?? 0,
      sourceText: "",
      targetText: "",
      sourceLanguage: settings?.defaultSourceLanguage ?? DEFAULT_SOURCE_LANGUAGE,
      targetLanguage: settings?.defaultTargetLanguage ?? DEFAULT_TARGET_LANGUAGE,
      examplesText: "",
      synonymsText: "",
      imageMode: "none",
      imageUri: "",
    });
    setEditingItem(null);
    setShowItemModal(true);
  }

  function openEditItemModal(item: VocabularyItem) {
    itemForm.reset({
      categoryId: item.categoryId,
      sourceText: item.sourceText,
      targetText: item.targetText,
      sourceLanguage: item.sourceLanguage,
      targetLanguage: item.targetLanguage,
      examplesText: item.examples.join("\n"),
      synonymsText: item.synonyms.join("\n"),
      imageMode: item.imageKind,
      imageUri: item.imageUri ?? "",
    });
    setEditingItem(item);
    setShowItemModal(true);
  }

  function closeItemModal() {
    setShowItemModal(false);
    setEditingItem(null);
  }

  async function pickLocalImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Photo access is required", "Allow photo access to attach local images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ["images"],
      quality: 0.9,
    });

    if (result.canceled || !result.assets.length) {
      return;
    }

    itemForm.setValue("imageMode", "local");
    itemForm.setValue("imageUri", result.assets[0].uri);
  }

  return (
    <Page>
      <SectionHeader
        eyebrow="Admin"
        title="Control categories, items, imports, and widget settings"
        description="All writes are validated before they hit the local database. Every successful change also regenerates the widget snapshot."
      />

      <Card>
        <Text variant="heading">Default languages and widget rotation</Text>
        <View style={{ gap: 10 }}>
          <Controller
            control={settingsForm.control}
            name="defaultSourceLanguage"
            render={({ field, fieldState }) => (
              <TextField
                autoCapitalize="none"
                error={fieldState.error?.message}
                label="Default source language"
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
          <Controller
            control={settingsForm.control}
            name="defaultTargetLanguage"
            render={({ field, fieldState }) => (
              <TextField
                autoCapitalize="none"
                error={fieldState.error?.message}
                label="Default target language"
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
          <Controller
            control={settingsForm.control}
            name="widgetRotationHours"
            render={({ field, fieldState }) => (
              <TextField
                error={fieldState.error?.message}
                keyboardType="number-pad"
                label="Widget rotation hours"
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
          <Button
            label="Save settings"
            onPress={settingsForm.handleSubmit(handleSettingsSubmit)}
          />
        </View>
      </Card>

      <Card>
        <Text variant="heading">Categories</Text>
        <View style={{ gap: 10 }}>
          <Controller
            control={categoryForm.control}
            name="name"
            render={({ field, fieldState }) => (
              <TextField
                error={fieldState.error?.message}
                label="Category name"
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
          <Controller
            control={categoryForm.control}
            name="slug"
            render={({ field }) => (
              <TextField
                autoCapitalize="none"
                helperText="Optional. Leave blank to auto-generate from the name."
                label="Slug"
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
          <Button
            label={editingCategory ? "Update category" : "Add category"}
            onPress={categoryForm.handleSubmit(handleCategorySubmit)}
          />
          {editingCategory ? (
            <Button
              label="Cancel edit"
              onPress={() => {
                setEditingCategory(null);
                categoryForm.reset({
                  name: "",
                  slug: "",
                });
              }}
              variant="ghost"
            />
          ) : null}
        </View>

        {categories.length ? (
          <View style={{ gap: 10 }}>
            {categories.map((category) => {
              const usageCount = items.filter(
                (item) => item.categoryId === category.id
              ).length;

              return (
                <Card key={category.id} style={{ padding: 14 }}>
                  <Text variant="heading">{category.name}</Text>
                  <Text color={theme.colors.textMuted} variant="caption">
                    {category.slug} • {usageCount} item(s)
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <Button
                      label="Edit"
                      onPress={() => {
                        setEditingCategory(category);
                        categoryForm.reset({
                          name: category.name,
                          slug: category.slug,
                        });
                      }}
                      variant="secondary"
                    />
                    <Button
                      label="Delete"
                      onPress={() => {
                        if (
                          usageCount > 0 &&
                          categories.filter((item) => item.id !== category.id).length === 0
                        ) {
                          Alert.alert(
                            "Cannot delete category",
                            "Create another category first so existing items can be reassigned."
                          );
                          return;
                        }

                        const fallbackCategoryId =
                          categories.find((item) => item.id !== category.id)?.id;

                        Alert.alert(
                          "Delete category",
                          usageCount > 0
                            ? "Items in this category will be reassigned before deletion."
                            : "This category will be deleted.",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: () =>
                                deleteCategoryMutation.mutate({
                                  categoryId: category.id,
                                  reassignToCategoryId:
                                    usageCount > 0 ? fallbackCategoryId : undefined,
                                }),
                            },
                          ]
                        );
                      }}
                      variant="danger"
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        ) : (
          <EmptyState
            title="No categories yet"
            description="Create the first category before adding vocabulary items."
          />
        )}
      </Card>

      <Card>
        <Text variant="heading">Vocabulary items</Text>
        <TextField
          label="Search items"
          onChangeText={setItemSearch}
          placeholder="Search text or category"
          value={itemSearch}
        />
        <Button label="Add item" onPress={openCreateItemModal} />
        {filteredItems.length ? (
          <View style={{ gap: 10 }}>
            {filteredItems.map((item) => (
              <Card key={item.id} style={{ padding: 14 }}>
                <Text variant="heading">{item.sourceText}</Text>
                <Text>{item.targetText}</Text>
                <Text color={theme.colors.textMuted} variant="caption">
                  {item.categoryName}
                </Text>
                {item.imageUri ? (
                  <Image
                    source={{ uri: item.imageUri }}
                    style={{
                      borderRadius: 18,
                      height: 120,
                      width: "100%",
                    }}
                  />
                ) : null}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Button
                    label="Edit"
                    onPress={() => openEditItemModal(item)}
                    variant="secondary"
                  />
                  <Button
                    label="Delete"
                    onPress={() =>
                      Alert.alert("Delete item", "This item will be removed.", [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => deleteItemMutation.mutate(item.id),
                        },
                      ])
                    }
                    variant="danger"
                  />
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState
            title="No items match"
            description="Change the search or create a new item."
          />
        )}
      </Card>

      <Card>
        <Text variant="heading">Batch import</Text>
        <TextField
          label="JSON payload"
          multiline
          onChangeText={(value) => {
            setImportText(value);
            setImportPreview(null);
          }}
          placeholder='{"categories":[...],"items":[...]}'
          style={{ minHeight: 180, textAlignVertical: "top" }}
          value={importText}
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button label="Load JSON file" onPress={handleLoadImportFile} variant="secondary" />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Preview import" onPress={handlePreviewImport} />
          </View>
        </View>
        {importPreview ? (
          <Card style={{ padding: 14 }}>
            {importPreview.errors.length ? (
              <View style={{ gap: 6 }}>
                <Text color={theme.colors.danger} variant="heading">
                  Validation errors
                </Text>
                {importPreview.errors.map((error) => (
                  <Text key={error} color={theme.colors.danger}>
                    {error}
                  </Text>
                ))}
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <Text variant="heading">Preview looks valid</Text>
                <Text>
                  {importPreview.payload?.categories.length ?? 0} categories and{" "}
                  {importPreview.payload?.items.length ?? 0} items will be appended.
                </Text>
                <Button
                  disabled={importing}
                  label={importing ? "Importing..." : "Commit import"}
                  onPress={handleCommitImport}
                />
              </View>
            )}
          </Card>
        ) : null}
      </Card>

      <Modal
        animationType="slide"
        onRequestClose={closeItemModal}
        visible={showItemModal}
      >
        <Page>
          <SectionHeader
            title={editingItem ? "Edit vocabulary item" : "Create vocabulary item"}
          />
          <Controller
            control={itemForm.control}
            name="categoryId"
            render={({ field, fieldState }) => (
              <TextField
                error={fieldState.error?.message}
                keyboardType="number-pad"
                label="Category ID"
                onChangeText={(value) => field.onChange(Number(value))}
                value={field.value ? String(field.value) : ""}
              />
            )}
          />
          <Text color={theme.colors.textMuted} variant="caption">
            Available categories:{" "}
            {categories.map((category) => `${category.id}=${category.name}`).join(", ")}
          </Text>
          <Controller
            control={itemForm.control}
            name="sourceText"
            render={({ field, fieldState }) => (
              <TextField
                error={fieldState.error?.message}
                label="Word or phrase"
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
          <Controller
            control={itemForm.control}
            name="targetText"
            render={({ field, fieldState }) => (
              <TextField
                error={fieldState.error?.message}
                label="Translation or explanation"
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Controller
                control={itemForm.control}
                name="sourceLanguage"
                render={({ field, fieldState }) => (
                  <TextField
                    autoCapitalize="none"
                    error={fieldState.error?.message}
                    label="Source language"
                    onChangeText={field.onChange}
                    value={field.value}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={itemForm.control}
                name="targetLanguage"
                render={({ field, fieldState }) => (
                  <TextField
                    autoCapitalize="none"
                    error={fieldState.error?.message}
                    label="Target language"
                    onChangeText={field.onChange}
                    value={field.value}
                  />
                )}
              />
            </View>
          </View>
          <Controller
            control={itemForm.control}
            name="examplesText"
            render={({ field }) => (
              <TextField
                helperText="One example per line."
                label="Examples"
                multiline
                onChangeText={field.onChange}
                style={{ minHeight: 120, textAlignVertical: "top" }}
                value={field.value}
              />
            )}
          />
          <Controller
            control={itemForm.control}
            name="synonymsText"
            render={({ field }) => (
              <TextField
                helperText="One synonym per line."
                label="Synonyms"
                multiline
                onChangeText={field.onChange}
                style={{ minHeight: 120, textAlignVertical: "top" }}
                value={field.value}
              />
            )}
          />
          <Card>
            <Text variant="heading">Image</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button
                label="No image"
                onPress={() => {
                  itemForm.setValue("imageMode", "none");
                  itemForm.setValue("imageUri", "");
                }}
                variant="secondary"
              />
              <Button
                label="Pick local image"
                onPress={pickLocalImage}
                variant="secondary"
              />
            </View>
            <Controller
              control={itemForm.control}
              name="imageUri"
              render={({ field }) => (
                <TextField
                  autoCapitalize="none"
                  helperText="Remote image URLs must be HTTPS. Batch imports support only remote URLs."
                  label="Remote image URL"
                  onChangeText={(value) => {
                    itemForm.setValue("imageMode", value ? "remote" : "none");
                    field.onChange(value);
                  }}
                  value={field.value}
                />
              )}
            />
            {itemForm.watch("imageUri") ? (
              <Image
                source={{ uri: itemForm.watch("imageUri") }}
                style={{
                  borderRadius: 18,
                  height: 180,
                  width: "100%",
                }}
              />
            ) : null}
          </Card>
          <View style={{ gap: 10 }}>
            <Button
              label={editingItem ? "Save item" : "Create item"}
              onPress={itemForm.handleSubmit(handleItemSubmit)}
            />
            <Button label="Cancel" onPress={closeItemModal} variant="ghost" />
          </View>
        </Page>
      </Modal>
    </Page>
  );
}
