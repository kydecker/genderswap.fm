import { supabase } from "$lib/supabase";
import type { Tables } from "$lib/types/types";

type GridItem = {
  original: Tables<"songs">;
  cover: Tables<"songs">;
  slug: string;
};

const PAGE_SIZE = 48;

export async function load({ url }) {
  const page = Number(url.searchParams.get("page") ?? 1);
  const tag = url.searchParams.get("tag");
  const searchQuery = url.searchParams.get("q");

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const covers = supabase
    .from("covers")
    .select(
      `
        slug,
        original:original_id(id, name, artists, album_name, album_img),
        cover:cover_id(id, name, artists, album_name, album_img)
      `,
      { count: "estimated" },
    )
    .order("created_at", { ascending: false });

  if (tag) {
    covers.overlaps("tags", [tag]);
  }

  if (!tag && !searchQuery) {
    covers
      .not("tags", "cs", '{"transition_mtm"}')
      .not("tags", "cs", '{"transition_ftf"}');
  }

  if (searchQuery) {
    covers.textSearch("fts", searchQuery, {
      config: "english",
      type: "websearch",
    });
  }

  const paginatedCovers = covers.range(from, to);

  const { data, count } = await paginatedCovers.returns<GridItem[]>();

  return {
    covers: data,
    totalCount: count,
    from,
    to,
    isFirst: page === 1,
    isLast: !data || data.length < PAGE_SIZE,
  };
}
