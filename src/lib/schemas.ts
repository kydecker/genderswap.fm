import { z } from "zod";
import { MAX_CONTRIBUTOR_CHARS, MAX_DESCRIPTION_CHARS } from "$lib/constants";
import type { ITunesTrack } from "$lib/itunes";
import type { Enums } from "$lib/types/types";

const track = (message: string) =>
  z.custom<ITunesTrack>(
    (value) => typeof (value as ITunesTrack | undefined)?.trackId === "number",
    message,
  );

export const newCoverSchema = z
  .object({
    original: track("Please select an original song"),
    originalGenders: z
      .array(z.custom<Enums<"gender">>())
      .nonempty("Please select at least one gender"),
    cover: track("Please select a cover song"),
    coverGenders: z
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
