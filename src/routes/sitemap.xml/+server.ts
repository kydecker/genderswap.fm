import { desc } from "drizzle-orm";
import { SITE_URL, TAGS } from "#lib/constants.js";
import { getDb } from "#lib/server/db/index.js";
import { covers } from "#lib/server/db/schema.js";

const STATIC_PATHS = [
  "/",
  "/about",
  "/new",
  "/latest",
  ...Object.values(TAGS).map(({ slug }) => `/${slug}`),
];

function urlEntry(path: string, lastmod?: string) {
  return `  <url>
    <loc>${SITE_URL}${path}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
  </url>`;
}

export async function GET() {
  const rows = await getDb()
    .select({ slug: covers.slug, created_at: covers.created_at })
    .from(covers)
    .orderBy(desc(covers.created_at));

  const entries = [
    ...STATIC_PATHS.map((path) => urlEntry(path)),
    ...rows.map(({ slug, created_at }) =>
      urlEntry(
        `/cover/${encodeURIComponent(slug)}`,
        new Date(created_at).toISOString(),
      ),
    ),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
