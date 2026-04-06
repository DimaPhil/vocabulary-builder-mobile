import SwiftUI
import WidgetKit

private let appGroupIdentifier = "group.com.dmitryfilippov.vocabularybuildermobile.shared"
private let snapshotFileName = "widget-snapshot.json"

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
    }
    .configurationDisplayName("Vocabulary Rotation")
    .description("Shows a rotating word from your personal vocabulary database.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

struct VocabularyWordWidgetView: View {
  let entry: VocabularyProvider.Entry

  var body: some View {
    ZStack {
      LinearGradient(
        colors: [
          Color(red: 0.96, green: 0.92, blue: 0.86),
          Color(red: 0.92, green: 0.84, blue: 0.73)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
      )

      VStack(alignment: .leading, spacing: 8) {
        Text("Vocabulary")
          .font(.caption)
          .foregroundStyle(.secondary)

        if let item = entry.item {
          Text(item.sourceText)
            .font(.system(size: 20, weight: .bold, design: .rounded))
            .minimumScaleFactor(0.7)
          Text(item.targetText)
            .font(.system(size: 14, weight: .medium, design: .rounded))
            .foregroundStyle(.secondary)
            .minimumScaleFactor(0.7)
        } else {
          Text("No words yet")
            .font(.system(size: 18, weight: .bold, design: .rounded))
          Text("Add your first vocabulary item in the app.")
            .font(.footnote)
            .foregroundStyle(.secondary)
        }

        Spacer()

        Text("Updates every \(entry.rotationHours)h")
          .font(.caption2)
          .foregroundStyle(.secondary)
      }
      .padding(16)
    }
  }
}
