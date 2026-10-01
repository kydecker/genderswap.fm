import { describe, expect, it } from "vitest";
import {
  artworkFaviconUrl,
  artworkId,
  artworkName,
  artworkSrcset,
  artworkUrl,
  itunesArtworkSrcset,
  itunesArtworkUrl,
} from "./artwork";

const apple =
  "Music125/v4/7c/04/ba/7c04ba17-2ff8-21b3-0ac0-7d141f86e924/20UMGIM64216.rgb.jpg";
const mzstatic = `https://is1-ssl.mzstatic.com/image/thumb/${apple}`;

describe("artworkId", () => {
  it("should extract the path from an iTunes artwork URL", () => {
    expect(artworkId(`${mzstatic}/100x100bb.jpg`)).toBe(apple);
    expect(artworkId("https://example.com/cover.jpg")).toBeNull();
  });
});

describe("itunesArtworkUrl", () => {
  it("should size Apple artwork in the requested format", () => {
    expect(itunesArtworkUrl(apple, 300)).toBe(`${mzstatic}/300x300bb.webp`);
    expect(itunesArtworkUrl(apple, 64, "jpg")).toBe(`${mzstatic}/64x64bb.jpg`);
    expect(itunesArtworkUrl(apple, 256, "webp", 50)).toBe(
      `${mzstatic}/256x256bb-50.webp`,
    );
  });
});

describe("itunesArtworkSrcset", () => {
  it("should offer a 2x size", () => {
    expect(itunesArtworkSrcset(apple, 300)).toBe(
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
  it("should point at the stored WebP for a width", () => {
    expect(artworkUrl("abba-voulez-vous", 256)).toBe(
      "https://img.genderswap.fm/256/abba-voulez-vous.webp",
    );
  });

  it("should point at the stored favicon", () => {
    expect(artworkFaviconUrl("abba-voulez-vous")).toBe(
      "https://img.genderswap.fm/32/abba-voulez-vous.jpg",
    );
  });

  it("should encode non-ASCII names", () => {
    expect(artworkUrl("半吨兄弟", 512)).toBe(
      "https://img.genderswap.fm/512/%E5%8D%8A%E5%90%A8%E5%85%84%E5%BC%9F.webp",
    );
  });
});

describe("artworkSrcset", () => {
  it("should offer each stored width", () => {
    expect(artworkSrcset("a")).toBe(
      [256, 384, 512, 640]
        .map((width) => `https://img.genderswap.fm/${width}/a.webp ${width}w`)
        .join(", "),
    );
  });
});
