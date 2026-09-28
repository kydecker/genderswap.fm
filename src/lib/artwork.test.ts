import { describe, expect, it } from "vitest";
import { artworkId, artworkSrcset, artworkUrl } from "./artwork";

const apple =
  "Music125/v4/7c/04/ba/7c04ba17-2ff8-21b3-0ac0-7d141f86e924/20UMGIM64216.rgb.jpg";
const mzstatic = `https://is1-ssl.mzstatic.com/image/thumb/${apple}`;
const spotify = "spotify:aa22899360d8ba6704732dec";

describe("artworkId", () => {
  it("should extract the path from an iTunes artwork URL", () => {
    expect(artworkId(`${mzstatic}/100x100bb.jpg`)).toBe(apple);
    expect(artworkId("https://example.com/cover.jpg")).toBeNull();
  });
});

describe("artworkUrl", () => {
  it("should size Apple artwork in the requested format", () => {
    expect(artworkUrl(apple, 300)).toBe(`${mzstatic}/300x300bb.webp`);
    expect(artworkUrl(apple, 64, "jpg")).toBe(`${mzstatic}/64x64bb.jpg`);
  });

  it.each([
    [64, "ab67616d00004851"],
    [160, "ab67616d00001e02"],
    [1000, "ab67616d0000b273"],
  ])("should pick the Spotify size covering %ipx", (size, prefix) => {
    expect(artworkUrl(spotify, size)).toBe(
      `https://i.scdn.co/image/${prefix}aa22899360d8ba6704732dec`,
    );
  });
});

describe("artworkSrcset", () => {
  it("should offer a 2x size", () => {
    expect(artworkSrcset(apple, 300)).toBe(
      `${mzstatic}/300x300bb.webp, ${mzstatic}/600x600bb.webp 2x`,
    );
  });
});
