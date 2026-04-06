import { Directory, File, Paths } from "expo-file-system";

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
