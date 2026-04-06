import "tsx/cjs";

import type { ExpoConfig } from "expo/config";

const APP_NAME = "Vocabulary Builder";
const APP_SLUG = "vocabulary-builder-mobile";
const APP_SCHEME = "vocabularybuilder";
const BUNDLE_ID = "com.dmitryfilippov.vocabularybuildermobile";
const APP_GROUP_IDENTIFIER = "group.com.dmitryfilippov.vocabularybuildermobile.shared";

module.exports = ({ config }: { config: ExpoConfig }) =>
  ({
    ...config,
    name: APP_NAME,
    slug: APP_SLUG,
    scheme: APP_SCHEME,
    version: "0.1.0",
    orientation: "portrait",
    newArchEnabled: true,
    userInterfaceStyle: "light",
    icon: "./assets/images/icon.png",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#f6efe4",
    },
    ios: {
      bundleIdentifier: BUNDLE_ID,
      supportsTablet: false,
      infoPlist: {
        NSPhotoLibraryUsageDescription:
          "Vocabulary Builder uses your photo library so you can attach custom images to vocabulary items.",
      },
    },
    android: {
      package: BUNDLE_ID,
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#f6efe4",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-sqlite",
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "16.0",
          },
        },
      ],
      [
        "./plugins/with-ios-deployment-target",
        {
          deploymentTarget: "16.0",
        },
      ],
      [
        "react-native-widget-extension",
        {
          widgetsFolder: "widgets",
          groupIdentifier: APP_GROUP_IDENTIFIER,
          deploymentTarget: "16.0",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      widgetGroupIdentifier: APP_GROUP_IDENTIFIER,
      widgetSnapshotFileName: "widget-snapshot.json",
    },
  }) satisfies ExpoConfig;
