import { View } from "react-native";

import { Text } from "@/components/ui/Text";
import { useAppTheme } from "@/lib/theme";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeader({
  description,
  eyebrow,
  title,
}: SectionHeaderProps) {
  const theme = useAppTheme();

  return (
    <View style={{ gap: 4 }}>
      {eyebrow ? (
        <Text color={theme.colors.primary} variant="label">
          {eyebrow}
        </Text>
      ) : null}
      <Text variant="title">{title}</Text>
      {description ? (
        <Text color={theme.colors.textMuted}>{description}</Text>
      ) : null}
    </View>
  );
}
