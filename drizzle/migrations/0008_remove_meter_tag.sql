UPDATE `covers` SET `tags` = (
	SELECT json_group_array(value) FROM json_each(`covers`.`tags`)
	WHERE value <> 'time_signature_change'
)
WHERE EXISTS (
	SELECT 1 FROM json_each(`covers`.`tags`) WHERE value = 'time_signature_change'
);
--> statement-breakpoint
DELETE FROM `tag_counts` WHERE `tag` = 'time_signature_change';
