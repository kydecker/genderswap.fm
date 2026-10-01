import type { Enums } from "./types/types";

export const SITE_URL = "https://genderswap.fm";
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
export const MAX_DESCRIPTION_CHARS = 160;
export const MAX_CONTRIBUTOR_CHARS = 24;

type Tag = {
  slug: string;
  label: string;
  description: string;
};

const tags = {
  acousticness_up: {
    slug: "more-acoustic",
    label: "more acoustic",
    description: "Stripped down versions of the original.",
  },
  acousticness_down: {
    slug: "less-acoustic",
    label: "less acoustic",
    description: "Covers taking an acoustic song somewhere new.",
  },
  duration_up: {
    slug: "longer",
    label: "longer",
    description: "At least a minute longer than the original.",
  },
  duration_down: {
    slug: "shorter",
    label: "shorter",
    description: "At least a minute shorter than the original.",
  },
  energy_up: {
    slug: "more-energetic",
    label: "more energetic",
    description: "Harder, better, faster, stronger.",
  },
  energy_down: {
    slug: "less-energetic",
    label: "less energetic",
    description: "Covers less intense than the original.",
  },
  tempo_up: {
    slug: "faster",
    label: "faster",
    description: "At least 40 BPM faster than the original.",
  },
  tempo_down: {
    slug: "slower",
    label: "slower",
    description: "At least 40 BPM slower than the original.",
  },
  transition_ftm: {
    slug: "ftm",
    label: "FTM",
    description: "Boys cover girls.",
  },
  transition_mtf: {
    slug: "mtf",
    label: "MTF",
    description: "Girls cover boys.",
  },
  transition_ftf: {
    slug: "ftf",
    label: "FTF",
    description: "Girls cover girls.",
  },
  transition_mtm: {
    slug: "mtm",
    label: "MTM",
    description: "Boys cover boys.",
  },
  valence_up: {
    slug: "happier",
    label: "happier",
    description: "More cheerful than the original.",
  },
  valence_down: {
    slug: "sadder",
    label: "sadder",
    description: "More melancholy than the original.",
  },
  years_apart_10: {
    slug: "10-years-apart",
    label: "10+ years apart",
    description: "Released 10–20 years after the original.",
  },
  years_apart_20: {
    slug: "20-years-apart",
    label: "20+ years apart",
    description: "Released 20–30 years after the original.",
  },
  years_apart_30: {
    slug: "30-years-apart",
    label: "30+ years apart",
    description: "Released 30–40 years after the original.",
  },
  years_apart_40: {
    slug: "40-years-apart",
    label: "40+ years apart",
    description: "Released 40–50 years after the original.",
  },
  years_apart_50: {
    slug: "50-years-apart",
    label: "50+ years apart",
    description: "Released over 50 years after the original.",
  },
} satisfies Record<string, Tag>;

export const TAGS: Record<keyof typeof tags, Tag> = tags;

export const HIDDEN_TAGS: Enums<"tags">[] = [
  "transition_mtm",
  "transition_ftf",
];

export const ORDERED_TAGS: Enums<"tags">[] = [
  "transition_mtf",
  "transition_ftm",
  "valence_up",
  "valence_down",
  "tempo_up",
  "tempo_down",
  "duration_up",
  "duration_down",
  "energy_up",
  "energy_down",
  "acousticness_up",
  "acousticness_down",
  "years_apart_10",
  "years_apart_20",
  "years_apart_30",
  "years_apart_40",
  "years_apart_50",
  ...HIDDEN_TAGS,
];

export const TAG_BY_SLUG = new Map(
  (Object.keys(TAGS) as Enums<"tags">[]).map((tag) => [TAGS[tag].slug, tag]),
);

export const LATEST_TITLE = "Latest";
export const LATEST_DESCRIPTION = "Recent submissions.";
