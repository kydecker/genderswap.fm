import { describe, expect, it } from "vitest";
import { isValidTrack } from "./schemas";

const track = {
  trackId: 1452875626,
  trackName: "Hurt",
  artistId: 70936,
  artistName: "Johnny Cash",
  collectionName: "Unearthed (Box Set)",
  releaseDate: "2002-11-04T08:00:00Z",
  artwork: "Music125/v4/9f/b0/3c/9fb03c5a/00602498613351.rgb.jpg",
  trackTimeMillis: 216533,
  trackViewUrl: "https://music.apple.com/us/album/hurt/1452873181?i=1452875626",
};

describe("isValidTrack", () => {
  it("should accept an iTunes track", () => {
    expect(isValidTrack(track)).toBe(true);
  });

  it.each([
    [
      "a link to another track",
      { trackViewUrl: "https://music.apple.com/us/album/hurt/1?i=2" },
    ],
    [
      "a link to another host",
      { trackViewUrl: "https://example.com/?i=1452875626" },
    ],
    ["artwork with a host", { artwork: "https://example.com/cover.jpg" }],
    ["a missing name", { trackName: "" }],
    ["a malformed date", { releaseDate: "someday" }],
  ])("should reject %s", (_, overrides) => {
    expect(isValidTrack({ ...track, ...overrides })).toBe(false);
  });
});
