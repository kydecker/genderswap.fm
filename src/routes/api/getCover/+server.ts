import { eq, inArray } from "drizzle-orm";
import { getDb } from "$lib/server/db";
import { covers, songs } from "$lib/server/db/schema";

export type ExistingCover = {
  original: {
    name: string;
    artists: string[];
  };
  cover: {
    artists: string[];
  };
  slug: string;
  created_at: string;
};

export async function GET({ url, platform }) {
  const appleId = url.searchParams.get("appleId");

  if (!appleId) {
    return Response.json(null, { status: 400 });
  }

  const db = getDb(platform);
  const existingCover: ExistingCover | undefined =
    await db.query.covers.findFirst({
      columns: { slug: true, created_at: true },
      with: {
        original: { columns: { name: true, artists: true } },
        cover: { columns: { artists: true } },
      },
      where: inArray(
        covers.cover_id,
        db
          .select({ id: songs.id })
          .from(songs)
          .where(eq(songs.apple_id, appleId)),
      ),
    });

  return Response.json(existingCover ?? null);
}
