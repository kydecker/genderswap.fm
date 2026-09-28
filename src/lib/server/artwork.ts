import {
  ARTWORK_SIZE,
  ARTWORK_WIDTHS,
  artworkKey,
  artworkWidthKey,
  FAVICON_SIZE,
  faviconKey,
  itunesArtworkUrl,
  WEBP_QUALITY,
} from "../artwork.ts";

export type ArtworkBucket = {
  head(key: string): Promise<unknown>;
  put(
    key: string,
    value: ArrayBuffer,
    options: { httpMetadata: { contentType: string; cacheControl: string } },
  ): Promise<unknown>;
};

const CACHE_CONTROL = "public, max-age=31536000, immutable";

const storeFile = async (
  bucket: ArtworkBucket,
  key: string,
  url: string,
  contentType: string,
) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  await bucket.put(key, await response.arrayBuffer(), {
    httpMetadata: { contentType, cacheControl: CACHE_CONTROL },
  });
};

export const saveTrackArtwork = async (
  bucket: ArtworkBucket,
  name: string,
  artwork: string,
) => {
  if (await bucket.head(artworkKey(name))) return name;
  await Promise.all([
    storeFile(
      bucket,
      artworkKey(name),
      itunesArtworkUrl(artwork, ARTWORK_SIZE, "jpg"),
      "image/jpeg",
    ),
    storeFile(
      bucket,
      faviconKey(name),
      itunesArtworkUrl(artwork, FAVICON_SIZE, "jpg"),
      "image/jpeg",
    ),
    ...ARTWORK_WIDTHS.map((width) =>
      storeFile(
        bucket,
        artworkWidthKey(name, width),
        itunesArtworkUrl(artwork, width, "webp", WEBP_QUALITY),
        "image/webp",
      ),
    ),
  ]);
  return name;
};
