import type { Enums, Tables } from "#lib/types/types.js";

type TagSong = Pick<
  Tables<"songs">,
  | "acousticness"
  | "album_year"
  | "duration_ms"
  | "energy"
  | "gender"
  | "tempo"
  | "valence"
>;

const diff = (cover: number | null, original: number | null) =>
  cover == null || original == null ? null : cover - original;

const transitions: Record<string, Enums<"tags">> = {
  "female>male": "transition_ftm",
  "male>female": "transition_mtf",
  "female>female": "transition_ftf",
  "male>male": "transition_mtm",
};

export const computeTags = (
  original: TagSong,
  cover: TagSong,
): Enums<"tags">[] => {
  const tags: Enums<"tags">[] = [];

  const upDown = (
    field: Exclude<keyof TagSong, "gender">,
    threshold: number,
    name: string = field,
  ) => {
    const delta = diff(cover[field], original[field]);
    if (delta == null) return;
    if (delta >= threshold) tags.push(`${name}_up` as Enums<"tags">);
    else if (delta <= -threshold) tags.push(`${name}_down` as Enums<"tags">);
  };

  upDown("acousticness", 0.7);
  upDown("duration_ms", 120000, "duration");
  upDown("energy", 0.5);
  upDown("tempo", 40);

  const transition =
    original.gender.length === 1 &&
    cover.gender.length === 1 &&
    transitions[`${original.gender[0]}>${cover.gender[0]}`];
  if (transition) tags.push(transition);

  upDown("valence", 0.5);

  const decade = Math.min(
    50,
    Math.floor((cover.album_year - original.album_year) / 10) * 10,
  );
  if (decade >= 10) tags.push(`years_apart_${decade}` as Enums<"tags">);

  return tags;
};
