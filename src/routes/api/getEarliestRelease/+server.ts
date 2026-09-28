import { removeSongExtraText } from "$lib/helpers";
import { spotify } from "$lib/server/spotify";

const normalize = (str: string) =>
  str.toLocaleLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();

const quoteFilter = (str: string) => `"${str.replace(/"/g, "")}"`;

// Given a Spotify track ID, returns a new Track object with the earliest release of that song
export async function GET({ url }) {
  const id = url.searchParams.get("id");

  if (!id) {
    throw new Error("No ID provided");
  }

  const track = await spotify.tracks.get(id);

  // Remove extras like " - Live", "(Remastered)", etc.
  const trackNoExtras = removeSongExtraText(track.name);
  const artist = track.artists[0].name;
  const releaseDate = track.album.release_date;

  const query = `track:${quoteFilter(trackNoExtras)} artist:${quoteFilter(artist)} year:1900-${releaseDate.slice(0, 4)}`;

  const results = (await spotify.search(query, ["track"], undefined, 50)).tracks
    .items;

  if (!results) return Response.json(null);

  const normalizedName = normalize(trackNoExtras);

  const earliestRelease = results
    // Exclude tracks with different names
    .filter((result) => normalize(result.name) === normalizedName)
    // Exclude tracks from a different artist
    .filter((result) => result.artists[0].name === artist)
    // Exclude singles
    .filter((result) => result.album.album_type !== "single")
    // Exclude releases that aren't earlier than the selected track
    .filter((result) => result.album.release_date < releaseDate)
    .sort((a, b) =>
      a.album.release_date.localeCompare(b.album.release_date),
    )[0];

  return Response.json(earliestRelease ?? null);
}
