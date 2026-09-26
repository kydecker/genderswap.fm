import { error } from "@sveltejs/kit";
import { supabase } from "$lib/supabase";

const SITE_URL = "https://genderswap.fm";
const STATIC_PATHS = ["/", "/about", "/new"];

// Supabase caps responses at 1000 rows by default
const BATCH_SIZE = 1000;

type SitemapCover = { slug: string; created_at: string };

async function getAllCovers() {
  const covers: SitemapCover[] = [];

  for (let from = 0; ; from += BATCH_SIZE) {
    const { data, error: dbError } = await supabase
      .from("covers")
      .select("slug, created_at")
      .order("created_at", { ascending: false })
      .range(from, from + BATCH_SIZE - 1);

    if (dbError) {
      throw error(500, { message: "Could not load covers for sitemap" });
    }

    covers.push(...data);

    if (data.length < BATCH_SIZE) {
      return covers;
    }
  }
}

function urlEntry(path: string, lastmod?: string) {
  return `  <url>
    <loc>${SITE_URL}${path}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
  </url>`;
}

export async function GET() {
  const covers = await getAllCovers();

  const entries = [
    ...STATIC_PATHS.map((path) => urlEntry(path)),
    ...covers.map(({ slug, created_at }) =>
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
