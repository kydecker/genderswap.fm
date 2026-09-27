<script lang="ts">
import {
  getArtistLink,
  getYouTubeLink,
  slugify,
  smartquotes,
} from "$lib/helpers";
import type { Tables } from "$lib/types/types";
import AppleMusicIcon from "~icons/simple-icons/applemusic";
import SpotifyIcon from "~icons/simple-icons/spotify";
import TidalIcon from "~icons/simple-icons/tidal";
import YouTubeIcon from "~icons/simple-icons/youtube";
import type { Cover } from "../../routes/cover/[slug]/+page.server";

let { cover }: { cover: Cover } = $props();

const originalSong = $derived(cover.original);
const coverSong = $derived(cover.cover);
const coveredAs = $derived(
  slugify(originalSong.name) !== slugify(coverSong.name) ? coverSong.name : "",
);
</script>

{#snippet listenLinks(song: Tables<"songs">, label: string)}
  <div class="song-links">
    <a href={`https://open.spotify.com/track/${song.id}`} aria-label={`Listen to ${label} on Spotify`}>
      <SpotifyIcon />
    </a>
    {#if song.apple_music_url}
      <a href={song.apple_music_url} aria-label={`Listen to ${label} on Apple Music`}>
        <AppleMusicIcon />
      </a>
    {/if}
    <a href={getYouTubeLink(song.name, song.artists)} aria-label={`Find ${label} on YouTube`}>
      <YouTubeIcon />
    </a>
    {#if song.tidal_url}
      <a href={song.tidal_url} aria-label={`Listen to ${label} on Tidal`}>
        <TidalIcon />
      </a>
    {/if}
  </div>
{/snippet}

<div class="compare">
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
      {@render listenLinks(coverSong, "cover")}
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
      {@render listenLinks(originalSong, "original")}
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
</div>

<style>
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
      'coverAlbum originalAlbum'
      'coverContent originalContent';
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
      &::-webkit-scrollbar {
        display: none;
      }
      -ms-overflow-style: none;
      scrollbar-width: none;
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

  .cover {
    .album {
      grid-area: coverAlbum;
      margin-inline-start: auto;
    }
    .details {
      grid-area: coverContent;
      align-items: flex-end;
      text-align: right;
    }
  }

  .original {
    .album {
      grid-area: originalAlbum;
    }
    .details {
      grid-area: originalContent;
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

  .song-links {
    display: flex;
    gap: var(--space-xs);

    a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: calc(var(--space-xl) + var(--space-xs) * 2);
      aspect-ratio: 1;
      border-radius: var(--radius-full);
      background-color: var(--mauve-3);

      @media (hover: hover) and (pointer: fine) {
        &:hover {
          background-color: var(--pink-3);
          color: var(--pink-12);
        }
      }
    }

    :global(svg) {
      width: 45%;
      height: 45%;
    }
  }

  .covered-as {
    color: var(--mauve-11);
  }
</style>
