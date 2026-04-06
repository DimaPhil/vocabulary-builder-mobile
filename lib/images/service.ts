import { Directory, File, Paths } from "expo-file-system";

type AutoImageInput = {
  sourceText: string;
  targetText: string;
  sourceLanguage: string;
  targetLanguage: string;
  categoryName?: string;
  categorySlug?: string;
};

const wikipediaImageCache = new Map<string, string | null>();

export async function validateRemoteImageUrl(value: string) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error("Image URL must be a valid URL.");
  }

  if (parsedUrl.protocol !== "https:") {
    throw new Error("Image URL must use HTTPS.");
  }

  const response = await fetch(parsedUrl.toString(), {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Image URL could not be fetched.");
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.startsWith("image/")) {
    throw new Error("Image URL must point to an image resource.");
  }

  return parsedUrl.toString();
}

export async function resolveAutoImageUrl(input: AutoImageInput) {
  const searchTerm = pickEnglishSearchTerm(input);

  if (!searchTerm) {
    return null;
  }

  const cacheKey = JSON.stringify({
    categorySlug: input.categorySlug ?? "",
    searchTerm,
  });

  if (wikipediaImageCache.has(cacheKey)) {
    return wikipediaImageCache.get(cacheKey) ?? null;
  }

  const candidateQueries = buildWikipediaQueries({
    categoryName: input.categoryName,
    categorySlug: input.categorySlug,
    searchTerm,
  });

  for (const query of candidateQueries) {
    const titles = await searchWikipediaTitles(query);

    for (const title of titles) {
      const imageUrl = await fetchWikipediaThumbnail(title);

      if (!imageUrl) {
        continue;
      }

      try {
        const validated = await validateRemoteImageUrl(imageUrl);
        wikipediaImageCache.set(cacheKey, validated);
        return validated;
      } catch {
        continue;
      }
    }
  }

  wikipediaImageCache.set(cacheKey, null);
  return null;
}

export async function copyImageToAppStorage(uri: string) {
  const imageDirectory = new Directory(Paths.document, "images");
  imageDirectory.create({ idempotent: true, intermediates: true });
  const source = new File(uri);
  const extension = source.extension || ".jpg";
  const destination = new File(
    imageDirectory,
    `${Date.now()}-${Math.floor(Math.random() * 10_000)}${extension}`
  );

  source.copy(destination);

  return destination.uri;
}

function isEnglishLanguageTag(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "en" || normalized.startsWith("en-");
}

function compactWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function toTitleCase(value: string) {
  return compactWhitespace(value)
    .split(" ")
    .map((part) =>
      part.length ? `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}` : part
    )
    .join(" ");
}

function uniqueValues(values: string[]) {
  return [...new Set(values.map((value) => compactWhitespace(value)).filter(Boolean))];
}

function pickEnglishSearchTerm(input: AutoImageInput) {
  if (isEnglishLanguageTag(input.sourceLanguage)) {
    return compactWhitespace(input.sourceText);
  }

  if (isEnglishLanguageTag(input.targetLanguage)) {
    return compactWhitespace(input.targetText);
  }

  return null;
}

function buildWikipediaQueries({
  categoryName,
  categorySlug,
  searchTerm,
}: {
  categoryName?: string;
  categorySlug?: string;
  searchTerm: string;
}) {
  const categoryContext = compactWhitespace(
    categoryName || (categorySlug ? categorySlug.replace(/-/g, " ") : "")
  );

  const values = [searchTerm, toTitleCase(searchTerm)];

  if (categoryContext) {
    values.push(`${searchTerm} ${categoryContext}`);
  }

  const normalizedCategory = categoryContext.toLowerCase();

  if (normalizedCategory.includes("kitchen")) {
    values.push(
      `${searchTerm} kitchen`,
      `${searchTerm} kitchen utensil`,
      `${searchTerm} appliance`,
      `${searchTerm} cookware`
    );
  }

  return uniqueValues(values);
}

async function searchWikipediaTitles(query: string) {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("list", "search");
  url.searchParams.set("origin", "*");
  url.searchParams.set("srlimit", "5");
  url.searchParams.set("srsearch", query);

  const response = await fetch(url.toString());

  if (!response.ok) {
    return [query];
  }

  const data = (await response.json()) as {
    query?: {
      search?: {
        title: string;
      }[];
    };
  };

  return uniqueValues([
    query,
    ...(data.query?.search?.map((item) => item.title) ?? []),
  ]);
}

async function fetchWikipediaThumbnail(title: string) {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("prop", "pageimages");
  url.searchParams.set("piprop", "thumbnail");
  url.searchParams.set("pithumbsize", "1200");
  url.searchParams.set("titles", title);

  const response = await fetch(url.toString());

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          thumbnail?: {
            source?: string;
          };
        }
      >;
    };
  };

  const pages = data.query?.pages ?? {};
  const firstPage = Object.values(pages)[0];

  return firstPage?.thumbnail?.source ?? null;
}
