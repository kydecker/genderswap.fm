<script lang="ts">
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { MouseEventHandler } from "svelte/elements";
import { slide } from "svelte/transition";
import { sourceArtworkSrcset, sourceArtworkUrl } from "$lib/artwork";
import {
  getReadableTitle,
  getYearsEarlierText,
  smartquotes,
} from "$lib/helpers";
import {
  albumName,
  type ITunesTrack,
  releaseYear,
  songName,
} from "$lib/itunes";
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
  song: ITunesTrack;
  existingCover: ExistingCover | null;
  earlierRelease: ITunesTrack | null;
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
      <img src={sourceArtworkUrl(song.artwork, 160)} srcset={sourceArtworkSrcset(song.artwork, 160)} alt="" />
    </div>
    <div class="selectedLabel">
      <div class="selectedName">{smartquotes(songName(song))}</div>
      <div>{song.artistName}</div>
      <div class="selectedAlbumNameAndYear">
        <em>{smartquotes(albumName(song))}</em> &middot;{' '}
        {releaseYear(song)}
      </div>
    </div>
    {#if song.previewUrl}
      <AudioPreview src={song.previewUrl} title={smartquotes(songName(song))} />
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
      {#if wasEarlierReleaseClicked}
        <div class="bannerContents">
          <CheckIcon />
          <div class="bannerLabel">
            <strong class="bannerTitle">Earliest release available</strong>
          </div>
        </div>
      {:else}
        <div class="bannerContents">
          <HistoryIcon />
          <div class="bannerLabel">
            <strong class="bannerTitle">There’s an earlier release!</strong>
            <p>
              A version of {earlierRelease.artistName}’s
              <strong>{songName(earlierRelease)}</strong>
              was released {getYearsEarlierText(
                song.releaseDate,
                earlierRelease.releaseDate
              )} in <strong>{releaseYear(earlierRelease)}</strong> on
              <strong>{albumName(earlierRelease)}</strong>.
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
    background: var(--color-surface);
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
    color: var(--color-text-muted);
    position: absolute;
    top: 0;
    right: 0;
    background: var(--color-bg);
    box-shadow: 0 0 0 3px var(--color-bg);
    transform: translate(50%, -50%);
    font-size: 20px;

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        color: var(--color-text);
        background: var(--color-surface-hover);
      }
    }

    &:focus-visible {
      outline: var(--focus-ring);
      outline-offset: var(--focus-ring-offset);
    }
  }

  .banner {
    border-top: 1px solid var(--color-border);
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
        background: var(--color-text);
        color: var(--color-bg);

        &:hover {
          background: var(--color-text-muted);
        }
      }

      &.secondary {
        background: var(--color-surface-hover);

        &:hover {
          background: var(--color-border);
        }
      }

      &:focus-visible {
        outline: var(--focus-ring);
        outline-offset: var(--focus-ring-offset);
      }
    }
  }
</style>
