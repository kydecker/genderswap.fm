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

The schema lives in [src/lib/server/db/schema.ts](src/lib/server/db/schema.ts). After editing it:

```
pnpm db:generate        # write a new migration to drizzle/migrations
pnpm db:migrate:local   # apply it locally
pnpm db:migrate:remote  # apply it to production
```

Tags are computed on insert by `computeTags` in [src/lib/tags.ts](src/lib/tags.ts). Search uses an FTS5 table (`covers_fts`) that a SQLite trigger keeps up to date.

## Colophon

This site was built by [Ky Decker](https://ky.fyi) using [Sveltekit](https://kit.svelte.dev). It's hosted on [Cloudflare](https://cloudflare.com/) Workers with data stored in [D1](https://developers.cloudflare.com/d1/). Tracks and audio features are fetched from Spotify's API via the [Typescript SDK](https://github.com/spotify/spotify-web-api-ts-sdk). Text is set in [Labil Grotesk](https://www.kometa.xyz/typefaces/labil-grotesk/) by Kometa Typefaces.
