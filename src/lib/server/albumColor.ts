import { decode } from "jpeg-js";

export const TARGET_LIGHTNESS = 0.65;
export const MAX_CHROMA = 0.14;

const MIN_PIXEL_LIGHTNESS = 0.12;
const MAX_PIXEL_LIGHTNESS = 0.97;
const MIN_PIXEL_CHROMA = 0.02;
const MIN_CLUSTER_SHARE = 0.005;
const HUE_BUCKETS = 24;

type Lab = { l: number; a: number; b: number };

const toLinear = (channel: number) => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const fromLinear = (c: number) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;

export const rgbToOklab = (red: number, green: number, blue: number): Lab => {
  const r = toLinear(red);
  const g = toLinear(green);
  const b = toLinear(blue);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720837 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
};

const oklabToLinearRgb = ({ l, a, b }: Lab) => {
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
};

const inGamut = (lab: Lab) =>
  oklabToLinearRgb(lab).every((c) => c >= -1e-4 && c <= 1 + 1e-4);

const oklchToLab = (l: number, c: number, h: number): Lab => ({
  l,
  a: c * Math.cos(h),
  b: c * Math.sin(h),
});

const maxChromaInGamut = (l: number, h: number, ceiling: number) => {
  if (inGamut(oklchToLab(l, ceiling, h))) return ceiling;
  let low = 0;
  let high = ceiling;
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    if (inGamut(oklchToLab(l, mid, h))) low = mid;
    else high = mid;
  }
  return low;
};

const toHex = (lab: Lab) =>
  `#${oklabToLinearRgb(lab)
    .map((c) =>
      Math.round(Math.min(1, Math.max(0, fromLinear(c))) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

export const extractAlbumColor = (
  pixels: ArrayLike<number>,
  channels = 4,
): string => {
  const weights = new Float64Array(HUE_BUCKETS);
  const counts = new Float64Array(HUE_BUCKETS);
  const sumA = new Float64Array(HUE_BUCKETS);
  const sumB = new Float64Array(HUE_BUCKETS);
  const sumChroma = new Float64Array(HUE_BUCKETS);
  const total = Math.floor(pixels.length / channels);
  let meanA = 0;
  let meanB = 0;
  let considered = 0;

  for (let i = 0; i < total; i++) {
    const offset = i * channels;
    const { l, a, b } = rgbToOklab(
      pixels[offset],
      pixels[offset + 1],
      pixels[offset + 2],
    );
    if (l < MIN_PIXEL_LIGHTNESS || l > MAX_PIXEL_LIGHTNESS) continue;

    meanA += a;
    meanB += b;
    considered++;

    const chroma = Math.hypot(a, b);
    if (chroma < MIN_PIXEL_CHROMA) continue;

    const hue = (Math.atan2(b, a) + 2 * Math.PI) % (2 * Math.PI);
    const bucket =
      Math.floor((hue / (2 * Math.PI)) * HUE_BUCKETS) % HUE_BUCKETS;
    const weight = chroma * chroma;
    weights[bucket] += weight;
    counts[bucket]++;
    sumA[bucket] += a * weight;
    sumB[bucket] += b * weight;
    sumChroma[bucket] += chroma * weight;
  }

  const neighbors = (bucket: number) =>
    [-1, 0, 1].map((d) => (bucket + d + HUE_BUCKETS) % HUE_BUCKETS);
  const minCount = Math.max(1, total * MIN_CLUSTER_SHARE);

  let best = -1;
  let bestScore = 0;
  for (let bucket = 0; bucket < HUE_BUCKETS; bucket++) {
    const cluster = neighbors(bucket);
    const count = cluster.reduce((sum, n) => sum + counts[n], 0);
    const score = cluster.reduce((sum, n) => sum + weights[n], 0);
    if (count >= minCount && score > bestScore) {
      best = bucket;
      bestScore = score;
    }
  }

  let a: number;
  let b: number;
  let chroma: number;
  if (best === -1) {
    a = considered ? meanA / considered : 0;
    b = considered ? meanB / considered : 0;
    chroma = Math.hypot(a, b);
  } else {
    a = 0;
    b = 0;
    chroma = 0;
    for (const n of neighbors(best)) {
      a += sumA[n];
      b += sumB[n];
      chroma += sumChroma[n];
    }
    chroma /= bestScore;
  }

  const hue = Math.atan2(b, a);
  const c = maxChromaInGamut(
    TARGET_LIGHTNESS,
    hue,
    Math.min(chroma, MAX_CHROMA),
  );

  return toHex(oklchToLab(TARGET_LIGHTNESS, c, hue));
};

export const getAlbumColor = async (url: string): Promise<string | null> => {
  const response = await fetch(url);
  if (!response.ok) return null;
  const { data } = decode(new Uint8Array(await response.arrayBuffer()), {
    useTArray: true,
    formatAsRGBA: true,
  });
  return extractAlbumColor(data);
};
