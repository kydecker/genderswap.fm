import { spotify } from "$lib/server/spotify";

// Given a Spotify track ID, returns its Track object
export async function GET({ url }) {
  const id = url.searchParams.get("id");

  if (!id) {
    throw new Error("No ID provided");
  }

  const track = await spotify.tracks.get(id);

  return Response.json(track);
}
