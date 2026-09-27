<script lang="ts">
import { smartquotes } from "$lib/helpers";

type Album = {
  name: string;
  artists: string[];
  album_img: string[];
};

let {
  original,
  cover,
  slug,
  lazy,
}: { original?: Album; cover?: Album; slug?: string; lazy?: boolean } =
  $props();

const isSkeleton = $derived(!original && !cover && !slug);

function formatArtists(artists: string[]) {
  const maxArtists = 2;
  return artists.length > maxArtists
    ? artists.slice(0, maxArtists).join(", ") +
        ` +${artists.length - maxArtists}`
    : artists.join(", ");
}
</script>

<div class="coverCard" class:placeholder={isSkeleton} aria-hidden={isSkeleton || undefined}>
  <div class="album">
    {#if cover?.album_img}
      <img
        src={cover.album_img[1]}
        alt={`${cover.name} album art`}
        loading={lazy ? 'lazy' : 'eager'}
      />
    {/if}
  </div>
  <div class="content">
    <h2 class="title">
      {#if original}
        {smartquotes(original.name)}
      {/if}
    </h2>
    <div class="artist">
      {#if cover}
        <span class="name">{formatArtists(cover.artists)}</span>
      {/if}
      {#if original}
        {@const [firstWord, ...rest] = formatArtists(original.artists).split(" ")}
        <span class="covering"
          >covering <span class="name"
            ><span class="nowrap"
              >{#if original.album_img}<img
                  class="originalAlbum"
                  src={original.album_img.at(-1)}
                  alt={`${original.name} album art`}
                  loading={lazy ? 'lazy' : 'eager'}
                />{/if}{firstWord}</span
            >{rest.length ? ` ${rest.join(" ")}` : ""}</span
          ></span
        >
      {/if}
    </div>
    {#if !isSkeleton}
      <a class="link" href={`/cover/${slug}`} aria-label={`More about ${original?.name}`}></a>
    {/if}
  </div>
</div>

<style>
  .coverCard {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    align-self: flex-start;
    gap: var(--space-s);
    border-radius: 4px;

    &:has(.link:focus-visible) {
      outline: 3px solid var(--pink-a9);
      outline-offset: var(--space-2xs);
    }
  }

  .album {
    background: var(--mauve-3);
    border-radius: var(--radius-album);
    aspect-ratio: 1;
    width: 100%;
    position: relative;

    &:not(:empty) {
      box-shadow: var(--shadow-album-s);

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: var(--radius-album);
        box-shadow: var(--shadow-album-inset-s);
      }
    }

    img {
      width: 100%;
      height: 100%;
      border-radius: var(--radius-album);
      object-fit: cover;
    }
  }

  @keyframes pulse {
    0% {
      background-color: var(--mauve-4);
    }
    50% {
      background-color: var(--mauve-3);
    }
    100% {
      background-color: var(--mauve-4);
    }
  }

  .album:empty,
  .title:empty,
  .artist:empty {
    animation: pulse 1s ease-in-out infinite;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    flex: 1;
    width: 100%;
  }

  .title,
  .artist {
    transition: color 0.2s ease;
    width: 100%;
  }

  .title:empty,
  .artist:empty {
    background: var(--mauve-3);
    display: block;
    border-radius: var(--radius-xs);
  }

  .title {
    font-size: var(--step-0);
    font-feature-settings: var(--font-stable);

    &:empty {
      width: 70%;
      height: var(--space-l);
    }
  }

  .artist {
    font-size: var(--step--1);
    color: var(--mauve-10);
    line-height: 1.3;

    > .name {
      color: var(--mauve-12);
    }

    .nowrap {
      white-space: nowrap;
    }

    .originalAlbum {
      display: inline-block;
      height: 1lh;
      width: auto;
      aspect-ratio: 1;
      margin-inline-end: 0.25em;
      vertical-align: top;
      border-radius: 2px;
      object-fit: cover;
    }

    &:empty {
      width: 90%;
      height: var(--space-m);
    }
  }

  .link {
    position: absolute;
    inset: 0;
    z-index: 2;
    border-radius: 4px;

    &:focus-visible {
      outline: none;
    }
  }
</style>
