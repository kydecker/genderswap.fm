import { afterEach, describe, expect, it, vi } from "vitest";
import type { ITunesTrack } from "$lib/itunes";
import { findDeezerMatch, getAudioFeatures } from "./enrich";

const mockFetch = (...bodies: unknown[]) => {
  const fetch = vi.fn();
  for (const body of bodies) {
    fetch.mockResolvedValueOnce(Response.json(body));
  }
  vi.stubGlobal("fetch", fetch);
  return fetch;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

const track = {
  wrapperType: "track",
  kind: "song",
  trackId: 1524793743,
  trackName: "the 1",
  artistId: 159260351,
  artistName: "Taylor Swift",
  collectionId: 1524793738,
  collectionName: "folklore",
  releaseDate: "2020-07-24T07:00:00Z",
  artworkUrl100: "",
  trackTimeMillis: 210240,
  trackViewUrl: "",
} satisfies ITunesTrack;

describe("findDeezerMatch", () => {
  it("should match by title, artist, and length", async () => {
    const fetch = mockFetch(
      {
        data: [
          {
            id: 1,
            title: "the 1",
            duration: 240,
            artist: { name: "Taylor Swift" },
          },
          {
            id: 2,
            title: "the 1",
            duration: 210,
            artist: { name: "Taylor Swift" },
          },
          {
            id: 3,
            title: "the 1",
            duration: 210,
            artist: { name: "Karaoke Stars" },
          },
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
    const fetch = mockFetch(
      {
        data: [
          {
            id: 7,
            title: "Turn, Turn, Turn! / To Everything There Is a Season",
            duration: 216,
            artist: { name: "Judy Collins" },
          },
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

    expect(match?.isrc).toBe("USEE10301047");
    expect(match?.artists).toEqual(["Judy Collins"]);
    expect(fetch.mock.calls[1][0]).toBe("https://api.deezer.com/track/7");
  });

  it("should reject a longer title with a different length", async () => {
    mockFetch({
      data: [
        {
          id: 1,
          title: "the 1 so bad",
          duration: 152,
          artist: { name: "Taylor Swift" },
        },
      ],
    });

    expect(await findDeezerMatch(track)).toBeNull();
  });

  it("should return null without a confident match", async () => {
    mockFetch({
      data: [
        {
          id: 1,
          title: "the 2",
          duration: 210,
          artist: { name: "Taylor Swift" },
        },
      ],
    });

    expect(await findDeezerMatch(track)).toBeNull();
  });

  it("should reject Deezer error bodies", async () => {
    mockFetch({
      error: { type: "Exception", message: "Quota limit exceeded" },
    });

    await expect(findDeezerMatch(track)).rejects.toThrow("Quota");
  });
});

describe("getAudioFeatures", () => {
  it("should map the first ReccoBeats result", async () => {
    mockFetch({
      content: [
        {
          href: "https://open.spotify.com/track/0Jlcvv8IykzHaSmj49uNW8",
          acousticness: 0.757,
          danceability: 0.777,
          energy: 0.357,
          instrumentalness: 0.00000728,
          key: 0,
          liveness: 0.108,
          loudness: -6.942,
          mode: 1,
          speechiness: 0.0522,
          tempo: 139.884,
          valence: 0.172,
        },
      ],
    });

    expect(await getAudioFeatures("USUG12002835")).toMatchObject({
      spotify_url: "https://open.spotify.com/track/0Jlcvv8IykzHaSmj49uNW8",
      energy: 0.357,
      tempo: 139.884,
    });
  });

  it("should return null when the ISRC is unknown", async () => {
    mockFetch({ content: [] });

    expect(await getAudioFeatures("XX0000000000")).toBeNull();
  });
});
