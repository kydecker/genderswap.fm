import type { Enums, Tables } from "$lib/types/types";

type TagSong = Pick<
  Tables<"songs">,
  | "acousticness"
  | "album_year"
  | "danceability"
  | "duration_ms"
  | "energy"
  | "gender"
  | "instrumentalness"
  | "key"
  | "tempo"
  | "time_signature"
  | "valence"
>;

// SQL NULL semantics: null comparisons never add a tag
const diff = (cover: number | null, original: number | null) =>
  cover == null || original == null ? null : cover - original;

const isOnly = (gender: Enums<"gender">[], value: Enums<"gender">) =>
  gender.length === 1 && gender[0] === value;

// Port of the `generate_tags` Postgres trigger
export const computeTags = (
  original: TagSong,
  cover: TagSong,
): Enums<"tags">[] => {
  const tags: Enums<"tags">[] = [];

  const upDown = (
    delta: number | null,
    threshold: number,
    up: Enums<"tags">,
    down: Enums<"tags">,
  ) => {
    if (delta == null) return;
    if (delta >= threshold) tags.push(up);
    else if (delta <= -threshold) tags.push(down);
  };

  const changed = (a: number | null, b: number | null) =>
    a != null && b != null && a !== b;

  upDown(
    diff(cover.acousticness, original.acousticness),
    0.7,
    "acousticness_up",
    "acousticness_down",
  );
  upDown(
    diff(cover.danceability, original.danceability),
    0.4,
    "danceability_up",
    "danceability_down",
  );
  upDown(
    diff(cover.duration_ms, original.duration_ms),
    120000,
    "duration_up",
    "duration_down",
  );
  upDown(diff(cover.energy, original.energy), 0.5, "energy_up", "energy_down");
  upDown(
    diff(cover.instrumentalness, original.instrumentalness),
    0.7,
    "instrumentalness_up",
    "instrumentalness_down",
  );

  if (changed(cover.key, original.key)) tags.push("key_change");

  upDown(diff(cover.tempo, original.tempo), 40, "tempo_up", "tempo_down");

  if (changed(cover.time_signature, original.time_signature)) {
    tags.push("time_signature_change");
  }

  if (isOnly(original.gender, "female") && isOnly(cover.gender, "male")) {
    tags.push("transition_ftm");
  } else if (
    isOnly(original.gender, "male") &&
    isOnly(cover.gender, "female")
  ) {
    tags.push("transition_mtf");
  } else if (
    isOnly(original.gender, "female") &&
    isOnly(cover.gender, "female")
  ) {
    tags.push("transition_ftf");
  } else if (isOnly(original.gender, "male") && isOnly(cover.gender, "male")) {
    tags.push("transition_mtm");
  }

  upDown(
    diff(cover.valence, original.valence),
    0.5,
    "valence_up",
    "valence_down",
  );

  const yearsApart = cover.album_year - original.album_year;
  for (const years of [50, 40, 30, 20, 10] as const) {
    if (yearsApart >= years) {
      tags.push(`years_apart_${years}`);
      break;
    }
  }

  return tags;
};
