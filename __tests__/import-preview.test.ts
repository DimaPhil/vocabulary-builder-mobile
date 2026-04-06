import { commitImportPayload, previewImportPayload } from "@/features/admin/schemas/import";

const mockCreateCategory = jest.fn();
const mockCreateVocabularyItem = jest.fn();
const mockGetCategories = jest.fn();
const mockSyncWidgetSnapshot = jest.fn();

jest.mock("@/lib/db/repositories", () => ({
  createCategory: (...args: unknown[]) => mockCreateCategory(...args),
  createVocabularyItem: (...args: unknown[]) => mockCreateVocabularyItem(...args),
  getCategories: (...args: unknown[]) => mockGetCategories(...args),
}));

jest.mock("@/lib/widget/snapshot", () => ({
  syncWidgetSnapshot: (...args: unknown[]) => mockSyncWidgetSnapshot(...args),
}));

describe("import preview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects malformed JSON", async () => {
    await expect(previewImportPayload("{")).resolves.toEqual({
      errors: ["Import must be valid JSON."],
      payload: null,
    });
  });

  it("flags duplicate category slugs", async () => {
    const preview = await previewImportPayload(
      JSON.stringify({
        categories: [
          { slug: "kitchen", name: "Kitchen" },
          { slug: "kitchen", name: "Kitchen 2" },
        ],
        items: [],
      })
    );

    expect(preview.errors[0]).toContain('duplicate slug "kitchen"');
  });

  it("accepts a valid payload with image URLs", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => "image/png",
      },
    }) as unknown as typeof fetch;

    const preview = await previewImportPayload(
      JSON.stringify({
        categories: [{ slug: "kitchen", name: "Kitchen" }],
        items: [
          {
            category: "kitchen",
            sourceText: "whisk",
            targetText: "a kitchen tool",
            sourceLanguage: "en",
            targetLanguage: "en",
            imageUrl: "https://example.com/image.png",
          },
        ],
      })
    );

    expect(preview.errors).toEqual([]);
    expect(preview.payload?.items).toHaveLength(1);
  });

  it("commits imported categories and items", async () => {
    const db = {} as never;

    mockGetCategories
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 10, slug: "kitchen", name: "Kitchen" }]);

    await commitImportPayload(db, {
      categories: [{ slug: "kitchen", name: "Kitchen" }],
      items: [
        {
          category: "kitchen",
          sourceText: "whisk",
          targetText: "a kitchen tool",
          sourceLanguage: "en",
          targetLanguage: "en",
          examples: [],
          synonyms: [],
        },
      ],
    });

    expect(mockCreateCategory).toHaveBeenCalledTimes(1);
    expect(mockCreateVocabularyItem).toHaveBeenCalledTimes(1);
    expect(mockSyncWidgetSnapshot).toHaveBeenCalledWith(db);
  });
});
