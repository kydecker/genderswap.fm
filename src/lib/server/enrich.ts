import { type ITunesTrack, trackIdentity } from "#lib/itunes.js";
import { bestMatch } from "#lib/matching.js";
import { fetchJson } from "./fetchJson";

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

const AUDIO_FEATURES = [
  "acousticness",
  "danceability",
  "energy",
  "instrumentalness",
  "key",
  "liveness",
  "loudness",
  "mode",
  "speechiness",
  "tempo",
  "valence",
] as const;

type AudioFeatures = Record<(typeof AUDIO_FEATURES)[number], number | null> & {
  spotify_url: string | null;
};

type ReccoBeatsFeatures = {
  content: (Record<(typeof AUDIO_FEATURES)[number], number> & {
    href: string;
  })[];
};

export const NO_AUDIO_FEATURES = {
  spotify_url: null,
  ...Object.fromEntries(AUDIO_FEATURES.map((key) => [key, null])),
} as AudioFeatures;

const ATTEMPTS = 3;

const getJson = async <T>(url: string): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try {
      const body = await fetchJson<T | { error: unknown }>(url);
      if (body && typeof body === "object" && "error" in body) {
        throw new Error(`${JSON.stringify(body.error)}: ${url}`);
      }
      return body as T;
    } catch (error) {
      if (attempt === ATTEMPTS) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
};

const DEEZER = "https://api.deezer.com";

export const findDeezerMatch = async (track: ITunesTrack) => {
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
  const album = await getJson<{ upc?: string }>(
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
  if (!features) return NO_AUDIO_FEATURES;

  return {
    spotify_url: features.href,
    ...Object.fromEntries(AUDIO_FEATURES.map((key) => [key, features[key]])),
  } as AudioFeatures;
};
