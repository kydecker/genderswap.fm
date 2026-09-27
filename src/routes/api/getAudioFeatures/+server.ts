import { spotify } from "$lib/server/spotify";

export async function GET({ url }) {
  const id = url.searchParams.get("id");

  if (!id) {
    throw new Error("No ID provided");
  }

  const results = await spotify.tracks.audioFeatures(id);

  return Response.json(results);
}
