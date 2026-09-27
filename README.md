![Some covers deliver the age-old simple pleasures of drag](/static/og-image.png)

# genderswap.fm

Genderswap.fm is a repository of song covers with performing artists of different genders.

## Getting Started

```
pnpm db:migrate:local
pnpm db:seed:local # optional synthetic data
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

Songs link to Spotify, Apple Music, YouTube, and Tidal, looked up automatically when a cover is submitted. Apple Music links come from the iTunes API, matched by the album's UPC and track position, falling back to a search by title, artist, and length. Tidal links are matched by ISRC, falling back to the album's UPC, and need `TIDAL_CLIENT_ID` and `TIDAL_CLIENT_SECRET` from the [Tidal developer portal](https://developer.tidal.com) in `.env` and as Worker secrets. YouTube links are searches.

## Album colors

Each song stores a mid-tone `album_color` picked from its album art ([src/lib/server/albumColor.ts](src/lib/server/albumColor.ts)), computed when a cover is submitted. To fill in songs without one, run:

```
pnpm db:backfill-album-colors:remote
```

## Colophon

This site was built by [Ky Decker](https://ky.fyi) using [Sveltekit](https://kit.svelte.dev). It's hosted on [Cloudflare](https://cloudflare.com/) Workers with data stored in [D1](https://developers.cloudflare.com/d1/). Tracks and audio features are fetched from Spotify's API via the [Typescript SDK](https://github.com/spotify/spotify-web-api-ts-sdk), with streaming links from the iTunes Search API and Tidal's API. Text is set in [Labil Grotesk](https://www.kometa.xyz/typefaces/labil-grotesk/) by Kometa Typefaces.
