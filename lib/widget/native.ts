import { requireNativeModule } from "expo-modules-core";

type WidgetExtensionModule = {
  reloadAllTimelines: () => void;
};

let nativeModule: WidgetExtensionModule | null = null;

export function reloadWidgetTimelines() {
  if (!nativeModule) {
    try {
      nativeModule = requireNativeModule<WidgetExtensionModule>(
        "ReactNativeWidgetExtension"
      );
    } catch {
      nativeModule = null;
    }
  }

  nativeModule?.reloadAllTimelines();
}
