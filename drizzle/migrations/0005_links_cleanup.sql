UPDATE `songs` SET `isrc` = upper(`isrc`) WHERE `isrc` <> upper(`isrc`);
--> statement-breakpoint
ALTER TABLE `songs` DROP COLUMN `links_checked_at`;
