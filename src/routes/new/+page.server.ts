import type { Track } from "@spotify/web-api-ts-sdk";
import { fail, redirect } from "@sveltejs/kit";
import { setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { slugifyCover } from "$lib/helpers";
import { newCoverSchema } from "$lib/schemas";
import { supabase } from "$lib/supabase";
import type { Enums, Tables } from "$lib/types/types";

export const load = async () => {
  const form = await superValidate(zod4(newCoverSchema));

  return { form };
};

export const actions = {
  default: async ({ request, fetch }) => {
    const form = await superValidate(request, zod4(newCoverSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const {
      original,
      originalGenders,
      cover,
      coverGenders,
      description,
      contributor,
    } = form.data;

    const formatSongRow = async ({
      song,
      gender,
    }: {
      song: Track;
      gender: Enums<"gender">[];
    }) => {
      const response = await fetch(`/api/getAudioFeatures?id=${song.id}`, {
        method: "GET",
      });
      const audioFeatures = await response.json();

      const formattedName = song.name
        .split(" - ")[0] // "Smells Like Teen Spirit - Radio Edit" -> "Smells Like Teen Spirit"
        .replace(/\s\([^()]*\)/g, ""); // "Time After Time (2022 Remaster)" -> "Time After Time"

      const row: Omit<Tables<"songs">, "created_at"> = {
        id: song.id,
        name: formattedName,
        artists: song.artists.map((artist) => artist.name),
        url: song.external_urls.spotify,
        album_name: song.album.name,
        album_year: Number.parseInt(song.album.release_date.slice(0, 4), 10),
        album_img: song.album.images.map((image) => image.url),
        gender: gender,
        acousticness: audioFeatures.acousticness,
        danceability: audioFeatures.danceability,
        duration_ms: audioFeatures.duration_ms,
        energy: audioFeatures.energy,
        instrumentalness: audioFeatures.instrumentalness,
        key: audioFeatures.key,
        liveness: audioFeatures.liveness,
        loudness: audioFeatures.loudness,
        mode: audioFeatures.mode,
        speechiness: audioFeatures.speechiness,
        tempo: audioFeatures.tempo,
        time_signature: audioFeatures.time_signature,
        valence: audioFeatures.valence,
      };

      return row;
    };

    const formatCoverRow = async ({
      original,
      cover,
      description,
      contributor,
    }: {
      original: Track;
      cover: Track;
      description: string;
      contributor: string;
    }) => {
      const row: Omit<
        Tables<"covers">,
        "id" | "created_at" | "tags" | "fts"
      > = {
        original_id: original.id,
        cover_id: cover.id,
        slug: slugifyCover(cover.name, cover.artists[0].name),
        description,
        contributor,
      };

      return row;
    };

    // Shape track data for submission to the 'songs' table
    const originalSongRow = await formatSongRow({
      song: original,
      gender: originalGenders,
    });

    // Check if original already exists
    const { data: existingOriginal } = await supabase
      .from("songs")
      .select("id")
      .eq("id", originalSongRow.id)
      .single();

    // If it doesn't exist, insert it
    if (originalSongRow && !existingOriginal) {
      const { error } = await supabase.from("songs").insert(originalSongRow);
      if (error) setError(form, error.message);
    }

    // Shape cover data for submission to the 'songs' table
    const coverSongRow =
      cover && (await formatSongRow({ song: cover, gender: coverGenders }));

    // Check if cover already exists
    const { data: existingCover } = await supabase
      .from("songs")
      .select("id")
      .eq("id", coverSongRow.id)
      .single();

    // If it doesn't exist, insert it
    if (coverSongRow && !existingCover) {
      const { error } = await supabase.from("songs").insert(coverSongRow);
      if (error) setError(form, error.message);
    }

    // Shape data for submission to the 'covers' table
    // Capturing the link between IDs and user contributions
    const coverRow = await formatCoverRow({
      original,
      cover,
      description,
      contributor,
    });

    if (coverRow) {
      const { data, error } = await supabase
        .from("covers")
        .insert(coverRow)
        .select("slug")
        .single();
      error && setError(form, error.message);

      // Success! Redirect :)
      if (data) {
        redirect(302, `/cover/${data.slug}?new=true`);
      }
    }

    return { form };
  },
};
