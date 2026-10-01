import { loadGrid } from "#lib/server/browse.js";
import { getDb } from "#lib/server/db/index.js";

export async function load({ url, setHeaders }) {
  setHeaders({ "cache-control": "public, max-age=0, s-maxage=300" });

  return loadGrid(getDb(), url, null);
}
