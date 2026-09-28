export type SongIdentity = {
  name: string;
  artist: string;
  durationMs?: number | null;
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
