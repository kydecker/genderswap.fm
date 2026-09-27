UPDATE `covers` SET `tags` = (
	SELECT json_group_array(value) FROM json_each(`covers`.`tags`)
	WHERE value NOT IN ('instrumentalness_up', 'instrumentalness_down', 'key_change')
)
WHERE EXISTS (
	SELECT 1 FROM json_each(`covers`.`tags`)
	WHERE value IN ('instrumentalness_up', 'instrumentalness_down', 'key_change')
);
--> statement-breakpoint
DELETE FROM `tag_counts` WHERE `tag` IN ('instrumentalness_up', 'instrumentalness_down', 'key_change');
