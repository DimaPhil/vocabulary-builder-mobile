import { View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { useAppTheme } from "@/lib/theme";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ description, title }: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <Card>
      <View style={{ gap: 8 }}>
        <Text variant="heading">{title}</Text>
        <Text color={theme.colors.textMuted}>{description}</Text>
      </View>
    </Card>
  );
}
