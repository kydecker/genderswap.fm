PRAGMA defer_foreign_keys = on;
--> statement-breakpoint
CREATE TABLE `songs_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`name` text NOT NULL,
	`artists` text NOT NULL,
	`album_name` text NOT NULL,
	`album_year` integer NOT NULL,
	`artwork` text NOT NULL,
	`album_color` text,
	`gender` text NOT NULL,
	`acousticness` real,
	`danceability` real,
	`duration_ms` integer,
	`energy` real,
	`instrumentalness` real,
	`key` integer,
	`liveness` real,
	`loudness` real,
	`mode` integer,
	`speechiness` real,
	`tempo` real,
	`valence` real,
	`isrc` text,
	`album_upc` text,
	`apple_id` text,
	`apple_music_url` text,
	`spotify_url` text,
	`tidal_url` text,
	`spotify_id` text
);
--> statement-breakpoint
INSERT INTO `songs_new` (
	`spotify_id`, `created_at`, `name`, `artists`, `album_name`, `album_year`, `artwork`, `album_color`, `gender`,
	`acousticness`, `danceability`, `duration_ms`, `energy`, `instrumentalness`, `key`, `liveness`, `loudness`,
	`mode`, `speechiness`, `tempo`, `valence`, `isrc`, `album_upc`, `apple_id`,
	`apple_music_url`, `spotify_url`, `tidal_url`
)
SELECT
	`id`, `created_at`, `name`, `artists`, `album_name`, `album_year`,
	'spotify:' || substr(json_extract(`album_img`, '$[0]'), length('https://i.scdn.co/image/ab67616d0000b273') + 1),
	`album_color`, `gender`,
	`acousticness`, `danceability`, `duration_ms`, `energy`, `instrumentalness`, `key`, `liveness`, `loudness`,
	`mode`, `speechiness`, `tempo`, `valence`, `isrc`, `album_upc`,
	CASE WHEN instr(`apple_music_url`, '?i=') > 0 THEN substr(
		substr(`apple_music_url`, instr(`apple_music_url`, '?i=') + 3),
		1,
		instr(substr(`apple_music_url`, instr(`apple_music_url`, '?i=') + 3) || '&', '&') - 1
	) END,
	`apple_music_url`, `url`, `tidal_url`
FROM `songs`
ORDER BY `created_at`, `id`;
--> statement-breakpoint
CREATE INDEX `songs_new_spotify_id_idx` ON `songs_new` (`spotify_id`);
--> statement-breakpoint
CREATE TABLE `covers_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`original_id` integer NOT NULL,
	`cover_id` integer NOT NULL,
	`description` text,
	`contributor` text,
	`tags` text,
	FOREIGN KEY (`original_id`) REFERENCES `songs_new`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cover_id`) REFERENCES `songs_new`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "covers_contributor_check" CHECK(length("contributor") < 24),
	CONSTRAINT "covers_description_check" CHECK(length("description") < 160),
	CONSTRAINT "ids_cannot_equal" CHECK("original_id" <> "cover_id")
);
--> statement-breakpoint
INSERT INTO `covers_new` (`id`, `slug`, `created_at`, `original_id`, `cover_id`, `description`, `contributor`, `tags`)
SELECT c.`id`, c.`slug`, c.`created_at`, o.`id`, v.`id`, c.`description`, c.`contributor`, c.`tags`
FROM `covers` c
JOIN `songs_new` o ON o.`spotify_id` = c.`original_id`
JOIN `songs_new` v ON v.`spotify_id` = c.`cover_id`;
--> statement-breakpoint
DROP TABLE `covers`;
--> statement-breakpoint
DROP TABLE `songs`;
--> statement-breakpoint
ALTER TABLE `songs_new` RENAME TO `songs`;
--> statement-breakpoint
ALTER TABLE `covers_new` RENAME TO `covers`;
--> statement-breakpoint
DROP INDEX `songs_new_spotify_id_idx`;
--> statement-breakpoint
ALTER TABLE `songs` DROP COLUMN `spotify_id`;
--> statement-breakpoint
CREATE INDEX `songs_apple_id_idx` ON `songs` (`apple_id`);
--> statement-breakpoint
CREATE INDEX `songs_isrc_idx` ON `songs` (`isrc`);
--> statement-breakpoint
CREATE INDEX `songs_unmatched_duration_idx` ON `songs` (`duration_ms`) WHERE `apple_id` IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `covers_slug_unique` ON `covers` (`slug`);
--> statement-breakpoint
CREATE INDEX `covers_cover_id_idx` ON `covers` (`cover_id`);
--> statement-breakpoint
CREATE INDEX `covers_created_at_idx` ON `covers` (`created_at`);
--> statement-breakpoint
CREATE TRIGGER `covers_fts_insert` AFTER INSERT ON `covers` BEGIN
	INSERT INTO `covers_fts` (rowid, names, artists, albums)
	SELECT
		new.id,
		o.name || ' ' || c.name,
		(SELECT group_concat(value, ' ') FROM json_each(o.artists)) || ' ' ||
			(SELECT group_concat(value, ' ') FROM json_each(c.artists)),
		o.album_name || ' ' || c.album_name
	FROM songs o, songs c
	WHERE o.id = new.original_id AND c.id = new.cover_id;
END;
--> statement-breakpoint
CREATE TRIGGER `covers_fts_delete` AFTER DELETE ON `covers` BEGIN
	DELETE FROM `covers_fts` WHERE rowid = old.id;
END;
--> statement-breakpoint
CREATE TRIGGER `covers_tag_counts_insert` AFTER INSERT ON `covers` BEGIN
	INSERT INTO `tag_counts` (tag, n)
	SELECT value, 1 FROM json_each(new.tags)
	UNION ALL
	SELECT '*all', 1
	WHERE true
	ON CONFLICT (tag) DO UPDATE SET n = n + 1;
END;
--> statement-breakpoint
CREATE TRIGGER `covers_tag_counts_delete` AFTER DELETE ON `covers` BEGIN
	UPDATE `tag_counts` SET n = n - 1
	WHERE tag IN (SELECT value FROM json_each(old.tags)) OR tag = '*all';
END;
