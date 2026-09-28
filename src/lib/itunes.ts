import { artworkId } from "./artwork.ts";
import {
  normalize,
  removeSongExtraText,
  type SongIdentity,
} from "./matching.ts";

export type ITunesTrack = {
  trackId: number;
  trackName: string;
  artistId: number;
  artistName: string;
  collectionName: string;
  releaseDate: string;
  artwork: string;
  trackTimeMillis?: number;
  discNumber?: number;
  trackNumber?: number;
  trackViewUrl: string;
  previewUrl?: string;
};

type ITunesResult = {
  wrapperType?: string;
  kind?: string;
  artworkUrl100?: string;
};

const ITUNES = "https://itunes.apple.com";

export const trackIdentity = (track: ITunesTrack): SongIdentity => ({
  name: track.trackName,
  artist: track.artistName,
  durationMs: track.trackTimeMillis,
});

const fetchTracks = async (
  path: string,
  params: Record<string, string>,
  signal?: AbortSignal,
) => {
  const query = new URLSearchParams({ country: "US", ...params });
  const response = await fetch(`${ITUNES}/${path}?${query}`, { signal });
  if (!response.ok) {
    throw new Error(`iTunes ${response.status}: ${path}?${query}`);
  }
  const { results }: { results: ITunesResult[] } = await response.json();
  return results.flatMap((result) => {
    const artwork = artworkId(result.artworkUrl100 ?? "");
    return result.wrapperType === "track" && result.kind === "song" && artwork
      ? [{ ...result, artwork } as ITunesTrack]
      : [];
  });
};

export const searchTracks = (term: string, limit = 10, signal?: AbortSignal) =>
  fetchTracks("search", { term, entity: "song", limit: String(limit) }, signal);

export const lookupTracks = (ids: (number | string)[]) =>
  fetchTracks("lookup", { id: ids.join(",") });

export const lookupAlbumTracks = (upc: string) =>
  fetchTracks("lookup", { upc, entity: "song" });

export const parseAppleMusicUrl = (text: string) => {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (host !== "music.apple.com" && !host.endsWith(".music.apple.com")) {
    return null;
  }
  const id =
    url.searchParams.get("i") ??
    url.pathname.match(/\/song\/[^/]+\/(\d+)/)?.[1];
  return id && /^\d+$/.test(id) ? id : null;
};

export const releaseYear = (track: Pick<ITunesTrack, "releaseDate">) =>
  Number.parseInt(track.releaseDate.slice(0, 4), 10);

export const albumName = (track: Pick<ITunesTrack, "collectionName">) =>
  track.collectionName.replace(/ - (Single|EP)$/, "");

export const songName = (track: Pick<ITunesTrack, "trackName">) =>
  removeSongExtraText(track.trackName);

const LIVE = /\blive\b/i;

const isLive = (track: ITunesTrack) =>
  LIVE.test(track.trackName) || LIVE.test(track.collectionName);

export const pickEarliestRelease = (
  track: ITunesTrack,
  candidates: ITunesTrack[],
) => {
  const name = normalize(track.trackName);
  const year = releaseYear(track);
  const allowLive = isLive(track);

  return (
    candidates
      .filter(
        (candidate) =>
          candidate.artistId === track.artistId &&
          normalize(candidate.trackName) === name &&
          releaseYear(candidate) < year &&
          (allowLive || !isLive(candidate)),
      )
      .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))[0] ?? null
  );
};

export const findEarliestRelease = async (track: ITunesTrack) =>
  pickEarliestRelease(
    track,
    await searchTracks(`${songName(track)} ${track.artistName}`, 50),
  );
