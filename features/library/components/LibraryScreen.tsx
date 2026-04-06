import { useAtom } from "jotai";
import { useDeferredValue } from "react";
import { Image, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Page } from "@/components/ui/Page";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Text } from "@/components/ui/Text";
import { TextField } from "@/components/ui/TextField";
import { libraryFiltersAtom } from "@/features/library/atoms/filters";
import { useCategoriesQuery, useVocabularyItemsQuery } from "@/hooks/useVocabularyData";
import { useAppTheme } from "@/lib/theme";

export function LibraryScreen() {
  const theme = useAppTheme();
  const { data: categories = [] } = useCategoriesQuery();
  const { data: items = [] } = useVocabularyItemsQuery();
  const [filters, setFilters] = useAtom(libraryFiltersAtom);
  const deferredSearch = useDeferredValue(filters.search);

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      filters.categoryIds.length === 0 ||
      filters.categoryIds.includes(item.categoryId);
    const query = deferredSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.sourceText.toLowerCase().includes(query) ||
      item.targetText.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <Page>
      <SectionHeader
        eyebrow="Library"
        title="Search the full vocabulary set"
        description="Filter by category, inspect examples, and confirm what will show up in practice and the widget."
      />

      <TextField
        label="Search"
        onChangeText={(search) => setFilters((current) => ({ ...current, search }))}
        placeholder="Search source text or translation"
        value={filters.search}
      />

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {categories.map((category) => {
          const active = filters.categoryIds.includes(category.id);

          return (
            <Chip
              key={category.id}
              active={active}
              label={category.name}
              onPress={() =>
                setFilters((current) => ({
                  ...current,
                  categoryIds: active
                    ? current.categoryIds.filter((id) => id !== category.id)
                    : [...current.categoryIds, category.id],
                }))
              }
            />
          );
        })}
      </View>

      {filteredItems.length ? (
        <View style={{ gap: 12 }}>
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <Text variant="heading">{item.sourceText}</Text>
              <Text>{item.targetText}</Text>
              <Text color={theme.colors.textMuted} variant="caption">
                {item.categoryName} • {item.sourceLanguage} → {item.targetLanguage}
              </Text>
              {item.synonyms.length ? (
                <Text color={theme.colors.textMuted}>
                  Synonyms: {item.synonyms.join(", ")}
                </Text>
              ) : null}
              {item.examples.length ? (
                <View style={{ gap: 4 }}>
                  <Text variant="label">Examples</Text>
                  {item.examples.map((example) => (
                    <Text key={example} color={theme.colors.textMuted}>
                      {example}
                    </Text>
                  ))}
                </View>
              ) : null}
              {item.imageUri ? (
                <Image
                  source={{ uri: item.imageUri }}
                  style={{
                    borderRadius: 18,
                    height: 160,
                    width: "100%",
                  }}
                />
              ) : null}
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState
          title="No matches"
          description="Try clearing filters or add more vocabulary items from the Admin screen."
        />
      )}
    </Page>
  );
}
