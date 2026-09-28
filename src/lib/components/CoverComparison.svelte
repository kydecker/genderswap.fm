<script lang="ts">
import { getArtistLink, getYouTubeLink, smartquotes } from "$lib/helpers";
import type { Tables } from "$lib/types/types";
import AppleMusicIcon from "~icons/simple-icons/applemusic";
import SpotifyIcon from "~icons/simple-icons/spotify";
import TidalIcon from "~icons/simple-icons/tidal";
import YouTubeIcon from "~icons/simple-icons/youtube";
import type { Cover } from "../../routes/cover/[slug]/+page.server";

let { cover }: { cover: Cover } = $props();

const originalSong = $derived(cover.original);
const coverSong = $derived(cover.cover);
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

{#snippet track(song: Tables<"songs">, label: "cover" | "original")}
  <div
    class="track"
    itemprop="track"
    itemscope
    itemtype="https://schema.org/MusicRecording"
  >
    <div class="album">
      <img
        class="album-art"
        src={song.album_img[0]}
        alt={`${song.album_name} album art`}
        itemprop="image"
      />
    </div>
    {@render listenLinks(song, label)}
    <div class="info">
      <div class="heading">
        <span class="version">{label === "cover" ? "Cover" : "Original"}</span>
        <h2 class="name" itemprop="name">{smartquotes(song.name)}</h2>
        <div class="artist" itemprop="byArtist">
          {#each song.artists as artist, i}
            <a href={getArtistLink(artist)}>{smartquotes(artist)}</a
            >{#if i < song.artists.length - 1}{`, `}{/if}
          {/each}
        </div>
      </div>
      <div class="album-info">
        <span class="album-name">{smartquotes(song.album_name)}</span>
        <span aria-hidden="true">&middot;</span>
        <time class="album-year" itemprop="datePublished">{song.album_year}</time>
      </div>
    </div>
  </div>
{/snippet}

<div class="compare">
  {@render track(coverSong, "cover")}
  {@render track(originalSong, "original")}
</div>

<style>
  .compare {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-l);
    align-items: start;
  }

  .track {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-m);
  }

  .album {
    width: 100%;
    user-select: none;
    aspect-ratio: 1 / 1;
    background: var(--color-surface);
    overflow: hidden;
    border-radius: var(--radius-album);
    position: relative;
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

  .info {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: calc(var(--space-2xs) / 2);
    line-height: 1.3;
  }

  .album-info {
    color: var(--color-text-muted);
  }

  .heading {
    display: flex;
    flex-direction: column;
    gap: calc(var(--space-2xs) / 2);
  }

  .version {
    font-size: var(--step--1);
    letter-spacing: var(--letter-spacing-loose);
    color: var(--color-text-muted);
    margin-block-end: calc(var(--space-2xs) / 2);
  }

  .name {
    text-wrap: balance;
    font-size: var(--step-1);
    font-feature-settings: var(--font-stable);
    line-height: var(--line-height-h3);
  }

  .artist {
    a:hover {
      text-decoration: underline;
      text-decoration-color: var(--color-text-muted);
    }
  }

  .song-links {
    align-self: stretch;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-xs);

    a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-s);
      padding: var(--space-xs);
      color: var(--color-text-muted);
      background-color: var(--color-surface);
      backdrop-filter: var(--backdrop-surface);

      @media (hover: hover) and (pointer: fine) {
        &:hover {
          background-color: var(--color-surface-hover);
          color: var(--color-text);
        }
      }

      &:focus-visible {
        background-color: var(--color-surface-hover);
        color: var(--color-text);
      }
    }

    :global(svg) {
      max-width: 1.8rem;
      aspect-ratio: 1;
    }
  }

</style>
