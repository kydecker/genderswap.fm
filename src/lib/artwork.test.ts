import { describe, expect, it } from "vitest";
import {
  artworkFaviconUrl,
  artworkId,
  artworkName,
  artworkOriginalUrl,
  artworkSrcset,
  artworkUrl,
  sourceArtworkSrcset,
  sourceArtworkUrl,
} from "./artwork";

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

describe("sourceArtworkUrl", () => {
  it("should size Apple artwork in the requested format", () => {
    expect(sourceArtworkUrl(apple, 300)).toBe(`${mzstatic}/300x300bb.webp`);
    expect(sourceArtworkUrl(apple, 64, "jpg")).toBe(`${mzstatic}/64x64bb.jpg`);
  });

  it.each([
    [64, "ab67616d00004851"],
    [160, "ab67616d00001e02"],
    [1000, "ab67616d0000b273"],
  ])("should pick the Spotify size covering %ipx", (size, prefix) => {
    expect(sourceArtworkUrl(spotify, size)).toBe(
      `https://i.scdn.co/image/${prefix}aa22899360d8ba6704732dec`,
    );
  });
});

describe("sourceArtworkSrcset", () => {
  it("should offer a 2x size", () => {
    expect(sourceArtworkSrcset(apple, 300)).toBe(
      `${mzstatic}/300x300bb.webp, ${mzstatic}/600x600bb.webp 2x`,
    );
  });
});

describe("artworkName", () => {
  it("should name artwork after the artist and album", () => {
    expect(
      artworkName("Françoise Hardy", "Message personnel (Version Deluxe)"),
    ).toBe("francoise-hardy-message-personnel-version-deluxe");
    expect(artworkName("Guns N' Roses", "Use Your Illusion I")).toBe(
      "guns-n-roses-use-your-illusion-i",
    );
    expect(artworkName("半吨兄弟", "当爱在靠近")).toBe("半吨兄弟-当爱在靠近");
    expect(artworkName("Masayoshi Takanaka", "オン・ギター")).toBe(
      "masayoshi-takanaka-オン-ギター",
    );
    expect(artworkName("!!!", "???")).toBe("artwork");
  });
});

describe("artworkUrl", () => {
  it("should resize the stored original", () => {
    expect(artworkUrl("abba-voulez-vous", 256)).toBe(
      "https://img.genderswap.fm/cdn-cgi/image/width=256,format=auto/640/abba-voulez-vous.jpg",
    );
  });

  it("should point at the stored original and favicon", () => {
    expect(artworkOriginalUrl("abba-voulez-vous")).toBe(
      "https://img.genderswap.fm/640/abba-voulez-vous.jpg",
    );
    expect(artworkFaviconUrl("abba-voulez-vous")).toBe(
      "https://img.genderswap.fm/32/abba-voulez-vous.jpg",
    );
  });

  it("should encode non-ASCII names", () => {
    expect(artworkOriginalUrl("半吨兄弟")).toBe(
      "https://img.genderswap.fm/640/%E5%8D%8A%E5%90%A8%E5%85%84%E5%BC%9F.jpg",
    );
  });
});

describe("artworkSrcset", () => {
  it("should offer each resized width", () => {
    expect(artworkSrcset("a")).toBe(
      [256, 384, 512, 640]
        .map(
          (width) =>
            `https://img.genderswap.fm/cdn-cgi/image/width=${width},format=auto/640/a.jpg ${width}w`,
        )
        .join(", "),
    );
  });
});
