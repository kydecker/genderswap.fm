import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from "$env/static/private";

const spotify = SpotifyApi.withClientCredentials(
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
);

export async function GET({ url }) {
  const query = url.searchParams.get("q");

  if (!query) return Response.json({});

  const results = (await spotify.search(query, ["track"], undefined, 10)).tracks
    .items;

  return Response.json(results);
}
