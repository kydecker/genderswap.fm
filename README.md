![Some covers deliver the age-old simple pleasures of drag. Genderswap.fm logo.](/static/og-image.png)

# genderswap.fm

Genderswap.fm is a repository of song covers with performing artists of different genders.

## Getting Started

```
pnpm install
pnpm db:migrate:local
pnpm db:seed:local # optional synthetic data
pnpm db:pull # optional: replace local songs and covers with production data
pnpm dev
```

## Changing the database schema

The schema lives in [src/lib/server/db/schema.ts](src/lib/server/db/schema.ts), and migrations are plain SQL in [drizzle/migrations](drizzle/migrations). To change it, update `schema.ts`, then:

```
pnpm exec wrangler d1 migrations create genderswap-fm <name>  # write the SQL
pnpm db:migrate:local
pnpm db:migrate:remote
```

## Streaming links

Songs are searched and selected with the iTunes Search API, straight from the browser. When a cover is submitted, each song is matched on Deezer by title, artist, and length to get its ISRC, which is used to fetch audio features and a Spotify link from [ReccoBeats](https://reccobeats.com) and a Tidal link. Tidal needs `TIDAL_CLIENT_ID` and `TIDAL_CLIENT_SECRET` from the [Tidal developer portal](https://developer.tidal.com) in `.env` and as Worker secrets. YouTube links are searches.

## Colophon

This site was built by [Ky Decker](https://ky.fyi) using [Sveltekit](https://kit.svelte.dev). It's hosted on [Cloudflare](https://cloudflare.com/) Workers with data stored in [D1](https://developers.cloudflare.com/d1/). Tracks and album art come from the iTunes Search API, audio features from ReccoBeats, ISRCs from Deezer, and streaming links from Apple Music, Spotify, and Tidal. Text is set in [Labil Grotesk](https://www.kometa.xyz/typefaces/labil-grotesk/) by Kometa Typefaces.
