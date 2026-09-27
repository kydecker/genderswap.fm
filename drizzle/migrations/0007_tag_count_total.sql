DROP TRIGGER `covers_tag_counts_insert`;
--> statement-breakpoint
DROP TRIGGER `covers_tag_counts_delete`;
--> statement-breakpoint
DELETE FROM `tag_counts` WHERE `tag` = '*visible';
--> statement-breakpoint
INSERT INTO `tag_counts` (tag, n) SELECT '*all', count(*) FROM covers;
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
