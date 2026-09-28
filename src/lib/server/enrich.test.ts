import { afterEach, describe, expect, it, vi } from "vitest";
import type { ITunesTrack } from "$lib/itunes";
import { findDeezerMatch, getAudioFeatures, NO_AUDIO_FEATURES } from "./enrich";

const mockFetch = (...bodies: unknown[]) => {
  const fetch = vi.fn();
  for (const body of bodies) fetch.mockResolvedValueOnce(Response.json(body));
  vi.stubGlobal("fetch", fetch);
  return fetch;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

const track = {
  trackId: 1,
  trackName: "the 1",
  artistId: 1,
  artistName: "Taylor Swift",
  collectionName: "folklore",
  releaseDate: "2020-07-24T07:00:00Z",
  artwork: "",
  trackTimeMillis: 210240,
  trackViewUrl: "",
} satisfies ITunesTrack;

const candidate = (
  id: number,
  title: string,
  duration: number,
  artist = "Taylor Swift",
) => ({
  id,
  title,
  duration,
  artist: { name: artist },
});

describe("findDeezerMatch", () => {
  it("should match by title, artist, and length", async () => {
    const fetch = mockFetch(
      {
        data: [
          candidate(1, "the 1", 240),
          candidate(2, "the 1", 210),
          candidate(3, "the 1", 210, "Karaoke Stars"),
        ],
      },
      {
        isrc: "usug12002835",
        album: { id: 9 },
        contributors: [{ name: "Taylor Swift" }],
      },
      { upc: "602435034775" },
    );

    expect(await findDeezerMatch(track)).toEqual({
      isrc: "USUG12002835",
      upc: "602435034775",
      artists: ["Taylor Swift"],
    });
    expect(fetch.mock.calls[1][0]).toBe("https://api.deezer.com/track/2");
  });

  it("should match titles that differ only in their subtitle", async () => {
    mockFetch(
      {
        data: [
          candidate(
            7,
            "Turn, Turn, Turn! / To Everything There Is a Season",
            216,
            "Judy Collins",
          ),
        ],
      },
      { isrc: "USEE10301047", album: { id: 9 }, contributors: [] },
      { upc: "603497948680" },
    );

    const match = await findDeezerMatch({
      ...track,
      trackName: "Turn, Turn, Turn! (To Everything There Is a Season)",
      artistName: "Judy Collins",
      trackTimeMillis: 220266,
    });

    expect(match).toMatchObject({
      isrc: "USEE10301047",
      artists: ["Judy Collins"],
    });
  });

  it.each([
    ["a different title", candidate(1, "the 2", 210)],
    [
      "a longer title with a different length",
      candidate(1, "the 1 so bad", 152),
    ],
  ])("should reject %s", async (_, data) => {
    mockFetch({ data: [data] });
    expect(await findDeezerMatch(track)).toBeNull();
  });

  it("should reject Deezer error bodies", async () => {
    mockFetch({ error: { message: "Quota limit exceeded" } });
    await expect(findDeezerMatch(track)).rejects.toThrow("Quota");
  });
});

describe("getAudioFeatures", () => {
  it("should map the first ReccoBeats result", async () => {
    mockFetch({
      content: [
        {
          href: "https://open.spotify.com/track/0Jlcvv8IykzHaSmj49uNW8",
          energy: 0.357,
          tempo: 139.884,
        },
      ],
    });

    expect(await getAudioFeatures("USUG12002835")).toMatchObject({
      spotify_url: "https://open.spotify.com/track/0Jlcvv8IykzHaSmj49uNW8",
      energy: 0.357,
      tempo: 139.884,
    });
  });

  it("should return empty features when the ISRC is unknown", async () => {
    mockFetch({ content: [] });
    expect(await getAudioFeatures("XX0000000000")).toEqual(NO_AUDIO_FEATURES);
  });
});
