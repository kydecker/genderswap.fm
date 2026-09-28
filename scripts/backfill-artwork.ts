import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import sharp from "sharp";
import { getPlatformProxy } from "wrangler";
import {
  artworkName,
  isSpotifyArtwork,
  sourceArtworkUrl,
} from "../src/lib/artwork.ts";
import {
  type ArtworkBucket,
  type ArtworkLoader,
  artworkFiles,
  loadSourceArtwork,
  storeArtwork,
} from "../src/lib/server/artwork.ts";

type Statement = { bind(...values: unknown[]): Statement };

type Env = {
  ARTWORK: ArtworkBucket & {
    list(options: { cursor?: string }): Promise<{
      objects: { key: string }[];
      truncated: boolean;
      cursor?: string;
    }>;
    delete(keys: string[]): Promise<void>;
  };
  DB: {
    prepare(sql: string): Statement & {
      all<T>(): Promise<{ results: T[] }>;
    };
    batch(statements: Statement[]): Promise<unknown>;
  };
};

const remote = process.argv.includes("--remote");
const updateDb = process.argv.includes("--update-db");
const prune = process.argv.includes("--prune");
const CONCURRENCY = 4;
const ATTEMPTS = 4;
const DB_BATCH = 50;

const { main, assets, ...config } = JSON.parse(
  readFileSync("wrangler.jsonc", "utf8"),
);
for (const binding of [...config.d1_databases, ...config.r2_buckets]) {
  binding.remote = remote;
}
const configPath = join(tmpdir(), "genderswap-backfill-artwork.jsonc");
writeFileSync(configPath, JSON.stringify(config));

const proxy = await getPlatformProxy<Env>({
  configPath,
  persist: { path: ".wrangler/state/v3" },
  remoteBindings: remote,
});
const { ARTWORK, DB } = proxy.env;

const withRetries = async <T>(task: () => Promise<T>) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await task();
    } catch (error) {
      if (attempt === ATTEMPTS) throw error;
      await sleep(2_000 * attempt);
    }
  }
};

const isSource = (artwork: string) =>
  artwork.includes("/") || isSpotifyArtwork(artwork);

const loadResizedArtwork = (source: string): ArtworkLoader => {
  const original = fetch(sourceArtworkUrl(source, 640)).then((response) => {
    if (!response.ok) throw new Error(`${response.status}: ${source}`);
    return response.arrayBuffer();
  });
  return async (size) =>
    new Uint8Array(
      await sharp(await original)
        .resize(size, size, { fit: "cover" })
        .jpeg({ quality: 85 })
        .toBuffer(),
    ).buffer;
};

const listKeys = async () => {
  const keys = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await withRetries(() => ARTWORK.list({ cursor }));
    for (const { key } of page.objects) keys.add(key);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return keys;
};

const { results: rows } = await DB.prepare(
  "SELECT artists, album_name, artwork FROM songs ORDER BY id",
).all<{ artists: string; album_name: string; artwork: string }>();

const names = new Map<string, string>();
const taken = new Set(
  rows.map(({ artwork }) => artwork).filter((artwork) => !isSource(artwork)),
);
for (const { artists, album_name, artwork } of rows) {
  if (!isSource(artwork) || names.has(artwork)) continue;
  const base = artworkName(JSON.parse(artists)[0], album_name);
  let name = base;
  for (let n = 2; taken.has(name); n++) name = `${base}-${n}`;
  taken.add(name);
  names.set(artwork, name);
}

console.log(
  `${names.size} source artworks to name (${remote ? "--remote" : "--local"})`,
);

const existing = await listKeys();
const queue = [...names].filter(([, name]) =>
  artworkFiles(name).some(({ key }) => !existing.has(key)),
);
console.log(`${queue.length} to upload, ${existing.size} objects in bucket`);

let done = 0;
const failed = new Set<string>();
const total = queue.length;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      const [source, name] = next;
      try {
        await withRetries(() =>
          storeArtwork(
            ARTWORK,
            name,
            isSpotifyArtwork(source)
              ? loadResizedArtwork(source)
              : loadSourceArtwork(source),
          ),
        );
      } catch (error) {
        failed.add(source);
        console.error(`${source}: ${(error as Error).message}`);
      }
      if (++done % 100 === 0 || done === total) {
        console.log(`${done}/${total} · failed ${failed.size}`);
      }
    }
  }),
);

if (updateDb) {
  const updates = [...names].filter(([source]) => !failed.has(source));
  for (let i = 0; i < updates.length; i += DB_BATCH) {
    await withRetries(() =>
      DB.batch(
        updates
          .slice(i, i + DB_BATCH)
          .map(([source, name]) =>
            DB.prepare("UPDATE songs SET artwork = ? WHERE artwork = ?").bind(
              name,
              source,
            ),
          ),
      ),
    );
  }
  console.log(`Renamed artwork on ${updates.length} sources`);
}

if (prune) {
  const keep = new Set(
    [...taken].flatMap((name) => artworkFiles(name).map(({ key }) => key)),
  );
  const stale = [...(await listKeys())].filter((key) => !keep.has(key));
  for (let i = 0; i < stale.length; i += 1000) {
    await withRetries(() => ARTWORK.delete(stale.slice(i, i + 1000)));
  }
  console.log(`Pruned ${stale.length} stale objects`);
}

console.log(`Failed ${failed.size}`);
await proxy.dispose();
