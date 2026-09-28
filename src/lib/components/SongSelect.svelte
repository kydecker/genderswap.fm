<script lang="ts">
import { createCombobox, melt } from "@melt-ui/svelte";
import { scale } from "svelte/transition";
import { artworkSrcset, artworkUrl } from "$lib/artwork";
import SongPreview from "$lib/components/SongPreview.svelte";
import { createDebouncer } from "$lib/helpers";
import {
  findEarliestRelease,
  type ITunesTrack,
  lookupTracks,
  parseAppleMusicUrl,
  releaseYear,
  searchTracks,
} from "$lib/itunes";
import LoaderIcon from "~icons/ri/loader-4-line";
import SearchIcon from "~icons/ri/search-line";
import type { ExistingCover } from "../../routes/api/getCover/+server";
import ErrorMessage from "./ErrorMessage.svelte";

let {
  name,
  value = $bindable(),
  errors,
}: {
  name: string;
  value: ITunesTrack | undefined;
  errors: string[] | undefined;
} = $props();

let discoveredEarlierRelease: ITunesTrack | null = $state(null);
let discoveredExistingCover: ExistingCover | null = $state(null);
let searchResults: ITunesTrack[] | undefined = $state(undefined);
let resultsQuery = $state("");
let searching = $state(false);
let searchFailed = $state(false);

const MIN_QUERY_LENGTH = 2;
const debounceSearch = createDebouncer(350);
const debounceChecks = createDebouncer();
const cache = new Map<string, ITunesTrack[]>();
let inputElement: HTMLInputElement | undefined = $state();

const openIfFocused = () => {
  if (document.activeElement === inputElement) open.set(true);
};

const {
  elements: { menu, input, option, label },
  states: { open, inputValue, touchedInput, selected },
  helpers: { isSelected, isHighlighted },
} = createCombobox<ITunesTrack>({
  preventScroll: false,
  positioning: {
    placement: "bottom",
    flip: false,
    sameWidth: true,
  },
  onSelectedChange: ({ next }) => {
    if (next) {
      discoveredEarlierRelease = null;
      discoveredExistingCover = null;
      debounceChecks(() => {
        const track = next.value;
        whenCurrent(track, findEarliestRelease(track), (data) => {
          discoveredEarlierRelease = data;
        });
        whenCurrent(
          track,
          fetch(`/api/getCover?appleId=${track.trackId}`).then((response) =>
            response.ok ? response.json() : null,
          ),
          (data: ExistingCover | null) => {
            discoveredExistingCover = data;
          },
        );
      });
      value = next.value;
    }
    return next;
  },
});

selected.set(value ? { value } : undefined);

const whenCurrent = async <T>(
  track: ITunesTrack,
  request: Promise<T>,
  set: (data: T) => void,
) => {
  try {
    const data = await request;
    if (value?.trackId === track.trackId) set(data);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
  }
};

let searchController: AbortController | undefined;

const showResults = (query: string, results: ITunesTrack[]) => {
  searchResults = results;
  resultsQuery = query;
  searching = false;
  searchFailed = false;
  openIfFocused();
};

const search = async (query: string) => {
  searchController?.abort();
  const controller = new AbortController();
  searchController = controller;

  try {
    const appleId = parseAppleMusicUrl(query);
    if (appleId) {
      const [track] = await lookupTracks([appleId]);
      if (track) selected.set({ value: track });
      else showResults(query, []);
      searching = false;
      return;
    }
    const results = await searchTracks(query, 10, controller.signal);
    cache.set(query.toLowerCase(), results);
    if (searchController === controller) showResults(query, results);
  } catch (error) {
    if (controller.signal.aborted) return;
    searching = false;
    searchFailed = true;
    openIfFocused();
    if (error instanceof Error) console.error(error.message);
  }
};

let activeQuery = "";

const onQueryChange = (query: string) => {
  if (query === activeQuery) return;
  activeQuery = query;
  debounceSearch.cancel();
  searchController?.abort();
  searchFailed = false;

  if (query.length < MIN_QUERY_LENGTH) {
    searching = false;
    searchResults = undefined;
    return;
  }

  const cached = cache.get(query.toLowerCase());
  if (cached) {
    showResults(query, cached);
    return;
  }

  searching = true;
  debounceSearch(() => search(query));
};

const handleClearSelection = () => {
  discoveredExistingCover = null;
  discoveredEarlierRelease = null;
  activeQuery = "";
  searchResults = undefined;
  inputValue.set("");
  value = undefined;
};

const handleUseEarlierRelease = async () => {
  const earlierRelease = await discoveredEarlierRelease;
  if (earlierRelease) value = earlierRelease;
};

$effect(() => {
  const query = $inputValue.trim().replace(/\s+/g, " ");
  if ($touchedInput && !value) onQueryChange(query);
});
</script>

<fieldset {name}>
  {#if value}
    <SongPreview
      song={value}
      existingCover={discoveredExistingCover}
      earlierRelease={discoveredEarlierRelease}
      onUseEarlierRelease={handleUseEarlierRelease}
      onClearSelection={handleClearSelection}
    />
  {:else}
    <div class="searchWrapper" class:hidden={!!value}>
      <label use:melt={$label} aria-label="Search" class="inputWrapper">
        <div class="searchIcon" class:spinning={searching}>
          {#if searching}
            <LoaderIcon />
          {:else}
            <SearchIcon />
          {/if}
        </div>
        <input
          use:melt={$input}
          bind:this={inputElement}
          class="searchInput"
          type="search"
          placeholder="Search songs or paste Apple Music URL"
          aria-invalid={errors ? 'true' : undefined}
          aria-busy={searching}
        />
      </label>
      {#if $open && (searchResults || searching || searchFailed)}
        <ul
          use:melt={$menu}
          class="searchResults"
          class:stale={searching && searchResults}
          transition:scale={{ duration: 200, start: 0.9 }}
        >
          {#if searchFailed}
            <li class="status">Couldn’t reach Apple Music. Keep typing or try again in a moment.</li>
          {:else if searching && !searchResults}
            <li class="status">Searching…</li>
          {/if}
          {#each searchResults ?? [] as track (track.trackId)}
            <li
              use:melt={$option({
                value: track,
                label: track.trackName,
                disabled: false
              })}
              class="result"
              class:highlighted={$isHighlighted(track)}
              class:selected={$isSelected(track)}
            >
              <img
                class="resultAlbum"
                src={artworkUrl(track.artwork, 64)}
                srcset={artworkSrcset(track.artwork, 64)}
                alt=""
              />
              <div class="resultLabel">
                <div class="resultName">{track.trackName}</div>
                <div class="resultLabelDetails">
                  <div class="resultArtist">
                    {track.artistName}{' '}
                    {' · '}
                    <span class="resultYear">
                      {releaseYear(track)}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          {:else}
            {#if !searching && !searchFailed}
              <li class="status">No songs found for “{resultsQuery}”</li>
            {/if}
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
  {#if errors}
    {#each errors as error}
      <ErrorMessage {error} />
    {/each}
  {/if}
</fieldset>

<style>
  fieldset {
    all: unset;
  }

  .searchWrapper {
    position: relative;
    &.hidden {
      display: none;
    }
  }

  .inputWrapper {
    position: relative;
  }

  .searchIcon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: var(--space-m);
    fill: currentColor;
    display: flex;

    &.spinning :global(svg) {
      animation: spin 0.7s linear infinite;
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .searchInput {
    border: none;
    width: 100%;
    background: var(--color-surface-hover);
    border-radius: var(--radius-full);
    padding-block: var(--space-s);
    padding-inline: var(--space-m);
    padding-left: calc(24px + var(--space-m) + var(--space-s));

    &::placeholder {
      color: var(--color-text-subtle);
    }
  }

  .searchResults {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    overflow-y: scroll;
    background-color: var(--color-surface);
    backdrop-filter: var(--backdrop-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-popover);
    padding: var(--space-2xs);
    margin-block: var(--space-xs);
    z-index: 10;
    max-height: 45vh;
    transition: opacity 0.15s ease;

    &.stale {
      opacity: 0.6;
    }
  }

  .result {
    color: var(--color-text);
    border-radius: var(--radius-xs);
    padding: var(--space-2xs);
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-s);
    user-select: none;
    cursor: pointer;

    &.highlighted {
      outline: none;
      background-color: var(--color-surface-hover);
    }
  }

  .status {
    color: var(--color-text-muted);
    padding-block: var(--space-l);
    padding-inline: var(--space-m);
    text-align: center;
  }

  .resultLabel {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .resultAlbum {
    width: var(--space-2xl);
    height: var(--space-2xl);
    background: var(--color-surface);
    border-radius: var(--radius-album);
  }

  .resultName {
    font-size: var(--step--1);
    font-weight: var(--font-weight-bold);
  }

  .resultName,
  .resultArtist {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .resultLabelDetails {
    font-size: var(--step--1);
    color: var(--color-text-muted);
  }
</style>
