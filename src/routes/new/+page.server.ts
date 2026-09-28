import { fail, redirect } from "@sveltejs/kit";
import { and, between, eq, inArray, isNull, sql } from "drizzle-orm";
import { setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { env } from "$env/dynamic/private";
import { artworkName, itunesArtworkUrl } from "$lib/artwork";
import { slugifyCover } from "$lib/helpers";
import {
  albumName,
  type ITunesTrack,
  releaseYear,
  songName,
  trackIdentity,
} from "$lib/itunes";
import { appleTrackUrl, bestMatch, songRowIdentity } from "$lib/matching";
import { newCoverSchema } from "$lib/schemas";
import { getAlbumColor } from "$lib/server/albumColor";
import { type ArtworkBucket, saveTrackArtwork } from "$lib/server/artwork";
import { getDb } from "$lib/server/db";
import { covers, songs } from "$lib/server/db/schema";
import {
  findDeezerMatch,
  getAudioFeatures,
  NO_AUDIO_FEATURES,
} from "$lib/server/enrich";
import { findTidalLink } from "$lib/server/links";
import { computeTags } from "$lib/tags";
import type { Enums, Tables } from "$lib/types/types";

type Db = ReturnType<typeof getDb>;
type NewSong = Omit<Tables<"songs">, "id">;

const findKnownSong = async (
  db: Db,
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
  return bestMatch(trackIdentity(track), unmatched, songRowIdentity);
};

const saveArtwork = async (
  bucket: ArtworkBucket | undefined,
  name: string,
  source: string,
) => {
  if (!bucket) return console.error("Artwork bucket not available");
  await saveTrackArtwork(bucket, name, source).catch((error: Error) =>
    console.error(`Artwork ${name}: ${error.message}`),
  );
};

const claimSong = (db: Db, id: number, track: ITunesTrack) =>
  db
    .update(songs)
    .set({
      apple_id: String(track.trackId),
      apple_music_url: sql`coalesce(${songs.apple_music_url}, ${appleTrackUrl(track.trackViewUrl)})`,
    })
    .where(and(eq(songs.id, id), isNull(songs.apple_id)));

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
    const bucket = platform?.env.ARTWORK;
    const appleIds = [String(original.trackId), String(cover.trackId)];

    const existingSongs = await db.query.songs.findMany({
      where: inArray(songs.apple_id, appleIds),
    });

    const resolveSong = async (
      track: ITunesTrack,
      gender: Enums<"gender">[],
    ) => {
      const appleId = String(track.trackId);
      const known = (song: Tables<"songs">) => ({
        id: song.id,
        song,
        write: claimSong(db, song.id, track),
      });

      const existing = existingSongs.find((song) => song.apple_id === appleId);
      if (existing) return known(existing);

      const match = await findDeezerMatch(track).catch(() => null);
      const found = await findKnownSong(db, track, match?.isrc ?? null);
      if (found) return known(found);

      const isrc = match?.isrc ?? null;
      const artists = match?.artists ?? [track.artistName];
      const artwork = artworkName(artists[0], albumName(track));
      const upc = match?.upc ?? null;

      const [features, tidal_url, album_color] = await Promise.all([
        isrc
          ? getAudioFeatures(isrc).catch(() => NO_AUDIO_FEATURES)
          : NO_AUDIO_FEATURES,
        findTidalLink(
          {
            isrc,
            upc,
            disc_number: track.discNumber,
            track_number: track.trackNumber,
          },
          {
            clientId: env.TIDAL_CLIENT_ID,
            clientSecret: env.TIDAL_CLIENT_SECRET,
          },
        ),
        getAlbumColor(itunesArtworkUrl(track.artwork, 64, "jpg")).catch(
          () => null,
        ),
        saveArtwork(bucket, artwork, track.artwork),
      ]);

      const song: NewSong = {
        created_at: new Date().toISOString(),
        name: songName(track),
        artists,
        album_name: albumName(track),
        album_year: releaseYear(track),
        artwork,
        album_color,
        gender,
        ...features,
        duration_ms: track.trackTimeMillis ?? null,
        isrc,
        album_upc: upc,
        apple_id: appleId,
        apple_music_url: appleTrackUrl(track.trackViewUrl),
        tidal_url,
      };

      return {
        id: sql`(select max(${songs.id}) from ${songs} where ${songs.apple_id} = ${appleId})`,
        song,
        write: db.insert(songs).values(song),
      };
    };

    const [originalSong, coverSong] = await Promise.all([
      resolveSong(original, originalGenders),
      resolveSong(cover, coverGenders),
    ]);

    if (
      typeof originalSong.id === "number" &&
      originalSong.id === coverSong.id
    ) {
      return setError(form, "Cover and original songs can't be the same");
    }

    const slug = slugifyCover(cover.trackName, coverSong.song.artists[0]);

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
      .batch([originalSong.write, coverSong.write, insertCover])
      .catch((e: Error) => e);

    if (result instanceof Error) return setError(form, result.message);

    if (!result[2].length) {
      return setError(form, "This cover has already been added");
    }

    redirect(302, `/cover/${slug}?new=true`);
  },
};
