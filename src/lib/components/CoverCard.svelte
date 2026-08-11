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
  <div class="albums">
    <div class="album">
      {#if original?.album_img}
        <img
          src={original.album_img[1]}
          alt={`${original.name} album art`}
          loading={lazy ? 'lazy' : 'eager'}
        />
      {/if}
    </div>
    <div class="album">
      {#if cover?.album_img}
        <img
          src={cover.album_img[1]}
          alt={`${cover.name} album art`}
          loading={lazy ? 'lazy' : 'eager'}
        />
      {/if}
    </div>
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
        <span class="covering"
          >covering <span class="name">{formatArtists(original.artists)}</span></span
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
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    align-self: flex-start;
    gap: var(--space-m);
    padding: var(--space-m);
    border-radius: var(--radius-m);

    @media (hover: hover) {
      &:hover {
        background: var(--mauve-3);
      }
    }
  }

  .albums {
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    gap: var(--space-xs);
  }

  .album {
    background: var(--mauve-3);
    border-radius: var(--radius-album);
    width: 50%;
    aspect-ratio: 1;
    transition: transform 0.2s ease-in-out;
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
      aspect-ratio: 1;
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

  .placeholder .album:first-child {
    opacity: 0.6;
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
    font-size: var(--step-1);
    font-feature-settings: var(--font-stable);

    &:empty {
      width: 70%;
      height: var(--space-xl);
    }
  }

  .artist {
    color: var(--mauve-10);
    line-height: 1.3;

    > .name {
      color: var(--mauve-12);
    }

    &:empty {
      width: 90%;
      height: var(--space-l);
    }
  }

  .link {
    position: absolute;
    inset: 0;
  }
</style>
