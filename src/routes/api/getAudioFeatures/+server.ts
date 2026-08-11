import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from "$env/static/private";

const spotify = SpotifyApi.withClientCredentials(
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
);

export async function GET({ url }) {
  const id = url.searchParams.get("id");

  if (!id) {
    throw new Error("No ID provided");
  }

  const results = await spotify.tracks.audioFeatures(id);

  return Response.json(results);
}
