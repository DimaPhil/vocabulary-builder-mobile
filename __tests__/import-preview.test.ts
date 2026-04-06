import { commitImportPayload, previewImportPayload } from "@/features/admin/schemas/import";

const mockCreateCategory = jest.fn();
const mockCreateVocabularyItem = jest.fn();
const mockGetCategories = jest.fn();
const mockResolveAutoImageUrl = jest.fn();
const mockSyncWidgetSnapshot = jest.fn();
const mockValidateRemoteImageUrl = jest.fn();

jest.mock("@/lib/db/repositories", () => ({
  createCategory: (...args: unknown[]) => mockCreateCategory(...args),
  createVocabularyItem: (...args: unknown[]) => mockCreateVocabularyItem(...args),
  getCategories: (...args: unknown[]) => mockGetCategories(...args),
}));

jest.mock("@/lib/images/service", () => ({
  resolveAutoImageUrl: (...args: unknown[]) => mockResolveAutoImageUrl(...args),
  validateRemoteImageUrl: (...args: unknown[]) => mockValidateRemoteImageUrl(...args),
}));

jest.mock("@/lib/widget/snapshot", () => ({
  syncWidgetSnapshot: (...args: unknown[]) => mockSyncWidgetSnapshot(...args),
}));

describe("import preview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveAutoImageUrl.mockResolvedValue(null);
    mockValidateRemoteImageUrl.mockImplementation(async (value: string) => value);
  });

  it("rejects malformed JSON", async () => {
    await expect(previewImportPayload("{")).resolves.toEqual({
      autoFilledImages: 0,
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

    expect(preview.autoFilledImages).toBe(0);
    expect(preview.errors).toEqual([]);
    expect(preview.payload?.items).toHaveLength(1);
  });

  it("auto-fills missing image URLs during preview", async () => {
    mockResolveAutoImageUrl.mockResolvedValueOnce("https://images.example.com/whisk.png");

    const preview = await previewImportPayload(
      JSON.stringify({
        categories: [{ slug: "kitchen", name: "Kitchen" }],
        items: [
          {
            category: "kitchen",
            sourceText: "whisk",
            targetText: "венчик",
            sourceLanguage: "en",
            targetLanguage: "ru",
          },
        ],
      })
    );

    expect(mockResolveAutoImageUrl).toHaveBeenCalledWith({
      categoryName: "Kitchen",
      categorySlug: "kitchen",
      sourceLanguage: "en",
      sourceText: "whisk",
      targetLanguage: "ru",
      targetText: "венчик",
    });
    expect(preview.autoFilledImages).toBe(1);
    expect(preview.errors).toEqual([]);
    expect(preview.payload?.items[0].imageUrl).toBe("https://images.example.com/whisk.png");
    expect(mockValidateRemoteImageUrl).not.toHaveBeenCalled();
  });

  it("skips auto-fill when the option is disabled", async () => {
    const preview = await previewImportPayload(
      JSON.stringify({
        categories: [{ slug: "kitchen", name: "Kitchen" }],
        items: [
          {
            category: "kitchen",
            sourceText: "whisk",
            targetText: "венчик",
            sourceLanguage: "en",
            targetLanguage: "ru",
          },
        ],
      }),
      {
        autoFillMissingImages: false,
      }
    );

    expect(mockResolveAutoImageUrl).not.toHaveBeenCalled();
    expect(preview.autoFilledImages).toBe(0);
    expect(preview.errors).toEqual([]);
    expect(preview.payload?.items[0].imageUrl).toBeUndefined();
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
