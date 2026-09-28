import { execFileSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { artworkId } from "../src/lib/artwork.ts";
import { appleTrackUrl, bestMatch } from "../src/lib/matching.ts";

type Song = {
  id: number;
  name: string;
  artists: string;
  duration_ms: number | null;
  album_upc: string | null;
};

type ITunesResult = {
  wrapperType?: string;
  kind?: string;
  trackId?: number;
  trackName?: string;
  artistName?: string;
  trackTimeMillis?: number;
  trackViewUrl?: string;
  artworkUrl100?: string;
};

type AppleTrack = Required<
  Pick<
    ITunesResult,
    "trackId" | "trackName" | "artistName" | "trackViewUrl" | "artworkUrl100"
  >
> &
  ITunesResult;

const target = process.argv.includes("--remote") ? "--remote" : "--local";
const limit = Number(
  process.argv.find((arg) => /^\d+$/.test(arg)) ?? Number.POSITIVE_INFINITY,
);
const ids = process.argv
  .find((arg) => arg.startsWith("--ids="))
  ?.slice("--ids=".length)
  .split(",")
  .filter((id) => /^\d+$/.test(id));
const onlyIds = ids?.length ? ` AND id IN (${ids.join(",")})` : "";
const BATCH = 150;
const ITUNES_DELAY = 3_500;

const d1 = (args: string[]) =>
  execFileSync(
    "pnpm",
    [
      "exec",
      "wrangler",
      "d1",
      "execute",
      "genderswap-fm",
      target,
      "--yes",
      ...args,
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );

const query = <T>(sql: string) =>
  (JSON.parse(d1(["--json", "--command", sql])) as [{ results: T[] }])[0]
    .results;

const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;

const itunes = async (path: string, params: Record<string, string>) => {
  const url = `https://itunes.apple.com/${path}?${new URLSearchParams({ country: "US", ...params })}`;
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url);
    if (response.ok) {
      const { results } = (await response.json()) as {
        results: ITunesResult[];
      };
      await sleep(ITUNES_DELAY);
      return results.filter(
        (result): result is AppleTrack =>
          result.wrapperType === "track" &&
          result.kind === "song" &&
          !!result.trackId &&
          !!result.trackViewUrl &&
          !!result.artworkUrl100,
      );
    }
    if (attempt === 3) throw new Error(`iTunes ${response.status}: ${url}`);
    await sleep(60_000);
  }
};

const findAppleTrack = async (song: Song) => {
  const artists = JSON.parse(song.artists) as string[];
  const identity = {
    name: song.name,
    artist: artists[0],
    durationMs: song.duration_ms,
  };
  const trackIdentity = (track: AppleTrack) => ({
    name: track.trackName,
    artist: track.artistName,
    durationMs: track.trackTimeMillis,
  });

  if (song.album_upc) {
    const albumTracks = await itunes("lookup", {
      upc: song.album_upc,
      entity: "song",
    });
    const match = bestMatch(identity, albumTracks, trackIdentity);
    if (match) return match;
  }

  const results = await itunes("search", {
    term: `${artists[0]} ${song.name}`,
    media: "music",
    entity: "song",
    limit: "25",
  });
  return bestMatch(identity, results, trackIdentity);
};

const unmatched = query<Song>(
  `SELECT id, name, artists, duration_ms, album_upc FROM songs WHERE apple_id IS NULL${onlyIds} ORDER BY id`,
).slice(0, limit);

console.log(`${unmatched.length} songs without an Apple track (${target})`);

let found = 0;
for (const [i, song] of unmatched.entries()) {
  const track = await findAppleTrack(song).catch((error: Error) => {
    console.error(`${song.id}: ${error.message}`);
    return null;
  });
  const artwork = track && artworkId(track.artworkUrl100);

  if (track && artwork) {
    d1([
      "--command",
      `UPDATE songs SET apple_id = ${quote(String(track.trackId))}, apple_music_url = ${quote(appleTrackUrl(track.trackViewUrl))}, artwork = ${quote(artwork)} WHERE id = ${song.id} AND apple_id IS NULL;`,
    ]);
    found++;
  }

  console.log(
    `${i + 1}/${unmatched.length} · ${song.name} → ${track ? track.trackViewUrl : "no match"} · found ${found}`,
  );
}

const missingArtwork = query<{ apple_id: string }>(
  `SELECT DISTINCT apple_id FROM songs WHERE apple_id IS NOT NULL AND artwork LIKE 'spotify:%'${onlyIds}`,
).slice(0, limit);

console.log(`${missingArtwork.length} Apple tracks missing artwork`);

let updated = 0;
for (let i = 0; i < missingArtwork.length; i += BATCH) {
  const ids = missingArtwork.slice(i, i + BATCH).map((song) => song.apple_id);
  const tracks = await itunes("lookup", { id: ids.join(",") });

  const updates = tracks.flatMap(({ trackId, artworkUrl100 }) => {
    const artwork = artworkId(artworkUrl100);
    return artwork
      ? [
          `UPDATE songs SET artwork = ${quote(artwork)} WHERE apple_id = ${quote(String(trackId))};`,
        ]
      : [];
  });

  if (updates.length) d1(["--command", updates.join("\n")]);
  updated += updates.length;
  console.log(
    `${Math.min(i + BATCH, missingArtwork.length)}/${missingArtwork.length} · updated ${updated}`,
  );
}
