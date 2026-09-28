import { type ITunesTrack, trackIdentity } from "$lib/itunes";
import { bestMatch } from "$lib/matching";

type DeezerSearch = {
  data: {
    id: number;
    title: string;
    duration: number;
    artist: { name: string };
  }[];
};

type DeezerTrack = {
  isrc?: string;
  album: { id: number };
  contributors?: { name: string }[];
};

type DeezerAlbum = { upc?: string };

type ReccoBeatsFeatures = {
  content: {
    href: string;
    acousticness: number;
    danceability: number;
    energy: number;
    instrumentalness: number;
    key: number;
    liveness: number;
    loudness: number;
    mode: number;
    speechiness: number;
    tempo: number;
    valence: number;
  }[];
};

export type DeezerMatch = {
  isrc: string | null;
  upc: string | null;
  artists: string[];
};

const getJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  const body = await response.json();
  if (body && typeof body === "object" && "error" in body) {
    throw new Error(`${JSON.stringify(body.error)}: ${url}`);
  }
  return body as T;
};

const DEEZER = "https://api.deezer.com";

export const findDeezerMatch = async (
  track: ITunesTrack,
): Promise<DeezerMatch | null> => {
  const q = new URLSearchParams({
    q: `${track.artistName} ${track.trackName}`,
    limit: "25",
  });
  const { data } = await getJson<DeezerSearch>(`${DEEZER}/search?${q}`);

  const match = bestMatch(trackIdentity(track), data, (candidate) => ({
    name: candidate.title,
    artist: candidate.artist.name,
    durationMs: candidate.duration * 1000,
  }));

  if (!match) return null;

  const details = await getJson<DeezerTrack>(`${DEEZER}/track/${match.id}`);
  const album = await getJson<DeezerAlbum>(
    `${DEEZER}/album/${details.album.id}`,
  ).catch(() => null);

  const artists = [
    ...new Set((details.contributors ?? []).map(({ name }) => name)),
  ];

  return {
    isrc: details.isrc?.toUpperCase() ?? null,
    upc: album?.upc ?? null,
    artists: artists.length ? artists : [track.artistName],
  };
};

export const getAudioFeatures = async (isrc: string) => {
  const { content } = await getJson<ReccoBeatsFeatures>(
    `https://api.reccobeats.com/v1/audio-features?ids=${encodeURIComponent(isrc)}`,
  );
  const features = content[0];
  if (!features) return null;

  return {
    spotify_url: features.href,
    acousticness: features.acousticness,
    danceability: features.danceability,
    energy: features.energy,
    instrumentalness: features.instrumentalness,
    key: features.key,
    liveness: features.liveness,
    loudness: features.loudness,
    mode: features.mode,
    speechiness: features.speechiness,
    tempo: features.tempo,
    valence: features.valence,
  };
};
