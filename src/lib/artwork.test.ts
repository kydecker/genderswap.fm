import { describe, expect, it } from "vitest";
import { artworkId, artworkSrcset, artworkUrl } from "./artwork";

const apple =
  "Music125/v4/7c/04/ba/7c04ba17-2ff8-21b3-0ac0-7d141f86e924/20UMGIM64216.rgb.jpg";
const spotify = "spotify:aa22899360d8ba6704732dec";

describe("artworkId", () => {
  it("should extract the path from an iTunes artwork URL", () => {
    expect(
      artworkId(
        `https://is1-ssl.mzstatic.com/image/thumb/${apple}/100x100bb.jpg`,
      ),
    ).toBe(apple);
  });

  it("should return null for other URLs", () => {
    expect(artworkId("https://example.com/cover.jpg")).toBeNull();
  });
});

describe("artworkUrl", () => {
  it("should size Apple artwork as WebP by default", () => {
    expect(artworkUrl(apple, 300)).toBe(
      `https://is1-ssl.mzstatic.com/image/thumb/${apple}/300x300bb.webp`,
    );
  });

  it("should size Apple artwork as JPEG when asked", () => {
    expect(artworkUrl(apple, 64, "jpg")).toBe(
      `https://is1-ssl.mzstatic.com/image/thumb/${apple}/64x64bb.jpg`,
    );
  });

  it("should pick the smallest Spotify size that covers the request", () => {
    expect(artworkUrl(spotify, 64)).toBe(
      "https://i.scdn.co/image/ab67616d00004851aa22899360d8ba6704732dec",
    );
    expect(artworkUrl(spotify, 160)).toBe(
      "https://i.scdn.co/image/ab67616d00001e02aa22899360d8ba6704732dec",
    );
    expect(artworkUrl(spotify, 1000)).toBe(
      "https://i.scdn.co/image/ab67616d0000b273aa22899360d8ba6704732dec",
    );
  });
});

describe("artworkSrcset", () => {
  it("should offer a 2x size", () => {
    expect(artworkSrcset(apple, 300)).toBe(
      `https://is1-ssl.mzstatic.com/image/thumb/${apple}/300x300bb.webp, https://is1-ssl.mzstatic.com/image/thumb/${apple}/600x600bb.webp 2x`,
    );
  });
});
