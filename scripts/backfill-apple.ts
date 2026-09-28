import { execFileSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import {
  lookupAlbumTracks,
  lookupTracks,
  searchTracks,
  trackIdentity,
} from "../src/lib/itunes.ts";
import {
  appleTrackUrl,
  bestMatch,
  songRowIdentity,
} from "../src/lib/matching.ts";

type Song = {
  id: number;
  name: string;
  artists: string[];
  duration_ms: number | null;
  album_upc: string | null;
};

const target = process.argv.includes("--remote") ? "--remote" : "--local";
const ids = process.argv
  .find((arg) => arg.startsWith("--ids="))
  ?.slice("--ids=".length)
  .split(",")
  .filter((id) => /^\d+$/.test(id));
const onlyIds = ids?.length ? ` AND id IN (${ids.join(",")})` : "";
const LOOKUP_BATCH = 150;
const WRITE_BATCH = 25;
const ITUNES_INTERVAL = 3_500;

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

const write = (statements: string[]) => {
  if (statements.length) d1(["--command", statements.join("\n")]);
};

const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;

let lastRequestAt = 0;

const itunes = async <T>(request: () => Promise<T>) => {
  for (let attempt = 1; ; attempt++) {
    await sleep(Math.max(0, lastRequestAt + ITUNES_INTERVAL - Date.now()));
    lastRequestAt = Date.now();
    try {
      return await request();
    } catch (error) {
      if (attempt === 3) throw error;
      await sleep(60_000);
    }
  }
};

const findAppleTrack = async (song: Song) => {
  const identity = songRowIdentity(song);
  const { album_upc } = song;

  if (album_upc) {
    const albumTracks = await itunes(() => lookupAlbumTracks(album_upc));
    const match = bestMatch(identity, albumTracks, trackIdentity);
    if (match) return match;
  }

  const results = await itunes(() =>
    searchTracks(`${identity.artist} ${song.name}`, 25),
  );
  return bestMatch(identity, results, trackIdentity);
};

const unmatched = query<Omit<Song, "artists"> & { artists: string }>(
  `SELECT id, name, artists, duration_ms, album_upc FROM songs WHERE apple_id IS NULL${onlyIds} ORDER BY id`,
).map((song) => ({ ...song, artists: JSON.parse(song.artists) as string[] }));

console.log(`${unmatched.length} songs without an Apple track (${target})`);

let pending: string[] = [];
let found = 0;

for (const [i, song] of unmatched.entries()) {
  const track = await findAppleTrack(song).catch((error: Error) => {
    console.error(`${song.id}: ${error.message}`);
    return null;
  });

  if (track) {
    pending.push(
      `UPDATE songs SET apple_id = ${quote(String(track.trackId))}, apple_music_url = ${quote(appleTrackUrl(track.trackViewUrl))}, artwork = ${quote(track.artwork)} WHERE id = ${song.id} AND apple_id IS NULL;`,
    );
    found++;
  }

  if (pending.length === WRITE_BATCH || i === unmatched.length - 1) {
    write(pending);
    pending = [];
  }

  console.log(
    `${i + 1}/${unmatched.length} · ${song.name} → ${track ? appleTrackUrl(track.trackViewUrl) : "no match"} · found ${found}`,
  );
}

const missingArtwork = query<{ apple_id: string }>(
  `SELECT DISTINCT apple_id FROM songs WHERE apple_id IS NOT NULL AND artwork LIKE 'spotify:%'${onlyIds}`,
);

console.log(`${missingArtwork.length} Apple tracks missing artwork`);

let updated = 0;
for (let i = 0; i < missingArtwork.length; i += LOOKUP_BATCH) {
  const batch = missingArtwork.slice(i, i + LOOKUP_BATCH);
  const tracks = await itunes(() =>
    lookupTracks(batch.map((song) => song.apple_id)),
  );

  write(
    tracks.map(
      ({ trackId, artwork }) =>
        `UPDATE songs SET artwork = ${quote(artwork)} WHERE apple_id = ${quote(String(trackId))};`,
    ),
  );
  updated += tracks.length;
  console.log(
    `${Math.min(i + LOOKUP_BATCH, missingArtwork.length)}/${missingArtwork.length} · updated ${updated}`,
  );
}
