export type SongIdentity = {
  name: string;
  artist: string;
  durationMs?: number | null;
};

export const removeSongExtraText = (song: string) => {
  const songNoExtras = song
    // Remove parentheses from songs *if* they have a space beforehand
    // MATCH: "Crazy in Love (feat. Jay-Z)" -> "Crazy in Love"
    // DO NOT MATCH: "(I Can't Get No) Satisfaction"
    .replace(/\s\([^()]*\)/g, "")
    .trim()
    // Remove everything after a ' - ' in the song name
    // "Can't Get You out of My Head - Live at KEXP" -> "Can't Get You out of My Head"
    .split(" - ")[0]
    // Remove bracketed text
    // "What Was I Made For? [From The Motion Picture "Barbie"]" -> "What Was I Made For?"
    .replace(/\s\[[^\]]*\]/g, "");

  return songNoExtras;
};

export const normalize = (text: string) =>
  text
    .normalize("NFKD")
    .toLowerCase()
    .split(" - ")[0]
    .replace(/\s[([][^)\]]*[)\]]/g, "")
    .replace(/&/g, "and")
    .replace(/[^\p{L}\p{N}]/gu, "");

const lengthDifference = (a: SongIdentity, b: SongIdentity) =>
  a.durationMs && b.durationMs ? Math.abs(a.durationMs - b.durationMs) : null;

export const isSameSong = (a: SongIdentity, b: SongIdentity) => {
  const [aName, bName] = [normalize(a.name), normalize(b.name)];
  const [aArtist, bArtist] = [normalize(a.artist), normalize(b.artist)];
  const difference = lengthDifference(a, b);
  return (
    !!aName &&
    !!bName &&
    !!aArtist &&
    !!bArtist &&
    (aName.startsWith(bName) || bName.startsWith(aName)) &&
    (aArtist.includes(bArtist) || bArtist.includes(aArtist)) &&
    (difference === null ? aName === bName : difference <= 5000)
  );
};

export const bestMatch = <T>(
  target: SongIdentity,
  candidates: T[],
  identity: (candidate: T) => SongIdentity,
) => {
  const ranked = candidates
    .map((candidate) => ({ candidate, id: identity(candidate) }))
    .filter(({ id }) => isSameSong(target, id))
    .map(({ candidate, id }) => ({
      candidate,
      exact: normalize(id.name) === normalize(target.name) ? 0 : 1,
      difference: lengthDifference(id, target) ?? 0,
    }))
    .sort((a, b) => a.exact - b.exact || a.difference - b.difference);
  return ranked[0]?.candidate ?? null;
};

export const appleTrackUrl = (trackViewUrl: string) => {
  const url = new URL(trackViewUrl);
  url.searchParams.delete("uo");
  return url.toString();
};

export const songRowIdentity = (song: {
  name: string;
  artists: string[];
  duration_ms: number | null;
}): SongIdentity => ({
  name: song.name,
  artist: song.artists[0],
  durationMs: song.duration_ms,
});
