-- Synthetic data for local dev and e2e tests
INSERT INTO songs (id, name, artists, album_name, album_year, album_img, url, gender)
WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 120)
SELECT
	'song' || i,
	'Song ' || ((i + 1) / 2),
	json_array('Artist ' || i),
	'Album ' || i,
	1960 + i % 60,
	json_array('https://placehold.co/300'),
	'https://open.spotify.com/track/song' || i,
	json_array(CASE i % 2 WHEN 1 THEN 'male' ELSE 'female' END)
FROM n;

INSERT INTO covers (slug, original_id, cover_id, tags, created_at)
WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 60)
SELECT
	'song-' || i || '-artist-' || (i * 2),
	'song' || (i * 2 - 1),
	'song' || (i * 2),
	json_array('transition_mtf'),
	strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-' || i || ' minutes')
FROM n;
