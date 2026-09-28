import {
  ARTWORK_SIZE,
  artworkKey,
  FAVICON_SIZE,
  faviconKey,
  sourceArtworkUrl,
} from "../artwork.ts";

export type ArtworkBucket = {
  head(key: string): Promise<unknown>;
  put(
    key: string,
    value: ArrayBuffer,
    options: { httpMetadata: { contentType: string; cacheControl: string } },
  ): Promise<unknown>;
};

export type ArtworkLoader = (size: number) => Promise<ArrayBuffer>;

const CACHE_CONTROL = "public, max-age=31536000, immutable";

export const artworkFiles = (name: string) => [
  { key: artworkKey(name), size: ARTWORK_SIZE },
  { key: faviconKey(name), size: FAVICON_SIZE },
];

export const loadSourceArtwork =
  (source: string): ArtworkLoader =>
  async (size) => {
    const url = sourceArtworkUrl(source, size, "jpg");
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status}: ${url}`);
    return response.arrayBuffer();
  };

export const storeArtwork = (
  bucket: ArtworkBucket,
  name: string,
  load: ArtworkLoader,
) =>
  Promise.all(
    artworkFiles(name).map(async ({ key, size }) =>
      bucket.put(key, await load(size), {
        httpMetadata: {
          contentType: "image/jpeg",
          cacheControl: CACHE_CONTROL,
        },
      }),
    ),
  );

export const saveTrackArtwork = async (
  bucket: ArtworkBucket,
  name: string,
  source: string,
) => {
  if (!(await bucket.head(artworkKey(name)))) {
    await storeArtwork(bucket, name, loadSourceArtwork(source));
  }
  return name;
};
