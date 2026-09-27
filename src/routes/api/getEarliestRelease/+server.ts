import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { encodeSearchQuery, removeSongExtraText } from "$lib/helpers";
import { spotify } from "$lib/server/spotify";

dayjs.extend(isSameOrBefore);

// Given a Spotify track ID, returns a new Track object with the earliest release of that song
export async function GET({ url }) {
  const id = url.searchParams.get("id");

  if (!id) {
    throw new Error("No ID provided");
  }

  const track = await spotify.tracks.get(id);

  // Remove extras like " - Live", "(Remastered)", etc.
  const trackNoExtras = removeSongExtraText(track.name);

  const encodedTrack = encodeSearchQuery(trackNoExtras);
  const encodedArtist = encodeSearchQuery(track.artists[0].name);
  const encodedYear = encodeSearchQuery(track.album.release_date.slice(0, 4));

  const query = `${encodedTrack}%20artist:${encodedArtist}%20year:1900-${encodedYear}`;

  const results = (await spotify.search(query, ["track"], undefined, 5)).tracks
    .items;

  if (!results) return Response.json(null);

  const filteredResults = results
    // Exclude tracks with different names
    .filter((result) => result.name === trackNoExtras)
    // Exclude tracks from a different artist
    .filter((result) => result.artists[0].name === track.artists[0].name)
    // Exclude singles
    .filter((result) => result.album.album_type === "album");

  const earliestRelease = filteredResults.sort((a, b) =>
    dayjs(a.album.release_date).isSameOrBefore(dayjs(b.album.release_date))
      ? -1
      : 1,
  )[0];

  if (!earliestRelease) return Response.json(null);

  return Response.json(earliestRelease);
}
