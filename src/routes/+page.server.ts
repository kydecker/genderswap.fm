import { error, redirect } from "@sveltejs/kit";
import { TAGS } from "#lib/constants.js";
import { loadGrid, loadRows } from "#lib/server/browse.js";
import { getDb } from "#lib/server/db/index.js";

const legacyPath = (url: URL) => {
  const tag = url.searchParams.get("tag");
  if (tag !== null) {
    if (!Object.hasOwn(TAGS, tag)) error(404, "Tag not found");
    return `/${TAGS[tag as keyof typeof TAGS].slug}`;
  }
  if (
    url.searchParams.get("view") === "latest" ||
    (url.searchParams.has("page") && !url.searchParams.get("q"))
  ) {
    return "/latest";
  }
};

export async function load({ url, setHeaders }) {
  const path = legacyPath(url);
  if (path) {
    const params = new URLSearchParams(url.searchParams);
    params.delete("tag");
    params.delete("view");
    const search = params.size ? `?${params}` : "";
    redirect(301, `${path}${search}`);
  }

  setHeaders({ "cache-control": "public, max-age=0, s-maxage=300" });
  const db = getDb();

  if (url.searchParams.get("q")) {
    return { view: "grid" as const, ...(await loadGrid(db, url, null)) };
  }

  return { view: "rows" as const, ...(await loadRows(db)) };
}
