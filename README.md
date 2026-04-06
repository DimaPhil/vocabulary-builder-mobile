# Vocabulary Builder Mobile

Vocabulary Builder Mobile is an iOS-first Expo / React Native app for building and practicing a personal vocabulary library. It is designed for small-scale personal use, with all data stored locally on the device and a companion home screen widget that rotates through saved words.

## Highlights

- Local-first vocabulary management with SQLite
- Category-based organization
- Single-item CRUD plus JSON batch import
- Configurable source and target languages
- Optional examples, synonyms, and images
- Practice sessions with two study directions
- iOS home screen widget with hourly rotation
- CI checks for linting, typechecking, tests, and coverage

## Product Scope

This MVP focuses on:

- iOS first
- Personal usage
- No backend or sign-in
- Local storage only
- Single-category vocabulary items

The current UX targets large iPhones, with explicit support for devices in the iPhone 15 Pro Max and iPhone 17 Pro class.

## Tech Stack

- Expo 54
- React Native 0.81
- Expo Router
- TypeScript with strict checking
- `expo-sqlite` for persistent app data
- Jotai for lightweight client state
- MMKV for local UI preferences
- Zod for validation
- Jest + Testing Library for tests
- GitHub Actions for CI
- Native iOS widget extension via `react-native-widget-extension`

## Core Features

### Vocabulary Admin

- Create, edit, and delete categories
- Create, edit, and delete vocabulary items
- Store:
  - source text
  - translation or explanation
  - source language
  - target language
  - optional examples
  - optional synonyms
  - optional image
- Add images from:
  - local photo library
  - remote image URL
  - automatic Wikimedia/Wikipedia lookup where possible

### Batch Import

- Import one JSON payload with categories and items
- Validate the entire payload before commit
- Append-only import behavior
- Optional auto-fill for missing item images during preview

### Practice

- Practice the whole vocabulary set or selected categories
- `source -> translation`
- `translation -> source`
- Optional image hints
- Optional masked examples
- Explicit session exit actions so the user can always go back to Practice or Home

### Widget

- Shows a deterministic rotating word and its translation
- Rotation interval is configurable in Admin
- Uses a lightweight shared snapshot instead of reading the full SQLite schema directly

## JSON Import Format

```json
{
  "categories": [
    {
      "slug": "kitchen",
      "name": "Kitchen"
    }
  ],
  "items": [
    {
      "category": "kitchen",
      "sourceText": "whisk",
      "targetText": "венчик",
      "sourceLanguage": "en",
      "targetLanguage": "ru",
      "examples": ["Whisk the eggs until they are smooth."],
      "synonyms": [],
      "imageUrl": "https://example.com/whisk.jpg"
    }
  ]
}
```

## Local Development

### Prerequisites

- macOS
- Xcode
- iOS Simulator runtime installed
- Node.js 22
- CocoaPods

Recommended setup:

```bash
xcode-select --install
brew install cocoapods
```

If you use `nvm`:

```bash
nvm install 22
nvm use 22
```

### Install Dependencies

```bash
npm install
```

### Run Quality Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run ci:check
```

### Run on the iOS Simulator

```bash
npm run start:clear
```

In a separate terminal:

```bash
npm run ios
```

Or target a specific simulator:

```bash
npx expo run:ios --device "iPhone 16 Pro Max"
```

If native assets or native config change, regenerate iOS first:

```bash
npm run prebuild:ios
```

## Install on a Physical iPhone

Because this app includes a native widget extension, it must be installed as a native development build or release build. Expo Go is not enough.

### Option 1: Xcode Direct Install

1. Install dependencies with `npm install`.
2. Generate native iOS files:

```bash
npm run prebuild:ios
```

3. Open `ios/VocabularyBuilder.xcworkspace`.

4. In Xcode:
   - select your iPhone as the run target
   - set your Apple Developer Team under Signing & Capabilities for both the main app target and the widget target
   - build and run

This installs the app directly onto your iPhone.

### Option 2: EAS Build

If you want distributable builds instead of direct Xcode deployment:

```bash
npx eas login
npx eas build --platform ios --profile preview
```

Then install the generated build through the link or artifact provided by EAS.

## Widget Notes

- The widget is iOS-only in this MVP
- After adding or editing vocabulary, the app refreshes the shared widget snapshot
- Add the widget from the iPhone home screen after launching the app once

## CI

GitHub Actions runs:

- lint
- typecheck
- tests
- coverage
- macOS iOS build verification

For merge protection, configure branch protection in GitHub and require the `quality` and `ios-build` checks.

## Git Hooks

Husky hooks are configured to catch issues earlier:

- `pre-commit`: lint staged files
- `pre-push`: lint, typecheck, and tests

## Project Structure

```text
app/                Expo Router route entry points
components/         Shared UI primitives
features/           Feature-first screens, state, and schemas
hooks/              Query and domain hooks
lib/                Shared infrastructure and utilities
widgets/            Native iOS widget extension
__tests__/          Unit and integration-oriented tests
```

## Current Status

This repository contains the MVP implementation, including local vocabulary management, practice mode, widget support, automated import validation, and CI setup. Android is intentionally deferred for now.
