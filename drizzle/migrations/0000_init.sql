CREATE TABLE `covers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`original_id` text NOT NULL,
	`cover_id` text NOT NULL,
	`description` text,
	`contributor` text,
	`tags` text,
	FOREIGN KEY (`original_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cover_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "covers_contributor_check" CHECK(length("covers"."contributor") < 24),
	CONSTRAINT "covers_description_check" CHECK(length("covers"."description") < 160),
	CONSTRAINT "ids_cannot_equal" CHECK("covers"."original_id" <> "covers"."cover_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `covers_slug_unique` ON `covers` (`slug`);--> statement-breakpoint
CREATE INDEX `covers_cover_id_idx` ON `covers` (`cover_id`);--> statement-breakpoint
CREATE INDEX `covers_created_at_idx` ON `covers` (`created_at`);--> statement-breakpoint
CREATE TABLE `songs` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`name` text NOT NULL,
	`artists` text NOT NULL,
	`album_name` text NOT NULL,
	`album_year` integer NOT NULL,
	`album_img` text NOT NULL,
	`url` text NOT NULL,
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
	`time_signature` integer,
	`valence` real
);
