import { loadGrid } from "$lib/server/browse";
import { getDb } from "$lib/server/db";

export async function load({ url, platform, setHeaders }) {
  setHeaders({ "cache-control": "public, max-age=0, s-maxage=300" });

  return loadGrid(getDb(platform), url, null);
}
