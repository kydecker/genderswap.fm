type ArtworkFormat = "webp" | "jpg";

const ARTWORK_ORIGIN = "https://img.genderswap.fm";
export const ARTWORK_SIZE = 640;
export const FAVICON_SIZE = 32;
export const WEBP_QUALITY = 50;
export const ARTWORK_WIDTHS = [256, 384, 512, 640] as const;
export type ArtworkWidth = (typeof ARTWORK_WIDTHS)[number];

export const artworkId = (url: string) =>
  url.match(/\/image\/thumb\/(.+)\/[^/]+$/)?.[1] ?? null;

export const itunesArtworkUrl = (
  artwork: string,
  size: number,
  format: ArtworkFormat = "webp",
  quality?: number,
) =>
  `https://is1-ssl.mzstatic.com/image/thumb/${artwork}/${size}x${size}bb${quality ? `-${quality}` : ""}.${format}`;

export const itunesArtworkSrcset = (artwork: string, size: number) =>
  `${itunesArtworkUrl(artwork, size)}, ${itunesArtworkUrl(artwork, size * 2)} 2x`;

export const artworkName = (artist: string, album: string) =>
  `${artist} ${album}`
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/['’"“”]/g, "")
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
    .replace(/^-|-$/g, "") || "artwork";

export const artworkKey = (name: string) => `${ARTWORK_SIZE}/${name}.jpg`;

export const faviconKey = (name: string) => `${FAVICON_SIZE}/${name}.jpg`;

export const artworkWidthKey = (name: string, width: ArtworkWidth) =>
  `${width}/${name}.webp`;

export const artworkFaviconUrl = (name: string) =>
  encodeURI(`${ARTWORK_ORIGIN}/${faviconKey(name)}`);

export const artworkUrl = (name: string, width: ArtworkWidth) =>
  encodeURI(`${ARTWORK_ORIGIN}/${artworkWidthKey(name, width)}`);

export const artworkSrcset = (name: string) =>
  ARTWORK_WIDTHS.map((width) => `${artworkUrl(name, width)} ${width}w`).join(
    ", ",
  );
