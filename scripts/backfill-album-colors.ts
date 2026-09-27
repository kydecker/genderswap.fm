import { execFileSync } from "node:child_process";
import { getAlbumColor } from "../src/lib/server/albumColor.ts";

type Song = { id: string; album_img: string };

const target = process.argv.includes("--remote") ? "--remote" : "--local";
const concurrency = 8;
const batchSize = 50;

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

const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;

const [{ results: songs }] = JSON.parse(
  d1([
    "--json",
    "--command",
    "SELECT id, album_img FROM songs WHERE album_color IS NULL ORDER BY id",
  ]),
) as [{ results: Song[] }];

console.log(`${songs.length} songs without an album color (${target})`);

let failed = 0;

for (let i = 0; i < songs.length; i += batchSize) {
  const batch = songs.slice(i, i + batchSize);
  const colors = new Map<string, string>();
  let next = 0;

  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < batch.length) {
        const song = batch[next++];
        const url = (JSON.parse(song.album_img) as string[]).at(-1);
        const color = url ? await getAlbumColor(url).catch(() => null) : null;
        if (color) colors.set(song.id, color);
        else failed++;
      }
    }),
  );

  if (colors.size) {
    d1([
      "--command",
      [...colors]
        .map(
          ([id, color]) =>
            `UPDATE songs SET album_color = ${quote(color)} WHERE id = ${quote(id)};`,
        )
        .join("\n"),
    ]);
  }

  console.log(
    `${Math.min(i + batchSize, songs.length)}/${songs.length} · failed ${failed}`,
  );
}
