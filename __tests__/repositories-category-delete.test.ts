import { deleteCategory } from "@/lib/db/repositories";

describe("deleteCategory", () => {
  it("deletes category items before deleting the category when requested", async () => {
    const runAsync = jest.fn().mockResolvedValue(undefined);
    const db = { runAsync } as never;

    await deleteCategory(db, 7, { deleteItems: true });

    expect(runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("DELETE FROM vocabulary_items"),
      7
    );
    expect(runAsync).toHaveBeenNthCalledWith(
      2,
      "DELETE FROM categories WHERE id = ?",
      7
    );
  });

  it("reassigns items before deleting the category when a fallback category is provided", async () => {
    const runAsync = jest.fn().mockResolvedValue(undefined);
    const db = { runAsync } as never;

    await deleteCategory(db, 7, { reassignToCategoryId: 9 });

    expect(runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("UPDATE vocabulary_items"),
      9,
      expect.any(String),
      7
    );
    expect(runAsync).toHaveBeenNthCalledWith(
      2,
      "DELETE FROM categories WHERE id = ?",
      7
    );
  });
});
