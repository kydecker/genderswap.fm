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

    const db = getDb(platform);

    // Existing song rows take precedence, as they did in the Postgres trigger
    const existingSongs = await db.query.songs.findMany({
      where: inArray(songs.id, [original.id, cover.id]),
    });

    const songRow = async (
      song: Track,
      gender: Enums<"gender">[],
    ): Promise<Tables<"songs">> => {
      const existing = existingSongs.find(({ id }) => id === song.id);
      if (existing) return existing;

      const response = await fetch(`/api/getAudioFeatures?id=${song.id}`);
      const audioFeatures = await response.json();

      const formattedName = song.name
        .split(" - ")[0] // "Smells Like Teen Spirit - Radio Edit" -> "Smells Like Teen Spirit"
        .replace(/\s\([^()]*\)/g, ""); // "Time After Time (2022 Remaster)" -> "Time After Time"

      return {
        id: song.id,
        created_at: new Date().toISOString(),
        name: formattedName,
        artists: song.artists.map((artist) => artist.name),
        url: song.external_urls.spotify,
        album_name: song.album.name,
        album_year: Number.parseInt(song.album.release_date.slice(0, 4), 10),
        album_img: song.album.images.map((image) => image.url),
        gender,
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
    };

    const [originalSong, coverSong] = await Promise.all([
      songRow(original, originalGenders),
      songRow(cover, coverGenders),
    ]);

    const slug = slugifyCover(cover.name, cover.artists[0].name);

    const result = await db
      .batch([
        db
          .insert(songs)
          .values([originalSong, coverSong])
          .onConflictDoNothing(),
        db
          .insert(covers)
          .values({
            original_id: original.id,
            cover_id: cover.id,
            slug,
            description,
            contributor,
            tags: computeTags(originalSong, coverSong),
          })
          .onConflictDoNothing({ target: covers.slug })
          .returning({ slug: covers.slug }),
      ])
      .catch((e: Error) => e);

    if (result instanceof Error) return setError(form, result.message);

    if (!result[1].length) {
      return setError(form, "This cover has already been added");
    }

    redirect(302, `/cover/${slug}?new=true`);
  },
};
