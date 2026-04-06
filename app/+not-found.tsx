import { Link } from "expo-router";
import { View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Page } from "@/components/ui/Page";
import { Text } from "@/components/ui/Text";

export default function NotFoundScreen() {
  return (
    <Page contentContainerStyle={{ justifyContent: "center", flexGrow: 1 }}>
      <View style={{ gap: 16 }}>
        <Text variant="title">This screen does not exist.</Text>
        <Link href="/" asChild>
          <Button label="Back home" />
        </Link>
      </View>
    </Page>
  );
}
