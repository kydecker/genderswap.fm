import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from "$env/static/private";

export const spotify = SpotifyApi.withClientCredentials(
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
);
