import { spotify } from "$lib/server/spotify";

export async function GET({ url }) {
  const query = url.searchParams.get("q");

  if (!query) return Response.json({});

  const results = (await spotify.search(query, ["track"], undefined, 10)).tracks
    .items;

  return Response.json(results);
}
