type ArtworkFormat = "webp" | "jpg";

const ARTWORK_ORIGIN = "https://img.genderswap.fm";
const SPOTIFY_PREFIX = "spotify:";
const SPOTIFY_SIZES = [
  [64, "ab67616d00004851"],
  [300, "ab67616d00001e02"],
  [640, "ab67616d0000b273"],
] as const;

export const ARTWORK_SIZE = 640;
export const FAVICON_SIZE = 32;
const ARTWORK_WIDTHS = [256, 384, 512, 640] as const;
type ArtworkWidth = (typeof ARTWORK_WIDTHS)[number];

export const artworkId = (itunesArtworkUrl: string) =>
  itunesArtworkUrl.match(/\/image\/thumb\/(.+)\/[^/]+$/)?.[1] ?? null;

export const isSpotifyArtwork = (artwork: string) =>
  artwork.startsWith(SPOTIFY_PREFIX);

export const sourceArtworkUrl = (
  artwork: string,
  size: number,
  format: ArtworkFormat = "webp",
) => {
  if (isSpotifyArtwork(artwork)) {
    const [, prefix] =
      SPOTIFY_SIZES.find(([width]) => width >= size) ?? SPOTIFY_SIZES[2];
    return `https://i.scdn.co/image/${prefix}${artwork.slice(SPOTIFY_PREFIX.length)}`;
  }
  return `https://is1-ssl.mzstatic.com/image/thumb/${artwork}/${size}x${size}bb.${format}`;
};

export const sourceArtworkSrcset = (artwork: string, size: number) =>
  `${sourceArtworkUrl(artwork, size)}, ${sourceArtworkUrl(artwork, size * 2)} 2x`;

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

export const artworkOriginalUrl = (name: string) =>
  encodeURI(`${ARTWORK_ORIGIN}/${artworkKey(name)}`);

export const artworkFaviconUrl = (name: string) =>
  encodeURI(`${ARTWORK_ORIGIN}/${faviconKey(name)}`);

export const artworkUrl = (name: string, width: ArtworkWidth) =>
  encodeURI(
    `${ARTWORK_ORIGIN}/cdn-cgi/image/width=${width},format=auto/${artworkKey(name)}`,
  );

export const artworkSrcset = (name: string) =>
  ARTWORK_WIDTHS.map((width) => `${artworkUrl(name, width)} ${width}w`).join(
    ", ",
  );
