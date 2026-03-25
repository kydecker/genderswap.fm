<script lang="ts">
  import { getArtistLink, slugify, smartquotes } from '$lib/helpers';
  import type { Cover } from '../../routes/cover/[slug]/+page.server';
  import SpotifyIcon from '~icons/ri/spotify-fill';

  let { cover }: { cover: Cover } = $props();

  const originalSong = $derived(cover.original);
  const coverSong = $derived(cover.cover);
  const coveredAs = $derived(
    slugify(originalSong.name) !== slugify(coverSong.name) ? coverSong.name : ''
  );
</script>

<div class="compare">
  <div
    class="track original"
    itemprop="track"
    itemscope
    itemtype="https://schema.org/MusicRecording"
  >
    <div class="album">
      <img
        class="album-art"
        src={originalSong.album_img[0]}
        alt={`${originalSong.album_name} album art`}
        itemprop="image"
      />
    </div>
    <div class="details">
      <a href={`https://open.spotify.com/track/${originalSong.id}`} class="song-link">
        <SpotifyIcon />
        Listen to original
      </a>
      <h2 class="artist" itemprop="byArtist">
        {#each originalSong.artists as artist, i}
          <a href={getArtistLink(artist)}>{smartquotes(artist)}</a
          >{#if i < originalSong.artists.length - 1}{`, `}{/if}
        {/each}
      </h2>
      <time class="album-year" itemprop="datePublished">
        {originalSong.album_year}
      </time>
      <em class="album-name">{smartquotes(originalSong.album_name)}</em>
    </div>
  </div>
  <div class="track cover" itemprop="track" itemscope itemtype="https://schema.org/MusicRecording">
    <div class="album">
      <img
        class="album-art"
        src={coverSong.album_img[0]}
        alt={`${coverSong.album_name} album art`}
        itemprop="image"
      />
    </div>
    <div class="details">
      <a href={`https://open.spotify.com/track/${coverSong.id}`} class="song-link">
        <SpotifyIcon />
        Listen to cover
      </a>
      <h2 class="artist" itemprop="byArtist">
        {#each coverSong.artists as artist, i}
          <a href={getArtistLink(artist)}>{smartquotes(artist)}</a
          >{#if i < coverSong.artists.length - 1}{`, `}{/if}
        {/each}
      </h2>
      <time class="album-year" itemprop="datePublished">
        {coverSong.album_year}
      </time>
      <em class="album-name">{smartquotes(coverSong.album_name)}</em>
      {#if coveredAs}
        <div class="covered-as" itemprop="name">
          Covered as {smartquotes(coveredAs)}
        </div>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  @keyframes dim {
    0% {
      opacity: 1;
    }

    100% {
      opacity: 0.4;
    }
  }

  .compare {
    display: grid;
    max-width: 100%;
    margin-inline: auto;
    padding-inline: var(--space-xl);
    scroll-padding-inline: var(--space-xl);
    gap: var(--space-l);
    grid-template:
      'originalAlbum coverAlbum'
      'originalContent coverContent';
    grid-template-columns: 1fr 1fr;

    @supports (padding: max(0px)) {
      padding-inline-start: max(var(--space-xl), env(safe-area-inset-left));
      padding-inline-end: max(var(--space-xl), env(safe-area-inset-right));
    }

    @media (max-width: 480px) {
      overflow-x: scroll;
      overflow-y: hidden;
      grid-template-columns: 85vw 85vw;
      scroll-snap-type: x mandatory;
      // Hide scrollbars on Chrome, Safari
      &::-webkit-scrollbar {
        display: none;
      }
      -ms-overflow-style: none; // Edge
      scrollbar-width: none; // Firefox
    }
  }

  .track {
    max-width: 600px;
  }

  .track:first-child {
    scroll-snap-align: start;

    @supports (animation-timeline: scroll()) {
      animation: dim linear both;
      animation-direction: normal;
      animation-timeline: scroll(x);
    }
  }

  .track:last-child {
    scroll-snap-align: end;

    @supports (animation-timeline: scroll()) {
      animation: dim linear both;
      animation-direction: reverse;
      animation-timeline: scroll(x);
    }
  }

  .album {
    user-select: none;
    width: 100%;
    aspect-ratio: 1 / 1;
    background: var(--mauve-3);
    overflow: hidden;
    border-radius: var(--radius-album);
    position: relative;
    z-index: 1;
    box-shadow: var(--shadow-album-l);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: var(--radius-album);
    }

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: var(--radius-album);
      box-shadow: var(--shadow-album-inset-l);
    }
  }

  .original {
    .album {
      grid-area: originalAlbum;
      margin-inline-start: auto;
    }
    .details {
      grid-area: originalContent;
      align-items: flex-end;
      text-align: right;
    }
  }

  .cover {
    .album {
      grid-area: coverAlbum;
    }
    .details {
      grid-area: coverContent;
    }
  }

  .details {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
    align-items: flex-start;
    padding-block-start: var(--space-l);
  }

  .artist {
    font-size: var(--step-3);

    a:hover {
      text-decoration: underline;
      text-decoration-color: var(--mauve-9);
    }
  }

  .album-year,
  .album-name {
    font-size: var(--step-1);
  }

  .song-link {
    all: unset;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-s);
    padding-inline-end: var(--space-m);
    background-color: var(--mauve-3);
    border-radius: var(--radius-full);
    font-weight: var(--font-weight-bold);
    cursor: pointer;

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background-color: var(--pink-3);
        color: var(--pink-12);
      }
    }

    :global(svg) {
      width: var(--space-xl);
    }
  }

  .covered-as {
    color: var(--mauve-11);
  }
</style>
