<script lang="ts">
import type { Track } from "@spotify/web-api-ts-sdk";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { MouseEventHandler } from "svelte/elements";
import { slide } from "svelte/transition";
import {
  getReadableTitle,
  getYearsEarlierText,
  removeSongExtraText,
  smartquotes,
} from "$lib/helpers";
import AlertIcon from "~icons/ri/alert-line";
import CheckIcon from "~icons/ri/check-line";
import CloseCircleIcon from "~icons/ri/close-circle-line";
import HistoryIcon from "~icons/ri/history-line";
import type { ExistingCover } from "../../routes/api/getCover/+server";
import AudioPreview from "./AudioPreview.svelte";

let {
  song,
  existingCover,
  earlierRelease,
  onUseEarlierRelease,
  onClearSelection,
}: {
  song: Track;
  existingCover: ExistingCover | null;
  earlierRelease: Track | null;
  onUseEarlierRelease: () => void;
  onClearSelection: () => void;
} = $props();

dayjs.extend(relativeTime);

let wasKeepThisReleaseClicked = $state(false);
let wasEarlierReleaseClicked = $state(false);

const handleKeepThisRelease: MouseEventHandler<HTMLButtonElement> = (e) => {
  e.preventDefault();
  wasKeepThisReleaseClicked = true;
};

const handleUseEarlierRelease: MouseEventHandler<HTMLButtonElement> = (e) => {
  e.preventDefault();
  onUseEarlierRelease();
  wasEarlierReleaseClicked = true;
};
</script>

<div class="selectedSong">
  <div class="selectedSongContents">
    <div class="selectedAlbum">
      <img src={song.album.images[0].url} alt={song.name} />
    </div>
    <div class="selectedLabel">
      <div class="selectedName">{smartquotes(removeSongExtraText(song.name))}</div>
      <div>{song.artists.map((artist) => artist.name).join(', ')}</div>
      <div class="selectedAlbumNameAndYear">
        <em>{smartquotes(song.album.name)}</em> &middot;{' '}
        {song.album.release_date.slice(0, 4)}
      </div>
    </div>
    {#if song.preview_url}
      <AudioPreview src={song.preview_url} title={smartquotes(removeSongExtraText(song.name))} />
    {/if}
    <button class="clearSelection" onclick={onClearSelection} aria-label="Remove selection">
      <CloseCircleIcon />
    </button>
  </div>

  {#if existingCover}
    <div class="banner" transition:slide>
      <div class="bannerContents">
        <AlertIcon />
        <div class="bannerLabel">
          <strong class="bannerTitle"
            >This cover was already submitted {dayjs(existingCover.created_at).fromNow()}</strong
          >
          <p>
            <a href={`/cover/${existingCover.slug}`}
              >{getReadableTitle({
                originalName: existingCover.original.name,
                originalArtists: existingCover.original.artists,
                coverArtists: existingCover.cover.artists
              })}</a
            >
          </p>
        </div>
      </div>
    </div>
  {:else if earlierRelease && !wasKeepThisReleaseClicked}
    <div class="banner" transition:slide>
      {#if earlierRelease.id === song.id || wasEarlierReleaseClicked}
        <div class="bannerContents">
          <CheckIcon />
          <div class="bannerLabel">
            <strong class="bannerTitle">Earliest release available on Spotify</strong>
          </div>
        </div>
      {:else if earlierRelease.id !== song.id}
        <div class="bannerContents">
          <HistoryIcon />
          <div class="bannerLabel">
            <strong class="bannerTitle">There’s an earlier release!</strong>
            <p>
              A version of {earlierRelease.artists[0].name}’s
              <strong>{earlierRelease.name}</strong>
              was released {getYearsEarlierText(
                song.album.release_date,
                earlierRelease.album.release_date
              )} in <strong>{earlierRelease.album.release_date.slice(0, 4)}</strong> on the album
              <strong>{earlierRelease.album.name}</strong>.
            </p>
          </div>
        </div>
        <div class="bannerActions">
          <button onclick={handleKeepThisRelease} class="secondary">Keep this release</button>
          <button onclick={handleUseEarlierRelease} class="primary">Use earlier release</button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .selectedSong {
    background: var(--mauve-3);
    border-radius: var(--radius-l);
    position: relative;
  }

  .selectedSongContents {
    padding: var(--space-m);
    display: grid;
    grid-template: 'album content preview';
    grid-template-columns: auto 1fr var(--space-2xl);
    align-items: center;
    gap: var(--space-m);
  }

  .selectedAlbum {
    border-radius: var(--radius-album);
    width: calc(var(--space-3xl) * 2);
    height: calc(var(--space-3xl) * 2);
    flex-shrink: 0;
    min-width: none;
    box-shadow: var(--shadow-album-s);
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: var(--radius-album);
      box-shadow: var(--shadow-album-inset-s);
    }

    img {
      position: absolute;
      inset: 0;
      z-index: 0;
    }
  }

  .selectedLabel {
    display: flex;
    flex-direction: column;
    flex: 1;
    grid-area: content;
  }

  .selectedName {
    font-size: var(--step-1);
    font-weight: var(--font-weight-bold);
    line-height: 1;
    margin-block-end: var(--space-xs);
    overflow-wrap: anywhere;
  }

  .clearSelection {
    all: unset;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: transparent;
    width: var(--space-xl);
    height: var(--space-xl);
    border-radius: var(--radius-full);
    cursor: pointer;
    line-height: 0;
    color: var(--mauve-10);
    position: absolute;
    top: 0;
    right: 0;
    background: var(--mauve-1);
    box-shadow: 0 0 0 3px var(--mauve-1);
    transform: translate(50%, -50%);
    font-size: 20px;

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        color: var(--red-9);
        background: var(--red-4);
      }
    }
  }

  .banner {
    border-top: 1px solid var(--mauve-6);
    padding: var(--space-m);
    display: flex;
    flex-direction: column;

    .bannerContents {
      display: flex;
      gap: var(--space-m);
    }

    .bannerLabel {
      flex: 1;
    }

    p {
      font-size: var(--step--1);

      a {
        text-decoration: underline;
      }
    }
  }

  .bannerActions {
    margin-block-start: var(--space-m);
    display: flex;
    gap: var(--space-s);
    flex-wrap: wrap;

    button {
      all: unset;
      flex: 1;
      cursor: pointer;
      text-align: center;
      padding: var(--space-s) var(--space-m);
      border-radius: var(--radius-s);

      font-weight: var(--font-weight-bold);
      text-wrap: nowrap;

      &.primary {
        background: var(--mauve-12);
        color: var(--mauve-1);

        &:hover {
          background: var(--pink-9);
          color: white;
        }
      }

      &.secondary {
        background: var(--mauve-5);

        &:hover {
          background: var(--mauve-6);
        }
      }
    }
  }
</style>
