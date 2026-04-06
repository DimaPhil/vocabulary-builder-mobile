import { getWidgetSlot, selectWidgetItem } from "@/lib/widget/selection";

describe("widget selection", () => {
  it("calculates slots based on rotation hours", () => {
    expect(getWidgetSlot(new Date("2026-01-01T02:00:00.000Z"), 1)).toBe(490898);
  });

  it("deterministically selects an item for a slot", () => {
    const snapshot = {
      version: 1,
      generatedAt: "2026-01-01T00:00:00.000Z",
      rotationHours: 1,
      seed: "abc",
      items: [
        { id: 1, sourceText: "word-1", targetText: "meaning-1" },
        { id: 2, sourceText: "word-2", targetText: "meaning-2" },
      ],
    };

    const itemA = selectWidgetItem(snapshot, new Date("2026-01-01T02:00:00.000Z"));
    const itemB = selectWidgetItem(snapshot, new Date("2026-01-01T02:30:00.000Z"));

    expect(itemA).toEqual(itemB);
  });

  it("returns null when snapshot has no items", () => {
    expect(
      selectWidgetItem({
        version: 1,
        generatedAt: "2026-01-01T00:00:00.000Z",
        rotationHours: 1,
        seed: "abc",
        items: [],
      })
    ).toBeNull();
  });
});
