CREATE TABLE `cover_tags` (
	`tag` text NOT NULL,
	`created_at` text NOT NULL,
	`cover_id` integer NOT NULL,
	PRIMARY KEY (`tag`, `created_at`, `cover_id`)
) WITHOUT ROWID;
--> statement-breakpoint
CREATE INDEX `cover_tags_cover_id_idx` ON `cover_tags` (`cover_id`);
--> statement-breakpoint
INSERT INTO `cover_tags` (tag, created_at, cover_id)
SELECT value, covers.created_at, covers.id FROM covers, json_each(covers.tags);
--> statement-breakpoint
CREATE TRIGGER `covers_cover_tags_insert` AFTER INSERT ON `covers` BEGIN
	INSERT INTO `cover_tags` (tag, created_at, cover_id)
	SELECT value, new.created_at, new.id FROM json_each(new.tags);
END;
--> statement-breakpoint
CREATE TRIGGER `covers_cover_tags_update` AFTER UPDATE OF tags, created_at ON `covers` BEGIN
	DELETE FROM `cover_tags` WHERE cover_id = old.id;
	INSERT INTO `cover_tags` (tag, created_at, cover_id)
	SELECT value, new.created_at, new.id FROM json_each(new.tags);
END;
--> statement-breakpoint
CREATE TRIGGER `covers_cover_tags_delete` AFTER DELETE ON `covers` BEGIN
	DELETE FROM `cover_tags` WHERE cover_id = old.id;
END;
