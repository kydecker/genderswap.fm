![Some covers deliver the age-old simple pleasures of drag](/static/og-image.png)

# genderswap.fm

Genderswap.fm is a repository of song covers with performing artists of different genders.

## Getting Started

```
pnpm dev
```

## Regenerating types following database changes

If you add a new table, new columns, new enums, or make other structural changes in Supabase, run:

```
pnpm dbtypegen
```

This will regenerate [src/types/db-generated.types.ts](src/types/db-generated.types.ts) for use in frontend components!

## Colophon

This site was built by [Ky Decker](https://ky.fyi) using [Sveltekit](https://kit.svelte.dev). It uses [Supabase](https://supabase.com) for data storage and it's hosted and deployed on [Netlify](https://netlify.com/). Tracks and audio features are fetched from Spotify's API via the [Typescript SDK](https://github.com/spotify/spotify-web-api-ts-sdk). Text is set in [Labil Grotesk](https://www.kometa.xyz/typefaces/labil-grotesk/) by Kometa Typefaces.
