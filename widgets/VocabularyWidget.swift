import SwiftUI
import WidgetKit

private let appGroupIdentifier = "group.com.dmitryfilippov.vocabularybuildermobile.shared"
private let snapshotFileName = "widget-snapshot.json"
private let appLaunchURL = URL(string: "vocabularybuilder://widget")!
private let widgetTextPrimary = Color(red: 0.12, green: 0.10, blue: 0.08)
private let widgetTextSecondary = Color(red: 0.34, green: 0.27, blue: 0.19)

struct VocabularySnapshot: Decodable {
  let version: Int
  let generatedAt: String
  let rotationHours: Int
  let seed: String
  let items: [VocabularySnapshotItem]
}

struct VocabularySnapshotItem: Decodable {
  let id: Int
  let sourceText: String
  let targetText: String
}

struct VocabularyEntry: TimelineEntry {
  let date: Date
  let item: VocabularySnapshotItem?
  let rotationHours: Int
}

struct VocabularyProvider: TimelineProvider {
  func placeholder(in context: Context) -> VocabularyEntry {
    VocabularyEntry(
      date: Date(),
      item: VocabularySnapshotItem(id: 0, sourceText: "ephemeral", targetText: "short-lived"),
      rotationHours: 1
    )
  }

  func getSnapshot(in context: Context, completion: @escaping (VocabularyEntry) -> Void) {
    completion(makeEntry(for: Date()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<VocabularyEntry>) -> Void) {
    let now = Date()
    let entry = makeEntry(for: now)
    let nextRefresh = Calendar.current.date(
      byAdding: .hour,
      value: max(entry.rotationHours, 1),
      to: now
    ) ?? now.addingTimeInterval(Double(max(entry.rotationHours, 1)) * 3600)

    completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
  }

  private func makeEntry(for date: Date) -> VocabularyEntry {
    guard let snapshot = readSnapshot() else {
      return VocabularyEntry(date: date, item: nil, rotationHours: 1)
    }

    let item = selectItem(snapshot: snapshot, date: date)
    return VocabularyEntry(
      date: date,
      item: item,
      rotationHours: max(snapshot.rotationHours, 1)
    )
  }

  private func readSnapshot() -> VocabularySnapshot? {
    guard
      let containerURL = FileManager.default.containerURL(
        forSecurityApplicationGroupIdentifier: appGroupIdentifier
      )
    else {
      return nil
    }

    let fileURL = containerURL.appendingPathComponent(snapshotFileName)

    guard
      let data = try? Data(contentsOf: fileURL),
      let snapshot = try? JSONDecoder().decode(VocabularySnapshot.self, from: data)
    else {
      return nil
    }

    return snapshot
  }

  private func selectItem(snapshot: VocabularySnapshot, date: Date) -> VocabularySnapshotItem? {
    guard !snapshot.items.isEmpty else {
      return nil
    }

    let slot = Int(date.timeIntervalSince1970) / max(snapshot.rotationHours, 1) / 3600
    let index = fnv1aHash("\(snapshot.seed):\(slot)") % snapshot.items.count

    return snapshot.items[index]
  }

  private func fnv1aHash(_ value: String) -> Int {
    let bytes = Array(value.utf8)
    var hash: UInt32 = 2166136261

    for byte in bytes {
      hash ^= UInt32(byte)
      hash = hash &* 16777619
    }

    return Int(hash)
  }
}

struct VocabularyWordWidget: Widget {
  let kind = "VocabularyWordWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: VocabularyProvider()) { entry in
      VocabularyWordWidgetView(entry: entry)
        .widgetURL(appLaunchURL)
        .widgetContainerBackground {
          VocabularyWidgetBackground()
        }
    }
    .configurationDisplayName("Vocabulary Rotation")
    .description("Shows a rotating word from your personal vocabulary database.")
    .supportedFamilies([
      .systemSmall,
      .systemMedium,
      .accessoryInline,
      .accessoryCircular,
      .accessoryRectangular,
    ])
  }
}

struct VocabularyWordWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: VocabularyProvider.Entry

  var body: some View {
    content
  }

  @ViewBuilder
  private var content: some View {
    switch family {
    case .accessoryInline:
      inlineAccessoryContent
    case .accessoryCircular:
      circularAccessoryContent
    case .accessoryRectangular:
      rectangularAccessoryContent
    default:
      homeScreenContent
    }
  }

  private var homeScreenContent: some View {
    VStack(alignment: .leading, spacing: 0) {
      Text("Vocabulary")
        .font(.system(size: 17, weight: .semibold, design: .rounded))
        .foregroundStyle(widgetTextPrimary)

      Spacer(minLength: 12)

      if let item = entry.item {
        VStack(alignment: .leading, spacing: 6) {
          Text(item.sourceText)
            .font(.system(size: 22, weight: .bold, design: .rounded))
            .foregroundStyle(widgetTextPrimary)
            .lineLimit(1)
            .minimumScaleFactor(0.7)
          Text(item.targetText)
            .font(.system(size: 18, weight: .semibold, design: .rounded))
            .foregroundStyle(widgetTextSecondary)
            .lineLimit(1)
            .minimumScaleFactor(0.7)
        }
      } else {
        VStack(alignment: .leading, spacing: 6) {
          Text("No words yet")
            .font(.system(size: 20, weight: .bold, design: .rounded))
            .foregroundStyle(widgetTextPrimary)
          Text("Add your first vocabulary item in the app.")
            .font(.system(size: 14, weight: .medium, design: .rounded))
            .foregroundStyle(widgetTextSecondary)
        }
      }

      Spacer()

      Text("Updates every \(entry.rotationHours)h")
        .font(.system(size: 13, weight: .medium, design: .rounded))
        .foregroundStyle(widgetTextSecondary)
    }
    .padding(16)
  }

  private var inlineAccessoryContent: some View {
    Group {
      if let item = entry.item {
        Text(item.sourceText)
      } else {
        Text("Vocabulary")
      }
    }
    .font(.system(size: 13, weight: .semibold, design: .rounded))
  }

  private var circularAccessoryContent: some View {
    ZStack {
      AccessoryWidgetBackground()

      if let item = entry.item {
        VStack(spacing: 2) {
          Text(shortToken(for: item.sourceText))
            .font(.system(size: 18, weight: .bold, design: .rounded))
            .minimumScaleFactor(0.5)
          Text(shortToken(for: item.targetText))
            .font(.system(size: 11, weight: .semibold, design: .rounded))
            .foregroundStyle(.secondary)
            .minimumScaleFactor(0.5)
        }
        .padding(6)
      } else {
        Image(systemName: "book.closed")
          .font(.system(size: 18, weight: .semibold))
      }
    }
  }

  private var rectangularAccessoryContent: some View {
    VStack(alignment: .leading, spacing: 2) {
      if let item = entry.item {
        Text(item.sourceText)
          .font(.system(size: 20, weight: .bold, design: .rounded))
          .lineLimit(1)
          .minimumScaleFactor(0.75)
        Text(item.targetText)
          .font(.system(size: 15, weight: .semibold, design: .rounded))
          .foregroundStyle(.secondary)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
      } else {
        Text("Vocabulary")
          .font(.system(size: 18, weight: .bold, design: .rounded))
        Text("Add words")
          .font(.system(size: 13, weight: .semibold, design: .rounded))
          .foregroundStyle(.secondary)
      }
    }
    .padding(.vertical, 2)
  }

  private func shortToken(for value: String) -> String {
    let token = value
      .split(whereSeparator: \.isWhitespace)
      .first
      .map(String.init)?
      .trimmingCharacters(in: .punctuationCharacters) ?? value

    return String(token.prefix(8))
  }
}

private struct VocabularyWidgetBackground: View {
  var body: some View {
    ZStack {
      LinearGradient(
        colors: [
          Color(red: 0.99, green: 0.97, blue: 0.93),
          Color(red: 0.95, green: 0.89, blue: 0.79),
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
      )

      RoundedRectangle(cornerRadius: 24, style: .continuous)
        .fill(Color.white.opacity(0.38))
        .padding(8)

      RoundedRectangle(cornerRadius: 24, style: .continuous)
        .stroke(Color.white.opacity(0.5), lineWidth: 1)
        .padding(8)
    }
  }
}

private struct AccessoryWidgetBackground: View {
  var body: some View {
    Circle()
      .fill(.tertiary)
  }
}

private extension View {
  @ViewBuilder
  func widgetContainerBackground<Background: View>(
    @ViewBuilder _ background: () -> Background
  ) -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      self.containerBackground(for: .widget, content: background)
    } else {
      self.background(background())
    }
  }
}
