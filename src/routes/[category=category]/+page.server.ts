import { TAG_BY_SLUG } from "#lib/constants.js";
import { loadGrid } from "#lib/server/browse.js";
import { getDb } from "#lib/server/db/index.js";
import type { Enums } from "#lib/types/types.js";

export async function load({ params, url, setHeaders }) {
  const tag = TAG_BY_SLUG.get(params.category) as Enums<"tags">;

  setHeaders({ "cache-control": "public, max-age=0, s-maxage=300" });

  return { tag, ...(await loadGrid(getDb(), url, tag)) };
}
