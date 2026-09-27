import { TAG_BY_SLUG } from "$lib/constants";
import { loadGrid } from "$lib/server/browse";
import { getDb } from "$lib/server/db";
import type { Enums } from "$lib/types/types";

export async function load({ params, url, platform, setHeaders }) {
  const tag = TAG_BY_SLUG.get(params.category) as Enums<"tags">;

  setHeaders({ "cache-control": "public, max-age=0, s-maxage=300" });

  return { tag, ...(await loadGrid(getDb(platform), url, tag)) };
}
