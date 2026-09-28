import { afterEach, describe, expect, it, vi } from "vitest";
import {
  albumName,
  type ITunesTrack,
  lookupTracks,
  parseAppleMusicUrl,
  pickEarliestRelease,
} from "./itunes";

const track = (overrides: Partial<ITunesTrack>): ITunesTrack => ({
  wrapperType: "track",
  kind: "song",
  trackId: 1,
  trackName: "Hurt",
  artistId: 100,
  artistName: "Johnny Cash",
  collectionId: 10,
  collectionName: "American IV: The Man Comes Around",
  releaseDate: "2002-11-05T08:00:00Z",
  artworkUrl100: "",
  artwork: "",
  trackViewUrl: "",
  ...overrides,
});

describe("parseAppleMusicUrl", () => {
  it("should read the track ID from an album link", () => {
    expect(
      parseAppleMusicUrl(
        "https://music.apple.com/us/album/folklore/1524793738?i=1524793743",
      ),
    ).toBe("1524793743");
  });

  it("should read the track ID from a song link", () => {
    expect(
      parseAppleMusicUrl("https://music.apple.com/us/song/cardigan/1524793743"),
    ).toBe("1524793743");
  });

  it("should accept Apple Music subdomains", () => {
    expect(
      parseAppleMusicUrl(
        "https://geo.music.apple.com/us/album/folklore/1524793738?i=1524793743",
      ),
    ).toBe("1524793743");
  });

  it("should reject hosts that only end in music.apple.com", () => {
    expect(
      parseAppleMusicUrl(
        "https://notmusic.apple.com/us/album/folklore/1524793738?i=1524793743",
      ),
    ).toBeNull();
    expect(
      parseAppleMusicUrl(
        "https://music.apple.com.example.net/us/album/x/1?i=1524793743",
      ),
    ).toBeNull();
  });

  it("should ignore other text", () => {
    expect(parseAppleMusicUrl("cardigan taylor swift")).toBeNull();
    expect(
      parseAppleMusicUrl(
        "https://open.spotify.com/track/4R2kfaDFhslZEMJqAFNpdd",
      ),
    ).toBeNull();
  });
});

describe("albumName", () => {
  it("should drop Apple's single and EP suffixes", () => {
    expect(albumName({ collectionName: "Hurt - Single" })).toBe("Hurt");
    expect(albumName({ collectionName: "Heartbreaker - EP" })).toBe(
      "Heartbreaker",
    );
  });
});

describe("pickEarliestRelease", () => {
  const selected = track({ trackId: 1, releaseDate: "2011-01-01T08:00:00Z" });

  it("should return the earliest release from an earlier year", () => {
    const earliest = track({ trackId: 2, releaseDate: "2002-11-05T08:00:00Z" });
    const later = track({ trackId: 3, releaseDate: "2006-01-01T08:00:00Z" });
    expect(pickEarliestRelease(selected, [later, earliest, selected])).toBe(
      earliest,
    );
  });

  it("should ignore releases from the same year", () => {
    const sameYear = track({ trackId: 2, releaseDate: "2011-01-01T00:00:00Z" });
    expect(pickEarliestRelease(selected, [sameYear])).toBeNull();
  });

  it("should ignore other artists and other songs", () => {
    expect(
      pickEarliestRelease(selected, [
        track({
          trackId: 2,
          artistId: 200,
          releaseDate: "1994-03-08T08:00:00Z",
        }),
        track({
          trackId: 3,
          trackName: "Hurt So Bad",
          releaseDate: "1990-01-01T08:00:00Z",
        }),
      ]),
    ).toBeNull();
  });

  it("should match remastered titles", () => {
    const original = track({ trackId: 2, releaseDate: "2002-11-05T08:00:00Z" });
    expect(
      pickEarliestRelease(
        track({
          trackName: "Hurt (Remastered 2011)",
          releaseDate: "2011-01-01T08:00:00Z",
        }),
        [original],
      ),
    ).toBe(original);
  });

  it("should skip live versions unless the selection is live", () => {
    const live = track({
      trackId: 2,
      trackName: "Hurt (Live)",
      releaseDate: "2003-01-01T08:00:00Z",
    });
    expect(pickEarliestRelease(selected, [live])).toBeNull();
    expect(
      pickEarliestRelease(
        track({
          trackName: "Hurt (Live)",
          releaseDate: "2011-01-01T08:00:00Z",
        }),
        [live],
      ),
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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          results: [
            song,
            { ...song, trackId: 2, artworkUrl100: "" },
            { ...song, trackId: 3, wrapperType: "collection" },
          ],
        }),
      ),
    );

    expect(await lookupTracks([1, 2, 3])).toEqual([
      { ...song, artwork: "Music/03/1a/4a/mzi.jrahtjbc.jpg" },
    ]);
  });
});
