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

const debounce = createDebouncer();

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
      debounce(() => {
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

const search = async (query: string | undefined) => {
  searchController?.abort();
  if (!query?.trim()) {
    searchResults = undefined;
    return;
  }

  try {
    const appleId = parseAppleMusicUrl(query);
    if (appleId) {
      const [track] = await lookupTracks([appleId]);
      if (track) selected.set({ value: track });
    } else {
      searchController = new AbortController();
      searchResults = await searchTracks(query, 10, searchController.signal);
    }
  } catch (error) {
    if (error instanceof Error && error.name !== "AbortError") {
      console.error(error.message);
    }
  }
};

const handleClearSelection = () => {
  discoveredExistingCover = null;
  discoveredEarlierRelease = null;
  inputValue.set("");
  value = undefined;
};

const handleUseEarlierRelease = async () => {
  const earlierRelease = await discoveredEarlierRelease;
  if (earlierRelease) value = earlierRelease;
};

$effect(() => {
  if ($touchedInput) {
    debounce(() => search($inputValue));
  }
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
        <div class="searchIcon">
          <SearchIcon />
        </div>
        <input
          use:melt={$input}
          class="searchInput"
          type="search"
          placeholder="Search songs or paste Apple Music URL"
          aria-invalid={errors ? 'true' : undefined}
        />
      </label>
      {#if $open && searchResults}
        <ul use:melt={$menu} class="searchResults" transition:scale={{ duration: 200, start: 0.9 }}>
          {#each searchResults as track}
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
            <li class="empty">No results found</li>
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

  .empty {
    color: var(--color-text-muted);
    padding-block: var(--space-l);
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
