import { and, count, desc, eq, type SQL, sql } from "drizzle-orm";
import { HIDDEN_TAGS, ORDERED_TAGS } from "$lib/constants";
import type { getDb } from "$lib/server/db";
import { covers, tagCounts } from "$lib/server/db/schema";
import type { Enums } from "$lib/types/types";

type Db = ReturnType<typeof getDb>;

const PAGE_SIZE = 48;
const ROW_SIZE = 10;

const songColumns = {
  name: true,
  artists: true,
  album_img: true,
} as const;

const hasTag = (tag: string) =>
  sql`exists (select 1 from json_each(${covers.tags}) where value = ${tag})`;

const isVisible = sql`not exists (select 1 from json_each(${covers.tags}) where value in ${HIDDEN_TAGS})`;

const findCovers = (
  db: Db,
  where: SQL | undefined,
  limit?: number,
  offset?: number,
) =>
  db.query.covers.findMany({
    columns: { slug: true },
    with: {
      original: { columns: songColumns },
      cover: { columns: songColumns },
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
  const [counts, latest, ranked, tagged] = await db.batch([
    db.select().from(tagCounts),
    findCovers(db, isVisible, ROW_SIZE),
    db
      .select({
        slug: sql<string>`slug`,
        tag: sql<Enums<"tags">>`tag`,
      })
      .from(sql`(${rankedByTag})`)
      .where(sql`rank <= ${ROW_SIZE}`)
      .orderBy(sql`rank`),
    findCovers(
      db,
      sql`${covers.id} in (select id from (${rankedByTag}) where rank <= ${ROW_SIZE})`,
    ),
  ]);

  const countOf = new Map(counts.map(({ tag, n }) => [tag, n]));
  const coversBySlug = Object.fromEntries(
    [...latest, ...tagged].map((cover) => [cover.slug, cover]),
  );
  const slugsByTag = Map.groupBy(ranked, ({ tag }) => tag);

  return {
    covers: coversBySlug,
    rows: [
      {
        tag: null,
        slugs: latest.map(({ slug }) => slug),
        totalCount: countOf.get("*visible") ?? 0,
      },
      ...ORDERED_TAGS.map((tag) => ({
        tag,
        slugs: slugsByTag.get(tag)?.map(({ slug }) => slug) ?? [],
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

  const [data, [counted]] = await db.batch([
    findCovers(db, where, PAGE_SIZE, from),
    searchQuery
      ? db.select({ n: count() }).from(covers).where(where)
      : db
          .select({ n: tagCounts.n })
          .from(tagCounts)
          .where(eq(tagCounts.tag, tag ?? "*visible")),
  ]);

  return {
    covers: data,
    totalCount: counted?.n ?? 0,
    from,
    to,
    isFirst: page === 1,
    isLast: data.length < PAGE_SIZE,
  };
}

export type GridData = Awaited<ReturnType<typeof loadGrid>>;
