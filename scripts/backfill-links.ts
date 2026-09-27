import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { findSongLinks, type SongLinks } from "../src/lib/server/links.ts";

type Song = {
  id: string;
  name: string;
  artists: string;
  duration_ms: number | null;
  isrc: string | null;
  album_upc: string | null;
  album_id?: string;
  disc_number?: number | null;
  track_number?: number | null;
};

process.loadEnvFile();

const target = process.argv.includes("--remote") ? "--remote" : "--local";
const limit = Number(
  process.argv.find((arg) => /^\d+$/.test(arg)) ?? Number.POSITIVE_INFINITY,
);
const tidal = {
  clientId: process.env.TIDAL_CLIENT_ID,
  clientSecret: process.env.TIDAL_CLIENT_SECRET,
};
const tempDir = mkdtempSync(join(tmpdir(), "backfill-links-"));

const d1 = async (args: string[], attempts = 3) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return execFileSync(
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
    } catch (error) {
      if (attempt === attempts) throw error;
      await sleep(30_000);
    }
  }
};

const quote = (value: string | null) =>
  value === null ? "NULL" : `'${value.replaceAll("'", "''")}'`;

const writeRows = async (
  rows: (SongLinks & {
    id: string;
    isrc: string | null;
    album_upc: string | null;
  })[],
) => {
  const file = join(tempDir, "batch.sql");
  writeFileSync(
    file,
    rows
      .map(
        (row) =>
          `UPDATE songs SET isrc = coalesce(${quote(row.isrc)}, isrc), album_upc = coalesce(${quote(row.album_upc)}, album_upc), apple_music_url = coalesce(${quote(row.apple_music_url)}, apple_music_url), tidal_url = coalesce(${quote(row.tidal_url)}, tidal_url), links_checked_at = ${quote(row.links_checked_at)} WHERE id = ${quote(row.id)};`,
      )
      .join("\n"),
  );
  await d1(["--file", file]);
};

const getSpotifyToken = async () => {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const { access_token } = await response.json();
  return access_token as string;
};

const spotifyGet = async (path: string, token: string) => {
  for (;;) {
    const response = await fetch(`https://api.spotify.com/v1/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 429) {
      await sleep(Number(response.headers.get("retry-after") ?? 5) * 1000);
      continue;
    }
    if (!response.ok) throw new Error(`Spotify ${response.status}: ${path}`);
    return response.json();
  }
};

const fillSpotifyDetails = async (songs: Song[]) => {
  const token = await getSpotifyToken();

  for (let i = 0; i < songs.length; i += 50) {
    const batch = songs.slice(i, i + 50);
    const { tracks } = await spotifyGet(
      `tracks?ids=${batch.map((song) => song.id).join(",")}`,
      token,
    );

    for (const [j, track] of tracks.entries()) {
      batch[j].isrc ??= track?.external_ids?.isrc ?? null;
      batch[j].duration_ms ??= track?.duration_ms ?? null;
      batch[j].album_id = track?.album?.id;
      batch[j].disc_number = track?.disc_number ?? null;
      batch[j].track_number = track?.track_number ?? null;
    }
  }

  const albumIds = [
    ...new Set(
      songs
        .filter((song) => !song.album_upc && song.album_id)
        .map((song) => song.album_id as string),
    ),
  ];
  const upcs = new Map<string, string | null>();

  for (let i = 0; i < albumIds.length; i += 20) {
    const { albums } = await spotifyGet(
      `albums?ids=${albumIds.slice(i, i + 20).join(",")}`,
      token,
    );
    for (const album of albums) {
      if (album) upcs.set(album.id, album.external_ids?.upc ?? null);
    }
  }

  for (const song of songs) {
    if (song.album_id) song.album_upc ??= upcs.get(song.album_id) ?? null;
  }
};

const [{ results: songs }] = JSON.parse(
  await d1([
    "--json",
    "--command",
    "SELECT id, name, artists, duration_ms, isrc, album_upc FROM songs WHERE links_checked_at IS NULL OR (album_upc IS NULL AND (apple_music_url IS NULL OR tidal_url IS NULL)) ORDER BY id",
  ]),
) as [{ results: Song[] }];

const queue = songs.slice(0, limit);
console.log(`${queue.length} of ${songs.length} songs to check (${target})`);

await fillSpotifyDetails(queue);

let pending: Parameters<typeof writeRows>[0] = [];
let found = { apple: 0, tidal: 0, failed: 0 };

for (const [i, song] of queue.entries()) {
  const query = {
    ...song,
    upc: song.album_upc,
    artists: JSON.parse(song.artists) as string[],
    disc_number: song.disc_number ?? null,
    track_number: song.track_number ?? null,
  };

  let links = await findSongLinks(query, tidal);
  if (!links.links_checked_at) {
    await sleep(60_000);
    links = await findSongLinks(query, tidal);
  }

  found = {
    apple: found.apple + (links.apple_music_url ? 1 : 0),
    tidal: found.tidal + (links.tidal_url ? 1 : 0),
    failed: found.failed + (links.links_checked_at ? 0 : 1),
  };
  pending.push({
    id: song.id,
    isrc: song.isrc,
    album_upc: song.album_upc,
    ...links,
  });

  if (pending.length === 25 || i === queue.length - 1) {
    await writeRows(pending);
    pending = [];
    console.log(
      `${i + 1}/${queue.length} · Apple ${found.apple} · Tidal ${found.tidal} · failed ${found.failed}`,
    );
  }

  await sleep(4_000);
}
