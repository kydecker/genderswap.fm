// One-off: node --env-file=.env scripts/export-supabase.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { computeTags } from "../src/lib/tags.ts";

const { PUBLIC_SUPABASE_URL: url, PUBLIC_SUPABASE_ANON_KEY: key } = process.env;
if (!url || !key) throw new Error("Missing Supabase env vars");

const PAGE = 1000;
const ROWS_PER_INSERT = 50;

type Row = Record<string, unknown>;

const fetchAll = async (table: string, select: string, order: string) => {
  const rows: Row[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const res = await fetch(
      `${url}/rest/v1/${table}?select=${select}&order=${order}&offset=${offset}&limit=${PAGE}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
    const page: Row[] = await res.json();
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
};

const literal = (value: unknown): string => {
  if (value == null) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
  return literal(JSON.stringify(value));
};

const inserts = (table: string, columns: string[], rows: Row[]) => {
  const statements: string[] = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_INSERT) {
    const values = rows
      .slice(i, i + ROWS_PER_INSERT)
      .map((row) => `(${columns.map((c) => literal(row[c])).join(", ")})`);
    statements.push(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES\n${values.join(",\n")};`,
    );
  }
  return statements;
};

const iso = (timestamp: unknown) => new Date(String(timestamp)).toISOString();

const songs = await fetchAll("songs", "*", "id");
const covers = await fetchAll(
  "covers",
  "id,slug,created_at,original_id,cover_id,description,contributor,tags",
  "id",
);

const songsById = new Map(songs.map((song) => [song.id as string, song]));
const songColumns = Object.keys(songs[0]);
const coverColumns = Object.keys(covers[0]);

const mismatches: string[] = [];
for (const cover of covers) {
  const original = songsById.get(cover.original_id as string);
  const coverSong = songsById.get(cover.cover_id as string);
  if (!original || !coverSong)
    throw new Error(`Missing song for ${cover.slug}`);

  const expected = JSON.stringify(cover.tags ?? []);
  // biome-ignore lint/suspicious/noExplicitAny: raw REST rows
  const actual = JSON.stringify(computeTags(original as any, coverSong as any));
  if (expected !== actual) {
    mismatches.push(
      `${cover.slug}\n  stored:   ${expected}\n  computed: ${actual}`,
    );
  }
}

const sql = [
  ...inserts(
    "songs",
    songColumns,
    songs.map((song) => ({ ...song, created_at: iso(song.created_at) })),
  ),
  ...inserts(
    "covers",
    coverColumns,
    covers.map((cover) => ({ ...cover, created_at: iso(cover.created_at) })),
  ),
].join("\n");

mkdirSync("scripts/out", { recursive: true });
writeFileSync("scripts/out/seed.sql", `${sql}\n`);
writeFileSync("scripts/out/tag-mismatches.txt", mismatches.join("\n"));

console.log(`songs: ${songs.length}, covers: ${covers.length}`);
console.log(
  `tag mismatches: ${mismatches.length} (see scripts/out/tag-mismatches.txt)`,
);
