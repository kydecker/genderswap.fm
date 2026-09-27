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
}: { original: Album; cover: Album; slug: string; lazy?: boolean } = $props();

function formatArtists(artists: string[]) {
  const maxArtists = 2;
  return artists.length > maxArtists
    ? artists.slice(0, maxArtists).join(", ") +
        ` +${artists.length - maxArtists}`
    : artists.join(", ");
}

let [firstWord, ...rest] = $derived(formatArtists(original.artists).split(" "));
</script>

<div class="coverCard">
  <div class="album">
    <img
      src={cover.album_img[1]}
      alt={`${cover.name} album art`}
      loading={lazy ? 'lazy' : 'eager'}
    />
  </div>
  <div class="content">
    <h2 class="title">{smartquotes(original.name)}</h2>
    <div class="artist">
      <span class="name">{formatArtists(cover.artists)}</span>
      <span class="covering"
        >covering <span class="name"
          ><span class="nowrap"
            ><img
              class="originalAlbum"
              src={original.album_img.at(-1)}
              alt={`${original.name} album art`}
              loading={lazy ? 'lazy' : 'eager'}
            />{firstWord}</span
          >{rest.length ? ` ${rest.join(" ")}` : ""}</span
        ></span
      >
    </div>
    <a class="link" href={`/cover/${slug}`} aria-label={`More about ${original.name}`}></a>
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

    box-shadow: var(--shadow-album-s);

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: var(--radius-album);
      box-shadow: var(--shadow-album-inset-s);
    }

    img {
      width: 100%;
      height: 100%;
      border-radius: var(--radius-album);
      object-fit: cover;
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
    flex: 1;
    width: 100%;
  }

  .title {
    font-size: var(--step-0);
    font-feature-settings: var(--font-stable);
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
