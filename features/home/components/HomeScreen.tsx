import { Link } from "expo-router";
import { View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Page } from "@/components/ui/Page";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Text } from "@/components/ui/Text";
import { useCategoriesQuery, useSettingsQuery, useStatsQuery, useVocabularyItemsQuery } from "@/hooks/useVocabularyData";
import { selectWidgetItem } from "@/lib/widget/selection";

export function HomeScreen() {
  const statsQuery = useStatsQuery();
  const itemsQuery = useVocabularyItemsQuery();
  const categoriesQuery = useCategoriesQuery();
  const settingsQuery = useSettingsQuery();

  const widgetPreview =
    itemsQuery.data && settingsQuery.data
      ? selectWidgetItem(
          {
            version: 1,
            generatedAt: new Date().toISOString(),
            rotationHours: settingsQuery.data.widgetRotationHours,
            seed: settingsQuery.data.widgetSeed,
            items: itemsQuery.data.map((item) => ({
              id: item.id,
              sourceText: item.sourceText,
              targetText: item.targetText,
            })),
          },
          new Date()
        )
      : null;

  return (
    <Page>
      <SectionHeader
        eyebrow="Vocabulary Builder"
        title="Train your own words, without the overhead."
        description="Everything stays on-device, the widget rotates automatically, and practice sessions stay fast even with a large personal vocabulary set."
      />

      <View style={{ flexDirection: "row", gap: 12 }}>
        <StatCard
          label="Words"
          value={statsQuery.data?.totalItems ?? 0}
        />
        <StatCard
          label="Categories"
          value={statsQuery.data?.totalCategories ?? 0}
        />
        <StatCard
          label="With images"
          value={statsQuery.data?.withImages ?? 0}
        />
      </View>

      <Card>
        <Text variant="heading">Quick actions</Text>
        <View style={{ gap: 10 }}>
          <Link href="/(tabs)/practice" asChild>
            <Button label="Start practice" />
          </Link>
          <Link href="/(tabs)/admin" asChild>
            <Button label="Manage vocabulary" variant="secondary" />
          </Link>
          <Link href="/(tabs)/library" asChild>
            <Button label="Browse library" variant="ghost" />
          </Link>
        </View>
      </Card>

      {widgetPreview ? (
        <Card>
          <Text variant="heading">Widget preview</Text>
          <Text variant="label">Current rotation</Text>
          <Text variant="display">{widgetPreview.sourceText}</Text>
          <Text>{widgetPreview.targetText}</Text>
          <Text variant="caption">
            Rotates every {settingsQuery.data?.widgetRotationHours ?? 1} hour(s).
          </Text>
        </Card>
      ) : (
        <EmptyState
          title="Widget preview is empty"
          description="Add at least one vocabulary item from Admin to start the hourly widget rotation."
        />
      )}

      <Card>
        <Text variant="heading">Coverage</Text>
        {categoriesQuery.data?.length ? (
          <View style={{ gap: 8 }}>
            {categoriesQuery.data.slice(0, 6).map((category) => (
              <Text key={category.id}>{category.name}</Text>
            ))}
          </View>
        ) : (
          <Text>No categories yet.</Text>
        )}
      </Card>
    </Page>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card style={{ flex: 1 }}>
      <Text variant="label">{label}</Text>
      <Text variant="display">{value}</Text>
    </Card>
  );
}
