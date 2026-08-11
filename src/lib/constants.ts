import type { Enums } from "./types/types";

export const MAX_DESCRIPTION_CHARS = 160;
export const MAX_CONTRIBUTOR_CHARS = 24;

type Tag = {
  label: string;
  shortLabel?: string;
  description: string;
};

export const TAGS: Record<Enums<"tags">, Tag> = {
  acousticness_up: {
    label: "more acoustic",
    description: "These covers are stripped down versions of the original.",
  },
  acousticness_down: {
    label: "less acoustic",
    description: "These covers take an acoustic song somewhere new.",
  },
  danceability_up: {
    label: "more danceable",
    description:
      "A stable rhythm and a strong beat make these covers more dance-friendly than the original.",
  },
  danceability_down: {
    label: "less danceable",
    description:
      "Where'd the beat go? These covers find beauty in irregularity.",
  },
  duration_up: {
    label: "longer",
    description: "These covers are at least a minute longer than the original.",
  },
  duration_down: {
    label: "shorter",
    description:
      "These covers are at least a minute shorter than the original.",
  },
  energy_up: {
    label: "more energetic",
    description: "These covers bring home the intensity. Loud, fast, fun.",
  },
  energy_down: {
    label: "less energetic",
    description:
      "Less intense than the original—these are covers to relax with.",
  },
  instrumentalness_up: {
    label: "more instrumental",
    description:
      "Who needs lyrics? These covers are instrument-forward with little-to-no vocals.",
  },
  instrumentalness_down: {
    label: "less instrumental",
    description:
      "These covers take an instrumental-heavy original and embellish it with vocals.",
  },
  key_change: {
    label: "different key",
    description: "These covers are in a different key than the original.",
  },
  tempo_up: {
    label: "faster",
    description: "These covers are at least 40 BPM faster than the original.",
  },
  tempo_down: {
    label: "slower",
    description: "These covers are at least 40 BPM slower than the original.",
  },
  time_signature_change: {
    label: "different meter",
    description:
      "These covers are in a different time signature than the original.",
  },
  transition_ftm: {
    label: "FTM",
    description: "Boys cover girls.",
  },
  transition_mtf: {
    label: "MTF",
    description: "Girls cover boys.",
  },
  transition_ftf: {
    label: "FTF",
    description:
      "Girls cover girls, but that doesn't mean the gender is the same.",
  },
  transition_mtm: {
    label: "MTM",
    description:
      "Boys cover boys, but that doesn't mean the gender is the same.",
  },
  valence_up: {
    label: "happier",
    description: "These covers are more cheerful than the original.",
  },
  valence_down: {
    label: "sadder",
    description: "These covers are more melancholy than the original.",
  },
  years_apart_10: {
    label: "10+ years apart",
    description:
      "These covers were released between 10 and 20 years after the original.",
  },
  years_apart_20: {
    label: "20+ years apart",
    shortLabel: "20+",
    description:
      "These covers were released between 20 and 30 years after the original.",
  },
  years_apart_30: {
    label: "30+ years apart",
    shortLabel: "30+",
    description:
      "These covers were released between 30 and 40 years after the original.",
  },
  years_apart_40: {
    label: "40+ years apart",
    shortLabel: "40+",
    description:
      "These covers were released between 40 and 50 years after the original.",
  },
  years_apart_50: {
    label: "50+ years apart",
    shortLabel: "50+",
    description: "These covers were released over 50 years after the original.",
  },
};

export const ORDERED_TAG_GROUPS: Enums<"tags">[][] = [
  ["transition_mtf", "transition_ftm"],
  ["valence_up", "valence_down"],
  ["tempo_up", "tempo_down"],
  ["duration_up", "duration_down"],
  ["key_change"],
  ["time_signature_change"],
  ["energy_up", "energy_down"],
  ["acousticness_up", "acousticness_down"],
  ["danceability_up", "danceability_down"],
  ["instrumentalness_up", "instrumentalness_down"],
  [
    "years_apart_10",
    "years_apart_20",
    "years_apart_30",
    "years_apart_40",
    "years_apart_50",
  ],
  ["transition_mtm", "transition_ftf"],
];
