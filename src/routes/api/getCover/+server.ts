import { eq } from "drizzle-orm";
import { getDb } from "$lib/server/db";
import { covers } from "$lib/server/db/schema";

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

// Given a Spotify track ID, returns a new Track object with the earliest release of that song
export async function GET({ url, platform }) {
  const id = url.searchParams.get("id");

  if (!id) {
    throw new Error("No ID provided");
  }

  const existingCover: ExistingCover | undefined = await getDb(
    platform,
  ).query.covers.findFirst({
    columns: { slug: true, created_at: true },
    with: {
      original: { columns: { name: true, artists: true } },
      cover: { columns: { artists: true } },
    },
    where: eq(covers.cover_id, id),
  });

  return Response.json(existingCover ?? null);
}
