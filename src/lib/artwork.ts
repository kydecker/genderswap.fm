type ArtworkFormat = "webp" | "jpg";

const SPOTIFY_PREFIX = "spotify:";
const SPOTIFY_SIZES = [
  [64, "ab67616d00004851"],
  [300, "ab67616d00001e02"],
  [640, "ab67616d0000b273"],
] as const;

export const artworkId = (itunesArtworkUrl: string) =>
  itunesArtworkUrl.match(/\/image\/thumb\/(.+)\/[^/]+$/)?.[1] ?? null;

export const artworkUrl = (
  artwork: string,
  size: number,
  format: ArtworkFormat = "webp",
) => {
  if (artwork.startsWith(SPOTIFY_PREFIX)) {
    const [, prefix] =
      SPOTIFY_SIZES.find(([width]) => width >= size) ?? SPOTIFY_SIZES[2];
    return `https://i.scdn.co/image/${prefix}${artwork.slice(SPOTIFY_PREFIX.length)}`;
  }
  return `https://is1-ssl.mzstatic.com/image/thumb/${artwork}/${size}x${size}bb.${format}`;
};

export const artworkSrcset = (artwork: string, size: number) =>
  `${artworkUrl(artwork, size)}, ${artworkUrl(artwork, size * 2)} 2x`;
