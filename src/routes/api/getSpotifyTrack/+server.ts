import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { spotify } from "$lib/server/spotify";

dayjs.extend(isSameOrBefore);

// Given a Spotify track ID, returns a new Track object with the earliest release of that song
export async function GET({ url }) {
  const id = url.searchParams.get("id");

  if (!id) {
    throw new Error("No ID provided");
  }

  const track = await spotify.tracks.get(id);

  return Response.json(track);
}
