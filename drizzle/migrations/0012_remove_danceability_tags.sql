UPDATE `covers` SET `tags` = (
	SELECT json_group_array(value) FROM json_each(`covers`.`tags`)
	WHERE value NOT IN ('danceability_up', 'danceability_down')
)
WHERE `id` IN (
	SELECT `cover_id` FROM `cover_tags` WHERE `tag` IN ('danceability_up', 'danceability_down')
);
--> statement-breakpoint
DELETE FROM `tag_counts` WHERE `tag` IN ('danceability_up', 'danceability_down');
