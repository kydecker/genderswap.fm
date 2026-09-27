import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { getReadableTitle, smartquotes } from "$lib/helpers";
import { getDb } from "$lib/server/db";
import { covers } from "$lib/server/db/schema";
import type { Enums, Tables } from "$lib/types/types";

export type Cover = {
  original: Tables<"songs">;
  cover: Tables<"songs">;
  created_at: string;
  description: string;
  contributor: string;
  tags: Enums<"tags">[];
};

const songColumns = {
  id: true,
  name: true,
  url: true,
  artists: true,
  gender: true,
  album_name: true,
  album_img: true,
  album_year: true,
  energy: true,
  key: true,
  tempo: true,
  danceability: true,
  valence: true,
  time_signature: true,
  apple_music_url: true,
  tidal_url: true,
} as const;

export async function load({ params: { slug }, platform, setHeaders }) {
  const db = getDb(platform);

  const data = await db.query.covers.findFirst({
    columns: {
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
    return error(404, {
      message: "Cover not found",
    });
  }

  setHeaders({ "cache-control": "public, max-age=0, s-maxage=300" });

  const { original, cover, created_at, description, contributor, tags } =
    data as Cover;

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
  };
}
