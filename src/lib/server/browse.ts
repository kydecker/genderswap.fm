import { and, count, desc, inArray, ne, type SQL, sql } from "drizzle-orm";
import { HIDDEN_TAGS, ORDERED_TAGS } from "#lib/constants.js";
import type { getDb } from "#lib/server/db/index.js";
import { covers, tagCounts } from "#lib/server/db/schema.js";
import type { Enums } from "#lib/types/types.js";

type Db = ReturnType<typeof getDb>;

const PAGE_SIZE = 48;
const ROW_SIZE = 10;
const RELATED_SIZE = 20;
const RELATED_BY_ARTIST = 24;
const RELATED_PER_TAG = 12;

const originalColumns = { name: true, artists: true } as const;
const coverColumns = {
  ...originalColumns,
  artwork: true,
  album_color: true,
} as const;
const withSongs = {
  original: { columns: originalColumns },
  cover: { columns: coverColumns },
} as const;

const hasTag = (tag: string) =>
  sql`exists (select 1 from json_each(${covers.tags}) where value = ${tag})`;

const isVisible = sql`not exists (select 1 from json_each(${covers.tags}) where value in ${HIDDEN_TAGS})`;

const visibleCount = (countOf: Map<string, number>) =>
  HIDDEN_TAGS.reduce(
    (total, tag) => total - (countOf.get(tag) ?? 0),
    countOf.get("*all") ?? 0,
  );

const findCovers = (
  db: Db,
  where: SQL | undefined,
  limit?: number,
  offset?: number,
) =>
  db.query.covers.findMany({
    columns: { slug: true },
    with: withSongs,
    where,
    orderBy: desc(covers.created_at),
    limit,
    offset,
  });

// Quote each word so input can't break FTS5 query syntax
const ftsPhrase = (text: string) =>
  text
    .match(/[\p{L}\p{N}]+/gu)
    ?.map((word) => `"${word}"`)
    .join(" ");

const inFts = (match: string) =>
  sql`${covers.id} in (select rowid from covers_fts where covers_fts match ${match})`;

const MAX_COMPOUND_TERMS = 5;

const unionAll = (queries: SQL[]): SQL => {
  if (queries.length <= MAX_COMPOUND_TERMS) {
    return sql.join(queries, sql` union all `);
  }
  const groupSize = Math.ceil(queries.length / MAX_COMPOUND_TERMS);
  return unionAll(
    Array.from(
      { length: Math.ceil(queries.length / groupSize) },
      (_, i) =>
        sql`select cover_id from (${unionAll(queries.slice(i * groupSize, (i + 1) * groupSize))})`,
    ),
  );
};

const latestIdsByTag = (tags: Enums<"tags">[], limit: number) =>
  unionAll(
    tags.map(
      (tag) =>
        sql`select cover_id from (select cover_id from cover_tags where tag = ${tag} order by created_at desc, cover_id desc limit ${limit})`,
    ),
  );

const latestByTag = latestIdsByTag(ORDERED_TAGS, ROW_SIZE);

export async function loadRows(db: Db) {
  const [counts, latest, tagged] = await db.batch([
    db.select().from(tagCounts),
    findCovers(db, isVisible, ROW_SIZE),
    db.query.covers.findMany({
      columns: { slug: true, tags: true },
      with: withSongs,
      where: sql`${covers.id} in (${latestByTag})`,
      orderBy: [desc(covers.created_at), desc(covers.id)],
    }),
  ]);

  const countOf = new Map(counts.map(({ tag, n }) => [tag, n]));
  const slugsByTag = new Map<Enums<"tags">, string[]>();
  const coversBySlug = Object.fromEntries(
    latest.map((cover) => [cover.slug, cover]),
  );
  for (const { tags, ...cover } of tagged) {
    coversBySlug[cover.slug] = cover;
    for (const tag of tags ?? []) {
      const slugs = slugsByTag.get(tag) ?? [];
      if (slugs.length < ROW_SIZE) slugsByTag.set(tag, [...slugs, cover.slug]);
    }
  }

  return {
    searchable: true,
    covers: coversBySlug,
    rows: [
      {
        tag: null,
        slugs: latest.map(({ slug }) => slug),
        totalCount: visibleCount(countOf),
      },
      ...ORDERED_TAGS.map((tag) => ({
        tag,
        slugs: slugsByTag.get(tag) ?? [],
        totalCount: countOf.get(tag) ?? 0,
      })),
    ].filter((row) => row.slugs.length > 0),
  };
}

export async function loadGrid(db: Db, url: URL, tag: Enums<"tags"> | null) {
  const page = Number(url.searchParams.get("page") ?? 1);
  const searchQuery = url.searchParams.get("q");
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const match = searchQuery ? ftsPhrase(searchQuery) : undefined;

  const where = and(
    tag ? hasTag(tag) : undefined,
    !tag && !searchQuery ? isVisible : undefined,
    searchQuery ? (match ? inFts(match) : sql`0`) : undefined,
  );

  const [data, counts] = await db.batch([
    findCovers(db, where, PAGE_SIZE, from),
    searchQuery
      ? db
          .select({ tag: sql<string>`'*search'`, n: count() })
          .from(covers)
          .where(where)
      : db
          .select()
          .from(tagCounts)
          .where(
            inArray(tagCounts.tag, tag ? [tag] : ["*all", ...HIDDEN_TAGS]),
          ),
  ]);

  const countOf = new Map(counts.map(({ tag, n }) => [tag, n]));
  const totalCount = searchQuery
    ? (countOf.get("*search") ?? 0)
    : tag
      ? (countOf.get(tag) ?? 0)
      : visibleCount(countOf);

  return {
    searchable: true,
    covers: data,
    page,
    totalCount,
    from,
    to,
    isFirst: page === 1,
    isLast: data.length < PAGE_SIZE,
  };
}

export async function loadRelated(
  db: Db,
  {
    id,
    tags,
    artists,
  }: { id: number; tags: Enums<"tags">[]; artists: string[] },
) {
  const artistKeys = new Set(artists.map((artist) => artist.toLowerCase()));
  const phrases = [...artistKeys].flatMap(
    (artist) => ftsPhrase(artist)?.replaceAll(" ", " + ") ?? [],
  );

  const [byArtist, byTag] = await db.batch([
    findCovers(
      db,
      phrases.length
        ? and(ne(covers.id, id), inFts(`artists : (${phrases.join(" OR ")})`))
        : sql`0`,
      RELATED_BY_ARTIST,
    ),
    db.query.covers.findMany({
      columns: { slug: true, tags: true },
      with: withSongs,
      where: tags.length
        ? and(
            ne(covers.id, id),
            sql`${covers.id} in (${latestIdsByTag(tags, RELATED_PER_TAG)})`,
          )
        : sql`0`,
      orderBy: desc(covers.created_at),
    }),
  ]);

  const tagSet = new Set(tags);
  const sharedTags = (candidateTags: Enums<"tags">[] | null) =>
    (candidateTags ?? []).filter((tag) => tagSet.has(tag)).length;

  const related = [
    ...byArtist.filter(({ original, cover }) =>
      [...original.artists, ...cover.artists].some((artist) =>
        artistKeys.has(artist.toLowerCase()),
      ),
    ),
    ...byTag
      .sort((a, b) => sharedTags(b.tags) - sharedTags(a.tags))
      .map(({ tags, ...cover }) => cover),
  ];

  return [
    ...new Map(related.map((cover) => [cover.slug, cover])).values(),
  ].slice(0, RELATED_SIZE);
}

export type GridData = Awaited<ReturnType<typeof loadGrid>>;
