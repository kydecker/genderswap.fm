import { and, count, desc, eq, type SQL, sql } from "drizzle-orm";
import { ORDERED_TAG_GROUPS } from "$lib/constants";
import type { getDb } from "$lib/server/db";
import { covers, tagCounts } from "$lib/server/db/schema";
import type { Enums } from "$lib/types/types";

type Db = ReturnType<typeof getDb>;

const PAGE_SIZE = 48;
const ROW_SIZE = 10;

const songColumns = {
  id: true,
  name: true,
  artists: true,
  album_name: true,
  album_img: true,
} as const;

const hasTag = (tag: string) =>
  sql`exists (select 1 from json_each(${covers.tags}) where value = ${tag})`;

const isVisible = sql`not exists (select 1 from json_each(${covers.tags}) where value in ('transition_mtm', 'transition_ftf'))`;

const findCovers = (
  db: Db,
  where: SQL | undefined,
  limit: number,
  offset = 0,
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

export async function loadRows(db: Db) {
  const tags = ORDERED_TAG_GROUPS.flat();
  const [counts, latest, ...tagged] = await db.batch([
    db.select().from(tagCounts),
    findCovers(db, isVisible, ROW_SIZE),
    ...tags.map((tag) => findCovers(db, hasTag(tag), ROW_SIZE)),
  ]);
  const countOf = new Map(counts.map(({ tag, n }) => [tag, n]));

  return [
    {
      tag: null,
      covers: latest,
      totalCount: countOf.get("*visible") ?? 0,
    },
    ...tags.map((tag, i) => ({
      tag,
      covers: tagged[i],
      totalCount: countOf.get(tag) ?? 0,
    })),
  ].filter((row) => row.covers.length > 0);
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
