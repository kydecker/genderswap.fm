import { z } from "zod";
import { MAX_CONTRIBUTOR_CHARS, MAX_DESCRIPTION_CHARS } from "$lib/constants";
import { type ITunesTrack, parseAppleMusicUrl } from "$lib/itunes";
import type { Enums } from "$lib/types/types";

const itunesTrack = z
  .object({
    trackId: z.number().int().positive(),
    trackName: z.string().min(1),
    artistId: z.number().int(),
    artistName: z.string().min(1),
    collectionName: z.string().min(1),
    releaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
    artwork: z.string().regex(/^[\w.-]+(\/[\w.-]+)+$/),
    trackTimeMillis: z.number().int().positive().optional(),
    discNumber: z.number().int().optional(),
    trackNumber: z.number().int().optional(),
    trackViewUrl: z.string(),
    previewUrl: z.url().optional(),
  })
  .refine(
    (track) => parseAppleMusicUrl(track.trackViewUrl) === String(track.trackId),
  );

export const isValidTrack = (value: unknown): value is ITunesTrack =>
  itunesTrack.safeParse(value).success;

const track = (message: string) => z.custom<ITunesTrack>(isValidTrack, message);

export const newCoverSchema = z
  .object({
    cover: track("Please select a cover song"),
    coverGenders: z
      .array(z.custom<Enums<"gender">>())
      .nonempty("Please select at least one gender"),
    original: track("Please select an original song"),
    originalGenders: z
      .array(z.custom<Enums<"gender">>())
      .nonempty("Please select at least one gender"),
    description: z
      .string()
      .trim()
      .max(
        MAX_DESCRIPTION_CHARS,
        `Description must be shorter than ${MAX_DESCRIPTION_CHARS} characters`,
      )
      .optional()
      .default(""),
    contributor: z
      .string()
      .trim()
      .max(
        MAX_CONTRIBUTOR_CHARS,
        `Name must be shorter than ${MAX_CONTRIBUTOR_CHARS} characters`,
      )
      .optional()
      .default(""),
  })
  .refine(
    (data) => data.cover.trackId !== data.original.trackId,
    "Cover and original songs can't be the same",
  );
