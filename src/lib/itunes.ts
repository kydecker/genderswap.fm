import { removeSongExtraText } from "$lib/helpers";
import { normalize, type SongIdentity } from "$lib/matching";

export type ITunesTrack = {
  wrapperType: "track";
  kind: "song";
  trackId: number;
  trackName: string;
  artistId: number;
  artistName: string;
  collectionId: number;
  collectionName: string;
  releaseDate: string;
  artworkUrl100: string;
  trackTimeMillis?: number;
  discNumber?: number;
  trackNumber?: number;
  trackViewUrl: string;
  previewUrl?: string;
};

type ITunesResponse = { results: (ITunesTrack | { wrapperType: string })[] };

const ITUNES = "https://itunes.apple.com";

export const trackIdentity = (track: ITunesTrack): SongIdentity => ({
  name: track.trackName,
  artist: track.artistName,
  durationMs: track.trackTimeMillis,
});

const isSong = (
  result: ITunesResponse["results"][number],
): result is ITunesTrack =>
  result.wrapperType === "track" && (result as ITunesTrack).kind === "song";

const fetchTracks = async (path: string, params: Record<string, string>) => {
  const query = new URLSearchParams({ country: "US", ...params });
  const response = await fetch(`${ITUNES}/${path}?${query}`);
  if (!response.ok) {
    throw new Error(`iTunes ${response.status}: ${path}?${query}`);
  }
  const { results }: ITunesResponse = await response.json();
  return results.filter(isSong);
};

export const searchTracks = (term: string, limit = 10) =>
  fetchTracks("search", { term, entity: "song", limit: String(limit) });

export const lookupTracks = (ids: (number | string)[]) =>
  fetchTracks("lookup", { id: ids.join(",") });

export const parseAppleMusicUrl = (text: string) => {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }
  if (!url.hostname.endsWith("music.apple.com")) return null;
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

export const pickEarliestRelease = (
  track: ITunesTrack,
  candidates: ITunesTrack[],
) => {
  const name = normalize(track.trackName);
  const year = releaseYear(track);
  const allowLive =
    LIVE.test(track.trackName) || LIVE.test(track.collectionName);

  return (
    candidates
      .filter(
        (candidate) =>
          candidate.artistId === track.artistId &&
          normalize(candidate.trackName) === name &&
          releaseYear(candidate) < year &&
          (allowLive ||
            !(
              LIVE.test(candidate.trackName) ||
              LIVE.test(candidate.collectionName)
            )),
      )
      .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))[0] ?? null
  );
};

export const findEarliestRelease = async (track: ITunesTrack) =>
  pickEarliestRelease(
    track,
    await searchTracks(`${songName(track)} ${track.artistName}`, 50),
  );
