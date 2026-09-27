import type { Track } from "@spotify/web-api-ts-sdk";
import { fail, redirect } from "@sveltejs/kit";
import { inArray } from "drizzle-orm";
import { setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { slugifyCover } from "$lib/helpers";
import { newCoverSchema } from "$lib/schemas";
import { getDb } from "$lib/server/db";
import { covers, songs } from "$lib/server/db/schema";
import { computeTags } from "$lib/tags";
import type { Enums, Tables } from "$lib/types/types";

export const load = async () => {
  const form = await superValidate(zod4(newCoverSchema));

  return { form };
};

export const actions = {
  default: async ({ request, fetch, platform }) => {
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
      const row: Omit<Tables<"covers">, "id" | "created_at" | "tags"> = {
        original_id: original.id,
        cover_id: cover.id,
        slug: slugifyCover(cover.name, cover.artists[0].name),
        description,
        contributor,
      };

      return row;
    };

    const originalSongRow = await formatSongRow({
      song: original,
      gender: originalGenders,
    });

    const coverSongRow = await formatSongRow({
      song: cover,
      gender: coverGenders,
    });

    const coverRow = await formatCoverRow({
      original,
      cover,
      description,
      contributor,
    });

    const db = getDb(platform);

    // Existing song rows take precedence, as they did in the Postgres trigger
    const existingSongs = await db.query.songs.findMany({
      where: inArray(songs.id, [originalSongRow.id, coverSongRow.id]),
    });
    const stored = (row: typeof originalSongRow) =>
      existingSongs.find((song) => song.id === row.id) ?? row;

    const tags = computeTags(stored(originalSongRow), stored(coverSongRow));

    try {
      await db.batch([
        db.insert(songs).values(originalSongRow).onConflictDoNothing(),
        db.insert(songs).values(coverSongRow).onConflictDoNothing(),
        db.insert(covers).values({ ...coverRow, tags }),
      ]);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return setError(
        form,
        message.includes("covers.slug")
          ? "This cover has already been added"
          : message,
      );
    }

    redirect(302, `/cover/${coverRow.slug}?new=true`);
  },
};
