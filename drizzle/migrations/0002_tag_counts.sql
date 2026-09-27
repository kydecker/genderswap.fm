CREATE TABLE `tag_counts` (
	`tag` text PRIMARY KEY NOT NULL,
	`n` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `tag_counts` (tag, n)
SELECT value, count(*) FROM covers, json_each(covers.tags) GROUP BY value
UNION ALL
SELECT '*visible', count(*) FROM covers
WHERE NOT EXISTS (SELECT 1 FROM json_each(covers.tags) WHERE value IN ('transition_mtm', 'transition_ftf'));
--> statement-breakpoint
CREATE TRIGGER `covers_tag_counts_insert` AFTER INSERT ON `covers` BEGIN
	INSERT INTO `tag_counts` (tag, n)
	SELECT value, 1 FROM json_each(new.tags)
	UNION ALL
	SELECT '*visible', 1
	WHERE NOT EXISTS (SELECT 1 FROM json_each(new.tags) WHERE value IN ('transition_mtm', 'transition_ftf'))
	ON CONFLICT (tag) DO UPDATE SET n = n + 1;
END;
--> statement-breakpoint
CREATE TRIGGER `covers_tag_counts_delete` AFTER DELETE ON `covers` BEGIN
	UPDATE `tag_counts` SET n = n - 1
	WHERE tag IN (SELECT value FROM json_each(old.tags))
		OR (tag = '*visible' AND NOT EXISTS (SELECT 1 FROM json_each(old.tags) WHERE value IN ('transition_mtm', 'transition_ftf')));
END;
