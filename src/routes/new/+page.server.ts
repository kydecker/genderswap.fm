import { fail, redirect } from "@sveltejs/kit";
import { and, between, eq, inArray, isNull, type SQL, sql } from "drizzle-orm";
import { setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { env } from "$env/dynamic/private";
import { artworkId, artworkUrl } from "$lib/artwork";
import { slugifyCover } from "$lib/helpers";
import {
  albumName,
  type ITunesTrack,
  lookupTracks,
  releaseYear,
  songName,
  trackIdentity,
} from "$lib/itunes";
import { appleTrackUrl, bestMatch } from "$lib/matching";
import { newCoverSchema } from "$lib/schemas";
import { getAlbumColor } from "$lib/server/albumColor";
import { getDb } from "$lib/server/db";
import { covers, songs } from "$lib/server/db/schema";
import { findDeezerMatch, getAudioFeatures } from "$lib/server/enrich";
import { findTidalLink } from "$lib/server/links";
import { computeTags } from "$lib/tags";
import type { Enums, Tables } from "$lib/types/types";

type NewSong = typeof songs.$inferInsert & Omit<Tables<"songs">, "id">;

type ResolvedSong =
  | { id: number; song: NewSong; status: "existing" | "claimed" }
  | { id: SQL; song: NewSong; status: "new" };

const findKnownSong = async (
  db: ReturnType<typeof getDb>,
  track: ITunesTrack,
  isrc: string | null,
) => {
  if (isrc) {
    const byIsrc = await db.query.songs.findFirst({
      where: eq(songs.isrc, isrc),
    });
    if (byIsrc) return byIsrc;
  }

  const duration = track.trackTimeMillis;
  if (!duration) return null;

  const unmatched = await db.query.songs.findMany({
    where: and(
      isNull(songs.apple_id),
      between(songs.duration_ms, duration - 5000, duration + 5000),
    ),
  });
  return bestMatch(trackIdentity(track), unmatched, (song) => ({
    name: song.name,
    artist: song.artists[0],
    durationMs: song.duration_ms,
  }));
};

export const load = async () => {
  const form = await superValidate(zod4(newCoverSchema));

  return { form };
};

export const actions = {
  default: async ({ request, platform }) => {
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
    const appleIds = [String(original.trackId), String(cover.trackId)];

    const [tracks, existingSongs] = await Promise.all([
      lookupTracks(appleIds).catch(() => []),
      db.query.songs.findMany({ where: inArray(songs.apple_id, appleIds) }),
    ]);

    const originalTrack = tracks.find(
      ({ trackId }) => trackId === original.trackId,
    );
    const coverTrack = tracks.find(({ trackId }) => trackId === cover.trackId);

    if (!originalTrack || !coverTrack) {
      return setError(form, "Couldn’t load these songs from Apple Music");
    }

    const resolveSong = async (
      track: ITunesTrack,
      gender: Enums<"gender">[],
    ): Promise<ResolvedSong> => {
      const appleId = String(track.trackId);
      const existing = existingSongs.find((song) => song.apple_id === appleId);
      if (existing)
        return { id: existing.id, song: existing, status: "existing" };

      const match = await findDeezerMatch(track).catch(() => null);
      const isrc = match?.isrc ?? null;
      const known = await findKnownSong(db, track, isrc);
      if (known) return { id: known.id, song: known, status: "claimed" };

      const artwork = artworkId(track.artworkUrl100) ?? "";
      const upc = match?.upc ?? null;

      const [features, tidal_url, album_color] = await Promise.all([
        isrc ? getAudioFeatures(isrc).catch(() => null) : null,
        findTidalLink(
          {
            isrc,
            upc,
            disc_number: track.discNumber ?? null,
            track_number: track.trackNumber ?? null,
          },
          {
            clientId: env.TIDAL_CLIENT_ID,
            clientSecret: env.TIDAL_CLIENT_SECRET,
          },
        ),
        getAlbumColor(artworkUrl(artwork, 64, "jpg")).catch(() => null),
      ]);

      return {
        id: sql`(select max(${songs.id}) from ${songs} where ${songs.apple_id} = ${appleId})`,
        status: "new",
        song: {
          created_at: new Date().toISOString(),
          name: songName(track),
          artists: match?.artists ?? [track.artistName],
          album_name: albumName(track),
          album_year: releaseYear(track),
          artwork,
          album_color,
          gender,
          acousticness: features?.acousticness ?? null,
          danceability: features?.danceability ?? null,
          duration_ms: track.trackTimeMillis ?? null,
          energy: features?.energy ?? null,
          instrumentalness: features?.instrumentalness ?? null,
          key: features?.key ?? null,
          liveness: features?.liveness ?? null,
          loudness: features?.loudness ?? null,
          mode: features?.mode ?? null,
          speechiness: features?.speechiness ?? null,
          tempo: features?.tempo ?? null,
          valence: features?.valence ?? null,
          isrc,
          album_upc: upc,
          apple_id: appleId,
          apple_music_url: appleTrackUrl(track.trackViewUrl),
          spotify_url: features?.spotify_url ?? null,
          tidal_url,
        },
      };
    };

    const [originalSong, coverSong] = await Promise.all([
      resolveSong(originalTrack, originalGenders),
      resolveSong(coverTrack, coverGenders),
    ]);

    if (
      typeof originalSong.id === "number" &&
      originalSong.id === coverSong.id
    ) {
      return setError(form, "Cover and original songs can't be the same");
    }

    const resolved = [
      { resolvedSong: originalSong, track: originalTrack },
      { resolvedSong: coverSong, track: coverTrack },
    ];
    const songWrites = resolved.map(({ resolvedSong, track }) =>
      resolvedSong.status === "new"
        ? db.insert(songs).values(resolvedSong.song)
        : db
            .update(songs)
            .set({
              apple_id: String(track.trackId),
              apple_music_url: sql`coalesce(${songs.apple_music_url}, ${appleTrackUrl(track.trackViewUrl)})`,
            })
            .where(
              and(
                eq(songs.id, resolvedSong.id as number),
                isNull(songs.apple_id),
              ),
            ),
    );

    const slug = slugifyCover(coverTrack.trackName, coverSong.song.artists[0]);

    const insertCover = db
      .insert(covers)
      .values({
        original_id: originalSong.id,
        cover_id: coverSong.id,
        slug,
        description,
        contributor,
        tags: computeTags(originalSong.song, coverSong.song),
      })
      .onConflictDoNothing({ target: covers.slug })
      .returning({ slug: covers.slug });

    const result = await db
      .batch([...songWrites, insertCover] as unknown as [typeof insertCover])
      .catch((e: Error) => e);

    if (result instanceof Error) return setError(form, result.message);

    const inserted = result.at(-1) as Awaited<typeof insertCover>;
    if (!inserted.length) {
      return setError(form, "This cover has already been added");
    }

    redirect(302, `/cover/${slug}?new=true`);
  },
};
