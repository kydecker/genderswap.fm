export type SongLinks = {
  apple_music_url: string | null;
  tidal_url: string | null;
  links_checked_at: string | null;
};

type LinkQuery = {
  isrc: string | null;
  upc: string | null;
  name: string;
  artists: string[];
  duration_ms: number | null;
  disc_number: number | null;
  track_number: number | null;
};

type TidalCredentials = { clientId: string; clientSecret: string };

type ITunesTrack = {
  wrapperType?: string;
  discNumber?: number;
  trackNumber?: number;
  trackName: string;
  artistName: string;
  trackTimeMillis?: number;
  trackViewUrl: string;
};

const normalize = (text: string) =>
  text
    .normalize("NFKD")
    .toLowerCase()
    .split(" - ")[0]
    .replace(/\s[([][^)\]]*[)\]]/g, "")
    .replace(/&/g, "and")
    .replace(/[^\p{L}\p{N}]/gu, "");

const isSameLength = (
  a: number | null | undefined,
  b: number | null | undefined,
) => !!a && !!b && Math.abs(a - b) < 5000;

const appleTrackUrl = (track: ITunesTrack) => {
  const url = new URL(track.trackViewUrl);
  url.searchParams.delete("uo");
  return url.toString();
};

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return response.json();
};

export const findAppleMusicUrl = async ({
  name,
  artists,
  duration_ms,
}: LinkQuery) => {
  const term = encodeURIComponent(`${artists[0]} ${name}`);
  const { results } = await fetchJson<{ results: ITunesTrack[] }>(
    `https://itunes.apple.com/search?term=${term}&country=us&media=music&entity=song&limit=25`,
  );

  const title = normalize(name);
  const artist = normalize(artists[0]);

  const matches = results.filter((track) => {
    const trackArtist = normalize(track.artistName);
    const sameTitle = normalize(track.trackName) === title;
    const sameArtist =
      trackArtist.includes(artist) || artist.includes(trackArtist);
    const sameLength =
      !duration_ms ||
      !track.trackTimeMillis ||
      Math.abs(track.trackTimeMillis - duration_ms) < 5000;
    return title && artist && sameTitle && sameArtist && sameLength;
  });

  const exactTitle = (track: ITunesTrack) =>
    track.trackName.toLowerCase() === name.toLowerCase() ? 0 : 1;
  const lengthDifference = (track: ITunesTrack) =>
    duration_ms ? Math.abs((track.trackTimeMillis ?? 0) - duration_ms) : 0;

  matches.sort(
    (a, b) =>
      exactTitle(a) - exactTitle(b) ||
      lengthDifference(a) - lengthDifference(b),
  );

  return matches.length ? appleTrackUrl(matches[0]) : null;
};

export const findAppleMusicUrlByUpc = async ({
  upc,
  name,
  duration_ms,
  disc_number,
  track_number,
}: LinkQuery) => {
  if (!upc || !track_number) return null;

  const { results } = await fetchJson<{ results: ITunesTrack[] }>(
    `https://itunes.apple.com/lookup?upc=${upc}&country=us&entity=song`,
  );

  const track = results.find(
    (result) =>
      result.wrapperType === "track" &&
      result.discNumber === (disc_number ?? 1) &&
      result.trackNumber === track_number,
  );

  if (!track) return null;
  if (
    !isSameLength(track.trackTimeMillis, duration_ms) &&
    normalize(track.trackName) !== normalize(name)
  ) {
    return null;
  }
  return appleTrackUrl(track);
};

let tidalToken: { value: string; expires: number } | undefined;

const getTidalToken = async ({ clientId, clientSecret }: TidalCredentials) => {
  if (tidalToken && tidalToken.expires > Date.now()) return tidalToken.value;

  const { access_token, expires_in } = await fetchJson<{
    access_token: string;
    expires_in: number;
  }>("https://auth.tidal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  tidalToken = {
    value: access_token,
    expires: Date.now() + (expires_in - 60) * 1000,
  };
  return access_token;
};

export const findTidalUrl = async (
  { isrc }: LinkQuery,
  credentials: TidalCredentials,
) => {
  if (!isrc) return null;

  const token = await getTidalToken(credentials);
  const { data } = await fetchJson<{ data: { id: string }[] }>(
    `https://openapi.tidal.com/v2/tracks?countryCode=US&filter%5Bisrc%5D=${isrc}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  return data.length ? `https://tidal.com/track/${data[0].id}` : null;
};

type TidalAlbums = {
  data: {
    relationships?: {
      items?: {
        data?: {
          id: string;
          meta?: { volumeNumber?: number; trackNumber?: number };
        }[];
      };
    };
  }[];
  included?: { id: string; type: string; attributes?: { isrc?: string } }[];
};

export const findTidalUrlByUpc = async (
  { upc, isrc, disc_number, track_number }: LinkQuery,
  credentials: TidalCredentials,
) => {
  if (!upc) return null;

  const token = await getTidalToken(credentials);
  const { data, included = [] } = await fetchJson<TidalAlbums>(
    `https://openapi.tidal.com/v2/albums?countryCode=US&filter%5BbarcodeId%5D=${upc}&include=items`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const byIsrc = included.find(
    (item) =>
      item.type === "tracks" && !!isrc && item.attributes?.isrc === isrc,
  );
  const byPosition = data
    .flatMap((album) => album.relationships?.items?.data ?? [])
    .find(
      (item) =>
        !!track_number &&
        item.meta?.volumeNumber === (disc_number ?? 1) &&
        item.meta?.trackNumber === track_number,
    );

  const id = byIsrc?.id ?? byPosition?.id;
  return id ? `https://tidal.com/track/${id}` : null;
};

export const findSongLinks = async (
  query: LinkQuery,
  credentials: Partial<TidalCredentials>,
): Promise<SongLinks> => {
  const { clientId, clientSecret } = credentials;
  const [apple, tidal] = await Promise.allSettled([
    findAppleMusicUrlByUpc(query).then(
      (url) => url ?? findAppleMusicUrl(query),
    ),
    clientId && clientSecret
      ? findTidalUrl(query, { clientId, clientSecret }).then(
          (url) => url ?? findTidalUrlByUpc(query, { clientId, clientSecret }),
        )
      : Promise.reject(new Error("Missing Tidal credentials")),
  ]);

  return {
    apple_music_url: apple.status === "fulfilled" ? apple.value : null,
    tidal_url: tidal.status === "fulfilled" ? tidal.value : null,
    links_checked_at:
      apple.status === "fulfilled" && tidal.status === "fulfilled"
        ? new Date().toISOString()
        : null,
  };
};
