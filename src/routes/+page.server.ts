import { and, count, desc, type SQL, sql } from "drizzle-orm";
import { toFtsQuery } from "$lib/search";
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

  const empty = {
    covers: [],
    totalCount: 0,
    from,
    to,
    isFirst: page === 1,
    isLast: true,
  };

  const conditions: SQL[] = [];

  if (tag) {
    conditions.push(
      sql`exists (select 1 from json_each(${covers.tags}) where value = ${tag})`,
    );
  }

  if (!tag && !searchQuery) {
    conditions.push(
      sql`not exists (select 1 from json_each(${covers.tags}) where value in ('transition_mtm', 'transition_ftf'))`,
    );
  }

  if (searchQuery) {
    const match = toFtsQuery(searchQuery);
    if (!match) return empty;

    conditions.push(
      sql`${covers.id} in (select rowid from covers_fts where covers_fts match ${match})`,
    );
  }

  const where = and(...conditions);

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
