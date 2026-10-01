import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import type { TAGS } from "#lib/constants.js";

export type Gender = "male" | "female" | "other";
export type Tag = keyof typeof TAGS;

const createdAt = () =>
  text("created_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`);

export const songs = sqliteTable(
  "songs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    created_at: createdAt(),
    name: text("name").notNull(),
    artists: text("artists", { mode: "json" }).notNull().$type<string[]>(),
    album_name: text("album_name").notNull(),
    album_year: integer("album_year").notNull(),
    artwork: text("artwork").notNull(),
    album_color: text("album_color"),
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
    valence: real("valence"),
    isrc: text("isrc"),
    album_upc: text("album_upc"),
    apple_id: text("apple_id"),
    apple_music_url: text("apple_music_url"),
    spotify_url: text("spotify_url"),
    tidal_url: text("tidal_url"),
  },
  (table) => [
    index("songs_apple_id_idx").on(table.apple_id),
    index("songs_isrc_idx").on(table.isrc),
    index("songs_unmatched_duration_idx")
      .on(table.duration_ms)
      .where(sql`${table.apple_id} IS NULL`),
  ],
);

export const covers = sqliteTable(
  "covers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    created_at: createdAt(),
    original_id: integer("original_id")
      .notNull()
      .references(() => songs.id),
    cover_id: integer("cover_id")
      .notNull()
      .references(() => songs.id),
    description: text("description"),
    contributor: text("contributor"),
    tags: text("tags", { mode: "json" }).$type<Tag[]>(),
  },
  (table) => [
    index("covers_cover_id_idx").on(table.cover_id),
    index("covers_created_at_idx").on(table.created_at),
    check("covers_contributor_check", sql`length("contributor") < 24`),
    check("covers_description_check", sql`length("description") < 160`),
    check("ids_cannot_equal", sql`"original_id" <> "cover_id"`),
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

export const coverTags = sqliteTable(
  "cover_tags",
  {
    tag: text("tag").notNull(),
    created_at: text("created_at").notNull(),
    cover_id: integer("cover_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.tag, table.created_at, table.cover_id] }),
    index("cover_tags_cover_id_idx").on(table.cover_id),
  ],
);

export const tagCounts = sqliteTable("tag_counts", {
  tag: text("tag").primaryKey(),
  n: integer("n").notNull(),
});
