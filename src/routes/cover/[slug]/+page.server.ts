import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { artworkFaviconUrl } from "#lib/artwork.js";
import { getReadableTitle, smartquotes } from "#lib/helpers.js";
import { loadRelated } from "#lib/server/browse.js";
import { getDb } from "#lib/server/db/index.js";
import { covers } from "#lib/server/db/schema.js";
import type { Enums, Tables } from "#lib/types/types.js";

export type Cover = {
  original: Tables<"songs">;
  cover: Tables<"songs">;
  created_at: string;
  description: string;
  contributor: string;
  tags: Enums<"tags">[];
};

const songColumns = {
  name: true,
  artists: true,
  gender: true,
  album_name: true,
  artwork: true,
  album_color: true,
  album_year: true,
  energy: true,
  key: true,
  tempo: true,
  danceability: true,
  valence: true,
  apple_music_url: true,
  spotify_url: true,
  tidal_url: true,
} as const;

export async function load({ params: { slug }, setHeaders }) {
  const db = getDb();

  const data = await db.query.covers.findFirst({
    columns: {
      id: true,
      created_at: true,
      description: true,
      contributor: true,
      tags: true,
    },
    with: {
      original: { columns: songColumns },
      cover: { columns: songColumns },
    },
    where: eq(covers.slug, slug),
  });

  if (!data) {
    return error(404, "Cover not found");
  }

  setHeaders({ "cache-control": "public, max-age=0, s-maxage=300" });

  const { id, original, cover, created_at, description, contributor, tags } =
    data as Cover & { id: number };

  const related = await loadRelated(db, {
    id,
    tags: tags ?? [],
    artists: [...cover.artists, ...original.artists],
  });

  const title = getReadableTitle({
    originalName: original.name,
    originalArtists: original.artists,
    coverArtists: cover.artists,
  });

  return {
    pageTitle: smartquotes(original.name),
    title,
    description: description ? smartquotes(description) : "",
    original,
    cover,
    created_at,
    contributor,
    tags,
    related,
    favicon: artworkFaviconUrl(cover.artwork),
  };
}
