import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";
import type { SQLiteDatabase } from "expo-sqlite";

import {
  DEFAULT_WIDGET_ROTATION_HOURS,
  WIDGET_SNAPSHOT_VERSION,
} from "@/lib/constants/app";
import {
  getAllVocabularyItems,
  getAppSettings,
} from "@/lib/db/repositories";
import type { WidgetSnapshot } from "@/lib/types";
import { isoNow } from "@/lib/utils/date";
import { createSeed } from "@/lib/utils/random";
import { widgetGroupIdentifier, widgetSnapshotFileName } from "@/lib/widget/constants";
import { reloadWidgetTimelines } from "@/lib/widget/native";

export async function buildWidgetSnapshot(
  db: SQLiteDatabase
): Promise<WidgetSnapshot> {
  const [items, settings] = await Promise.all([
    getAllVocabularyItems(db),
    getAppSettings(db),
  ]);

  return {
    version: WIDGET_SNAPSHOT_VERSION,
    generatedAt: isoNow(),
    rotationHours:
      settings.widgetRotationHours ?? DEFAULT_WIDGET_ROTATION_HOURS,
    seed: settings.widgetSeed || createSeed(),
    items: items.map((item) => ({
      id: item.id,
      sourceText: item.sourceText,
      targetText: item.targetText,
    })),
  };
}

export async function saveWidgetSnapshot(snapshot: WidgetSnapshot) {
  if (Platform.OS !== "ios") {
    return;
  }

  const groupDirectory = Paths.appleSharedContainers[widgetGroupIdentifier];

  if (!groupDirectory) {
    return;
  }

  groupDirectory.create({ idempotent: true, intermediates: true });
  const snapshotFile = new File(groupDirectory, widgetSnapshotFileName);
  snapshotFile.create({ overwrite: true, intermediates: true });
  snapshotFile.write(JSON.stringify(snapshot));
  reloadWidgetTimelines();
}

export async function syncWidgetSnapshot(db: SQLiteDatabase) {
  const snapshot = await buildWidgetSnapshot(db);
  await saveWidgetSnapshot(snapshot);
  return snapshot;
}

export async function readWidgetSnapshot() {
  if (Platform.OS !== "ios") {
    return null;
  }

  const groupDirectory = Paths.appleSharedContainers[widgetGroupIdentifier];

  if (!groupDirectory) {
    return null;
  }

  const snapshotFile = new File(groupDirectory, widgetSnapshotFileName);

  if (!snapshotFile.exists) {
    return null;
  }

  return JSON.parse(await snapshotFile.text()) as WidgetSnapshot;
}
