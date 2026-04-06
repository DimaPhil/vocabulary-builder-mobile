import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as {
  widgetGroupIdentifier?: string;
  widgetSnapshotFileName?: string;
};

export const widgetGroupIdentifier =
  extra.widgetGroupIdentifier ??
  "group.com.dmitryfilippov.vocabularybuildermobile.shared";
export const widgetSnapshotFileName =
  extra.widgetSnapshotFileName ?? "widget-snapshot.json";
