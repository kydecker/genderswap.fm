import { and, count, desc, sql } from "drizzle-orm";
import { getDb } from "$lib/server/db";
import { covers } from "$lib/server/db/schema";

const PAGE_SIZE = 48;

const songColumns = {
  id: true,
  name: true,
  artists: true,
  album_name: true,
  album_img: true,
} as const;

export async function load({ url, platform }) {
  const db = getDb(platform);

  const page = Number(url.searchParams.get("page") ?? 1);
  const tag = url.searchParams.get("tag");
  const searchQuery = url.searchParams.get("q");

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Quote each word so input can't break FTS5 query syntax
  const match = searchQuery
    ?.match(/[\p{L}\p{N}]+/gu)
    ?.map((word) => `"${word}"`)
    .join(" ");

  const where = and(
    tag
      ? sql`exists (select 1 from json_each(${covers.tags}) where value = ${tag})`
      : undefined,
    !tag && !searchQuery
      ? sql`not exists (select 1 from json_each(${covers.tags}) where value in ('transition_mtm', 'transition_ftf'))`
      : undefined,
    searchQuery
      ? match
        ? sql`${covers.id} in (select rowid from covers_fts where covers_fts match ${match})`
        : sql`0`
      : undefined,
  );

  const [data, [{ totalCount }]] = await db.batch([
    db.query.covers.findMany({
      columns: { slug: true },
      with: {
        original: { columns: songColumns },
        cover: { columns: songColumns },
      },
      where,
      orderBy: desc(covers.created_at),
      limit: PAGE_SIZE,
      offset: from,
    }),
    db.select({ totalCount: count() }).from(covers).where(where),
  ]);

  return {
    covers: data,
    totalCount,
    from,
    to,
    isFirst: page === 1,
    isLast: data.length < PAGE_SIZE,
  };
}
