import { describe, expect, it } from "vitest";
import {
  extractAlbumColor,
  MAX_CHROMA,
  rgbToOklab,
  TARGET_LIGHTNESS,
} from "./albumColor";

type Rgb = [number, number, number];

const image = (...regions: [Rgb, number][]) =>
  regions.flatMap(([rgb, count]) =>
    Array.from({ length: count }, () => [...rgb, 255]).flat(),
  );

const hexToRgb = (hex: string): Rgb => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

const oklch = (hex: string) => {
  const { l, a, b } = rgbToOklab(...hexToRgb(hex));
  return {
    l,
    c: Math.hypot(a, b),
    h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360,
  };
};

const hueOf = (rgb: Rgb) =>
  oklch(`#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`).h;

const hueDistance = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

describe("extractAlbumColor", () => {
  it("returns a neutral for grayscale art", () => {
    const color = extractAlbumColor(
      image([[0, 0, 0], 50], [[128, 128, 128], 50], [[255, 255, 255], 50]),
    );
    expect(oklch(color).c).toBeLessThan(0.005);
    expect(oklch(color).l).toBeCloseTo(TARGET_LIGHTNESS, 2);
  });

  it("returns a neutral for empty input", () => {
    expect(oklch(extractAlbumColor([])).c).toBeLessThan(0.005);
  });

  it("keeps a faint tint when nothing is colorful enough", () => {
    const color = extractAlbumColor(image([[140, 132, 124], 100]));
    expect(oklch(color).c).toBeGreaterThan(0.005);
    expect(oklch(color).c).toBeLessThan(0.03);
  });

  it("picks out small vivid accents on colorless art", () => {
    const yellow: Rgb = [240, 200, 40];
    const color = extractAlbumColor(
      image([[5, 5, 5], 900], [[180, 175, 172], 400], [yellow, 30]),
    );
    expect(hueDistance(oklch(color).h, hueOf(yellow))).toBeLessThan(10);
  });

  it("ignores stray pixels below the minimum cluster size", () => {
    const color = extractAlbumColor(
      image([[128, 128, 128], 2000], [[255, 0, 0], 2]),
    );
    expect(oklch(color).c).toBeLessThan(0.01);
  });

  it("picks up muted browns", () => {
    const brown: Rgb = [110, 85, 65];
    const color = extractAlbumColor(
      image([[235, 235, 235], 900], [brown, 100]),
    );
    expect(hueDistance(oklch(color).h, hueOf(brown))).toBeLessThan(10);
  });

  it("normalizes to the target lightness", () => {
    for (const rgb of [
      [30, 10, 90],
      [250, 220, 60],
      [200, 30, 40],
    ] as Rgb[]) {
      const color = extractAlbumColor(image([rgb, 100]));
      expect(color).not.toBeNull();
      expect(oklch(color).l).toBeCloseTo(TARGET_LIGHTNESS, 2);
    }
  });

  it("keeps the hue of the dominant color", () => {
    const blue: Rgb = [40, 80, 200];
    const color = extractAlbumColor(image([blue, 80], [[210, 40, 40], 20]));
    expect(hueDistance(oklch(color).h, hueOf(blue))).toBeLessThan(10);
  });

  it("ignores black and white backgrounds", () => {
    const green: Rgb = [40, 160, 70];
    const color = extractAlbumColor(
      image([[0, 0, 0], 400], [[255, 255, 255], 400], [green, 100]),
    );
    expect(hueDistance(oklch(color).h, hueOf(green))).toBeLessThan(10);
  });

  it("prefers vivid areas over larger dull ones", () => {
    const vivid: Rgb = [230, 30, 120];
    const dull: Rgb = [120, 130, 100];
    const color = extractAlbumColor(image([dull, 60], [vivid, 40]));
    expect(hueDistance(oklch(color).h, hueOf(vivid))).toBeLessThan(10);
  });

  it("caps chroma", () => {
    const color = extractAlbumColor(image([[255, 0, 255], 100]));
    expect(oklch(color).c).toBeLessThanOrEqual(MAX_CHROMA + 0.01);
  });

  it("supports RGB input without alpha", () => {
    const rgba = extractAlbumColor(image([[40, 80, 200], 10]));
    const rgb = extractAlbumColor(
      Array.from({ length: 10 }, () => [40, 80, 200]).flat(),
      3,
    );
    expect(rgb).toBe(rgba);
  });
});
