CREATE VIRTUAL TABLE `covers_fts` USING fts5(
	`names`,
	`artists`,
	`albums`,
	tokenize = 'porter unicode61 remove_diacritics 2'
);
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
