import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const GENDERS = ["male", "female", "other"] as const;

export const TAG_VALUES = [
  "acousticness_up",
  "acousticness_down",
  "danceability_up",
  "danceability_down",
  "duration_up",
  "duration_down",
  "energy_up",
  "energy_down",
  "instrumentalness_up",
  "instrumentalness_down",
  "key_change",
  "tempo_up",
  "tempo_down",
  "time_signature_change",
  "transition_ftm",
  "transition_mtf",
  "valence_up",
  "valence_down",
  "years_apart_10",
  "years_apart_20",
  "years_apart_30",
  "years_apart_40",
  "years_apart_50",
  "transition_ftf",
  "transition_mtm",
] as const;

export type Gender = (typeof GENDERS)[number];
export type Tag = (typeof TAG_VALUES)[number];

const createdAt = () =>
  text("created_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`);

export const songs = sqliteTable("songs", {
  id: text("id").primaryKey(),
  created_at: createdAt(),
  name: text("name").notNull(),
  artists: text("artists", { mode: "json" }).notNull().$type<string[]>(),
  album_name: text("album_name").notNull(),
  album_year: integer("album_year").notNull(),
  album_img: text("album_img", { mode: "json" }).notNull().$type<string[]>(),
  url: text("url").notNull(),
  gender: text("gender", { mode: "json" }).notNull().$type<Gender[]>(),
  acousticness: real("acousticness"),
  danceability: real("danceability"),
  duration_ms: integer("duration_ms"),
  energy: real("energy"),
  instrumentalness: real("instrumentalness"),
  key: integer("key"),
  liveness: real("liveness"),
  loudness: real("loudness"),
  mode: integer("mode"),
  speechiness: real("speechiness"),
  tempo: real("tempo"),
  time_signature: integer("time_signature"),
  valence: real("valence"),
});

export const covers = sqliteTable(
  "covers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    created_at: createdAt(),
    original_id: text("original_id")
      .notNull()
      .references(() => songs.id),
    cover_id: text("cover_id")
      .notNull()
      .references(() => songs.id),
    description: text("description"),
    contributor: text("contributor"),
    tags: text("tags", { mode: "json" }).$type<Tag[]>(),
  },
  (table) => [
    index("covers_cover_id_idx").on(table.cover_id),
    index("covers_created_at_idx").on(table.created_at),
    check("covers_contributor_check", sql`length(${table.contributor}) < 24`),
    check("covers_description_check", sql`length(${table.description}) < 160`),
    check("ids_cannot_equal", sql`${table.original_id} <> ${table.cover_id}`),
  ],
);

export const coversRelations = relations(covers, ({ one }) => ({
  original: one(songs, {
    fields: [covers.original_id],
    references: [songs.id],
  }),
  cover: one(songs, {
    fields: [covers.cover_id],
    references: [songs.id],
  }),
}));
