import { and, count, desc, inArray, type SQL, sql } from "drizzle-orm";
import { HIDDEN_TAGS, ORDERED_TAGS } from "$lib/constants";
import type { getDb } from "$lib/server/db";
import { covers, tagCounts } from "$lib/server/db/schema";
import type { Enums } from "$lib/types/types";

type Db = ReturnType<typeof getDb>;

const PAGE_SIZE = 48;
const ROW_SIZE = 10;

const originalColumns = { name: true, artists: true } as const;
const coverColumns = {
  ...originalColumns,
  album_img: true,
  album_color: true,
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
    with: {
      original: { columns: originalColumns },
      cover: { columns: coverColumns },
    },
    where,
    orderBy: desc(covers.created_at),
    limit,
    offset,
  });

const rankedByTag = sql`
  select covers.id, covers.slug, tag.value as tag, row_number() over (
    partition by tag.value order by covers.created_at desc, covers.id desc
  ) as rank
  from covers, json_each(covers.tags) as tag`;

export async function loadRows(db: Db) {
  const [counts, latest, tagged] = await db.batch([
    db.select().from(tagCounts),
    findCovers(db, isVisible, ROW_SIZE),
    db.query.covers.findMany({
      columns: { slug: true, tags: true },
      with: {
        original: { columns: originalColumns },
        cover: { columns: coverColumns },
      },
      where: sql`${covers.id} in (select id from (${rankedByTag}) where rank <= ${ROW_SIZE})`,
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

  // Quote each word so input can't break FTS5 query syntax
  const match = searchQuery
    ?.match(/[\p{L}\p{N}]+/gu)
    ?.map((word) => `"${word}"`)
    .join(" ");

  const where = and(
    tag ? hasTag(tag) : undefined,
    !tag && !searchQuery ? isVisible : undefined,
    searchQuery
      ? match
        ? sql`${covers.id} in (select rowid from covers_fts where covers_fts match ${match})`
        : sql`0`
      : undefined,
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

export type GridData = Awaited<ReturnType<typeof loadGrid>>;
