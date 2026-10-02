<script lang="ts">
let { colors }: { colors: [string, string] } = $props();

let ready = $state(false);

const RESOLUTION = 96;
const SPEED = 0.00004;
const BLOB_SCALE = 1.5;
const THRESHOLD = 0.3;
const RANGE = 0.5;
const FADE_MIN = 0.05;
const FADE_MAX = 0.45;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);

type Oklab = [number, number, number];

const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const fromLinear = (c: number) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;

const hexToOklab = (hex: string): Oklab => {
  const [r, g, b] = [1, 3, 5].map((i) =>
    toLinear(Number.parseInt(hex.slice(i, i + 2), 16) / 255),
  );
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};

const oklabToRgb = ([L, a, b]: Oklab) => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => Math.round(clamp01(fromLinear(c)) * 255));
};

const buildGradient = (from: string, to: string) => {
  const a = hexToOklab(from);
  const b = hexToOklab(to);
  const gradient = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    const rgb = oklabToRgb(
      [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * t) as Oklab,
    );
    gradient.set(rgb, i * 3);
  }
  return gradient;
};

const createNoise = () => {
  const perm = new Uint8Array(512);
  const values = new Float32Array(256);
  const order = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = order[i & 255];
  for (let i = 0; i < 256; i++) values[i] = Math.random();

  const noise = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = smooth(x - xi);
    const yf = smooth(y - yi);
    const x0 = xi & 255;
    const y0 = yi & 255;
    const v00 = values[perm[perm[x0] + y0]];
    const v10 = values[perm[perm[x0 + 1] + y0]];
    const v01 = values[perm[perm[x0] + y0 + 1]];
    const v11 = values[perm[perm[x0 + 1] + y0 + 1]];
    const top = v00 + (v10 - v00) * xf;
    const bottom = v01 + (v11 - v01) * xf;
    return top + (bottom - top) * yf;
  };

  return (x: number, y: number) =>
    (noise(x, y) * 4 +
      noise(x * 2.03, y * 2.03) * 2 +
      noise(x * 4.1, y * 4.1)) /
    7;
};

const swirl = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext("2d");
  if (!context) return;

  const fbm = createNoise();
  const gradient = buildGradient(colors[0], colors[1]);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;

  const aspect = canvas.clientHeight / canvas.clientWidth || 1;
  canvas.width = aspect > 1 ? Math.round(RESOLUTION / aspect) : RESOLUTION;
  canvas.height = aspect > 1 ? RESOLUTION : Math.round(RESOLUTION * aspect);
  const image = context.createImageData(canvas.width, canvas.height);
  const topDepth = new Float32Array(canvas.width);
  const bottomDepth = new Float32Array(canvas.width);
  const { width, height, data } = image;
  const scale = BLOB_SCALE / RESOLUTION;

  const draw = (time: number) => {
    const t = time * SPEED;
    const fadeDepth = (column: number, seed: number) => {
      const n = fbm(column * scale * 1.3 + seed, t * 1.5 + seed);
      const k = clamp01((n - 0.3) / 0.4);
      return Math.max(1, (FADE_MIN + (FADE_MAX - FADE_MIN) * k) * height);
    };
    for (let x = 0; x < width; x++) {
      topDepth[x] = fadeDepth(x, 17.3);
      bottomDepth[x] = fadeDepth(x, 41.9);
    }
    for (let y = 0; y < height; y++) {
      const py = y * scale;
      const qyWarp = py - t * 0.7;
      const qyBase = py + 1.3 + t * 0.5;
      const vyBase = py - t * 0.2;
      const wispY = py * 3 + t * 0.6;
      const fromBottom = height - 1 - y;
      for (let x = 0; x < width; x++) {
        const px = x * scale;
        const qx = fbm(px + t, qyWarp);
        const qy = fbm(px + 5.2 - t * 0.8, qyBase);
        const v = fbm(px + 3 * qx + t * 0.3, vyBase + 3 * qy);
        const blend = clamp01((v - THRESHOLD) / RANGE);
        let mix = 0;
        if (blend > 0) {
          const wisp = 0.4 + 1.2 * fbm(px * 3 + 9.1 - t, wispY);
          const edge = Math.min(
            1,
            wisp * Math.min(y / topDepth[x], fromBottom / bottomDepth[x]),
          );
          mix = smooth(blend) * smooth(edge);
        }
        const index = Math.round(mix * 255) * 3;
        const offset = (y * width + x) * 4;
        data[offset] = gradient[index];
        data[offset + 1] = gradient[index + 1];
        data[offset + 2] = gradient[index + 2];
        data[offset + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
    ready = true;
  };

  const loop = (time: number) => {
    draw(time);
    frame = requestAnimationFrame(loop);
  };

  const start = () => {
    cancelAnimationFrame(frame);
    if (reducedMotion.matches) draw(0);
    else frame = requestAnimationFrame(loop);
  };

  start();
  reducedMotion.addEventListener("change", start);

  return () => {
    cancelAnimationFrame(frame);
    reducedMotion.removeEventListener("change", start);
  };
};
</script>

<canvas class="colorSwirl" class:ready aria-hidden="true" {@attach swirl}></canvas>

<style>
  .colorSwirl {
    position: fixed;
    inset: 0;
    z-index: -1;
    width: 100%;
    height: 100lvh;
    pointer-events: none;
    opacity: 0;
    transition: opacity 1.2s ease;

    &.ready {
      opacity: 1;
    }
  }
</style>
