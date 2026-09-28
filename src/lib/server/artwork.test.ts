import { describe, expect, it } from "vitest";
import { type ArtworkBucket, saveTrackArtwork } from "./artwork";

const memoryBucket = (keys: string[] = []) => {
  const objects = new Set(keys);
  const bucket: ArtworkBucket = {
    head: async (key) => (objects.has(key) ? {} : null),
    put: async (key) => objects.add(key),
  };
  return { bucket, objects };
};

describe("saveTrackArtwork", () => {
  it("should store the original and favicon from the iTunes source", async () => {
    const { bucket, objects } = memoryBucket();
    const fetched: string[] = [];
    const fetch = globalThis.fetch;
    globalThis.fetch = (async (url: string) => {
      fetched.push(url);
      return new Response(new ArrayBuffer(0));
    }) as typeof globalThis.fetch;

    try {
      await saveTrackArtwork(bucket, "abba-voulez-vous", "Music/a.jpg");
    } finally {
      globalThis.fetch = fetch;
    }

    expect([...objects].sort()).toEqual([
      "32/abba-voulez-vous.jpg",
      "640/abba-voulez-vous.jpg",
    ]);
    expect(fetched.sort()).toEqual([
      "https://is1-ssl.mzstatic.com/image/thumb/Music/a.jpg/32x32bb.jpg",
      "https://is1-ssl.mzstatic.com/image/thumb/Music/a.jpg/640x640bb.jpg",
    ]);
  });

  it("should reuse artwork already stored under the name", async () => {
    const { bucket, objects } = memoryBucket(["640/abba-voulez-vous.jpg"]);
    await saveTrackArtwork(bucket, "abba-voulez-vous", "Music/a.jpg");
    expect(objects.size).toBe(1);
  });
});
