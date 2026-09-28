import { afterEach, describe, expect, it, vi } from "vitest";
import {
  albumName,
  type ITunesTrack,
  lookupTracks,
  parseAppleMusicUrl,
  pickEarliestRelease,
} from "./itunes";

const track = (
  year: number,
  overrides: Partial<ITunesTrack> = {},
): ITunesTrack => ({
  trackId: year,
  trackName: "Hurt",
  artistId: 100,
  artistName: "Johnny Cash",
  collectionName: "American IV: The Man Comes Around",
  releaseDate: `${year}-01-01T08:00:00Z`,
  artwork: "",
  trackViewUrl: "",
  ...overrides,
});

describe("parseAppleMusicUrl", () => {
  it.each([
    "https://music.apple.com/us/album/folklore/1524793738?i=1524793743",
    "https://music.apple.com/us/song/cardigan/1524793743",
    "https://geo.music.apple.com/us/album/folklore/1524793738?i=1524793743",
  ])("should read the track ID from %s", (url) => {
    expect(parseAppleMusicUrl(url)).toBe("1524793743");
  });

  it.each([
    "cardigan taylor swift",
    "https://open.spotify.com/track/4R2kfaDFhslZEMJqAFNpdd",
    "https://notmusic.apple.com/us/album/folklore/1524793738?i=1524793743",
    "https://music.apple.com.example.net/us/album/x/1?i=1524793743",
  ])("should ignore %s", (text) => {
    expect(parseAppleMusicUrl(text)).toBeNull();
  });
});

describe("albumName", () => {
  it.each([
    ["Hurt - Single", "Hurt"],
    ["Heartbreaker - EP", "Heartbreaker"],
  ])("should drop Apple's suffix from %s", (collectionName, expected) => {
    expect(albumName({ collectionName })).toBe(expected);
  });
});

describe("pickEarliestRelease", () => {
  const selected = track(2011);

  it("should return the earliest release from an earlier year", () => {
    const earliest = track(2002);
    expect(
      pickEarliestRelease(selected, [track(2006), earliest, selected]),
    ).toBe(earliest);
  });

  it("should ignore the same year, other artists, and other songs", () => {
    expect(
      pickEarliestRelease(selected, [
        track(2011, { trackId: 2 }),
        track(1994, { artistId: 200 }),
        track(1990, { trackName: "Hurt So Bad" }),
      ]),
    ).toBeNull();
  });

  it("should match remastered titles", () => {
    const original = track(2002);
    expect(
      pickEarliestRelease(
        track(2011, { trackName: "Hurt (Remastered 2011)" }),
        [original],
      ),
    ).toBe(original);
  });

  it("should skip live versions unless the selection is live", () => {
    const live = track(2003, { trackName: "Hurt (Live)" });
    expect(pickEarliestRelease(selected, [live])).toBeNull();
    expect(
      pickEarliestRelease(track(2011, { trackName: "Hurt (Live)" }), [live]),
    ).toBe(live);
  });
});

describe("lookupTracks", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should attach artwork IDs and drop results without them", async () => {
    const song = {
      wrapperType: "track",
      kind: "song",
      trackId: 1,
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/03/1a/4a/mzi.jrahtjbc.jpg/100x100bb.jpg",
    };
    const results = [
      song,
      { ...song, artworkUrl100: "" },
      { ...song, wrapperType: "collection" },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ results })),
    );

    expect(await lookupTracks([1])).toEqual([
      { ...song, artwork: "Music/03/1a/4a/mzi.jrahtjbc.jpg" },
    ]);
  });
});
