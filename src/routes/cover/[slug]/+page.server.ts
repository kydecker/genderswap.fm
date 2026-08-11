import { error } from "@sveltejs/kit";
import { getReadableTitle, smartquotes } from "$lib/helpers";
import { supabase } from "$lib/supabase";
import type { Enums, Tables } from "$lib/types/types";

// We have to redefine this type because Supabase is inferring it incorrectly
export type Cover = {
  original: Tables<"songs">;
  cover: Tables<"songs">;
  created_at: string;
  description: string;
  contributor: string;
  tags: Enums<"tags">[];
};

export async function load({ params: { slug } }) {
  const { data } = await supabase
    .from("covers")
    .select(
      `
    original:original_id(id, name, url, artists, gender, album_name, album_img, album_year, energy, key, tempo, danceability, valence, time_signature),
    cover:cover_id(id, name, url, artists, gender, album_name, album_img, album_year, energy, key, tempo, danceability, valence, time_signature),
    created_at,
    description,
    contributor,
    tags`,
    )
    .eq("slug", slug)
    .returns<Cover>()
    .single();

  if (!data) {
    return error(404, {
      message: "Cover not found",
    });
  }

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
