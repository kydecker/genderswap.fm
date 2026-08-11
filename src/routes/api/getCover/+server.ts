import { supabase } from "$lib/supabase";

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
export async function GET({ url }) {
  const id = url.searchParams.get("id");

  if (!id) {
    throw new Error("No ID provided");
  }

  const { data: existingCover } = await supabase
    .from("covers")
    .select(
      `slug,
      created_at,
      original:original_id(name, artists),
      cover:cover_id(artists)`,
    )
    .eq("cover_id", id)
    .returns<ExistingCover>()
    .single();

  if (!existingCover) return Response.json(null);

  return Response.json(existingCover);
}
