import { fetchJson } from "./fetchJson";

type LinkQuery = {
  isrc: string | null;
  upc: string | null;
  disc_number?: number;
  track_number?: number;
};

type TidalCredentials = { clientId: string; clientSecret: string };

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

export const findTidalLink = async (
  query: LinkQuery,
  { clientId, clientSecret }: Partial<TidalCredentials>,
) => {
  if (!clientId || !clientSecret) return null;
  const credentials = { clientId, clientSecret };
  try {
    return (
      (await findTidalUrl(query, credentials)) ??
      (await findTidalUrlByUpc(query, credentials))
    );
  } catch {
    return null;
  }
};
