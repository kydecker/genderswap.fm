<script lang="ts">
import type {
  FocusEventHandler,
  FormEventHandler,
  KeyboardEventHandler,
} from "svelte/elements";
import { scale } from "svelte/transition";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import CoverCard from "$lib/components/CoverCard.svelte";
import { ORDERED_TAG_GROUPS, TAGS } from "$lib/constants.js";
import type { Enums } from "$lib/types/types.js";
import ArrowLeftIcon from "~icons/ri/arrow-left-line";
import ArrowRightIcon from "~icons/ri/arrow-right-line";
import CloseCircleIcon from "~icons/ri/close-circle-fill";
import SearchIcon from "~icons/ri/search-line";

let { data } = $props();

let isFocused = $state(false);
let currentQuery = $state("");
let currentPage = $derived(Number(page.url.searchParams.get("page")) || 1);
let currentTag = $derived(
  page.url.searchParams.get("tag") as Enums<"tags"> | null,
);

$effect(() => {
  if (!isFocused) {
    currentQuery = page.url.searchParams.get("q") || "";
  }
});

let debounceTimer: ReturnType<typeof setTimeout>;
const debounce = (callback: () => void) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(callback, 250);
};

const handleSearch: FormEventHandler<HTMLInputElement> = (e) => {
  currentQuery = e.currentTarget.value;
  const newURL = new URL(page.url);
  newURL.searchParams.delete("page");

  if (currentQuery) {
    newURL.searchParams.set("q", currentQuery);
  } else {
    newURL.searchParams.delete("q");
  }

  debounce(() => goto(newURL, { keepFocus: true, replaceState: true }));
};

const handleClearSearch = () => {
  const newURL = new URL(page.url);
  newURL.searchParams.delete("tag");
  newURL.searchParams.delete("q");
  goto(newURL, { keepFocus: true, replaceState: true });
};

const handleKeydown: KeyboardEventHandler<HTMLInputElement> = (e) => {
  if (e.key === "Backspace" && currentQuery === "") {
    handleClearSearch();
  }
};

const handleFocus: FocusEventHandler<HTMLInputElement> = () => {
  isFocused = true;
};

const handleBlur: FocusEventHandler<HTMLInputElement> = () => {
  isFocused = false;
};

const handleTagClick = (tag: Enums<"tags"> | null) => {
  const newURL = new URL(page.url);
  newURL.searchParams.delete("page");

  if (currentTag === tag || tag === null) {
    newURL.searchParams.delete("tag");
  } else {
    newURL.searchParams.set("tag", tag);
  }

  goto(newURL);
};

const handleBack = () => {
  if (currentPage > 1) {
    const newURL = new URL(page.url);
    const newPage = currentPage - 1;

    newPage === 1
      ? newURL.searchParams.delete("page")
      : newURL.searchParams.set("page", newPage.toString());

    goto(newURL);
  }
};

const handleNext = () => {
  const newURL = new URL(page.url);
  newURL.searchParams.set("page", (currentPage + 1).toString());
  goto(newURL);
};
</script>

<svelte:head>
  <title>Genderswap.fm</title>
  <meta
    name="description"
    content="A catalogue of the best gender-swapped song covers. Search, listen, and add your own."
  />
  <link rel="canonical" href="https://genderswap.fm" />
  <meta property="og:image" content={`${page.url.origin}/og-image.png`} />
  <meta property="og:image:alt" content="Genderswap.fm" />
</svelte:head>

<header>
  <div aria-label="Search" class="searchWrapper">
    <div class="searchIcon">
      <SearchIcon />
    </div>
    {#if currentTag}
      <button class="tag active" onclick={() => handleTagClick(null)}
        >{TAGS[currentTag].label}
        <span class="clear">
          <CloseCircleIcon />
        </span>
      </button>
    {/if}
    <input
      class="searchInput"
      id="search"
      type="search"
      placeholder="Search covers…"
      value={currentQuery}
      oninput={handleSearch}
      onkeydown={handleKeydown}
      onfocus={handleFocus}
      onblur={handleBlur}
    />
    {#if currentQuery.length > 0}
      <button
        class="searchClear"
        onclick={handleClearSearch}
        transition:scale={{ duration: 200, start: 0.5 }}
      >
        <CloseCircleIcon />
      </button>
    {/if}
  </div>
  <div class="tags">
    {#each ORDERED_TAG_GROUPS as tagGroup}
      <div class="tag-group">
        {#each tagGroup as tag}
          <button
            class="tag"
            class:selected={currentTag === tag}
            onclick={() => handleTagClick(tag)}
            title={TAGS[tag].description}
          >
            {TAGS[tag].shortLabel ?? TAGS[tag].label}
          </button>
        {/each}
      </div>
    {/each}
  </div>
</header>
{#await data}
  <div class="coversGrid">
    {#each [...Array(12)] as []}
      <CoverCard />
    {/each}
  </div>
{:then value}
  {#if value.covers === null || value.covers.length === 0}
    <div class="empty">
      <p>No covers found.</p>
      <a href="/new" class="button">Add a cover</a>
    </div>
  {:else}
    <div class="coversGrid">
      {#each value.covers as cover, index}
        <CoverCard
          original={cover.original}
          cover={cover.cover}
          slug={cover.slug}
          lazy={index > 5}
        />
      {/each}
    </div>
    <div class="pagination">
      {#if data.totalCount}
        <div class="viewingCount">
          Viewing {data.from + 1}–{Math.min(data.to + 1, data.totalCount)} of{' '}
          {data.totalCount} covers
        </div>
      {/if}
      {#if !(data.isFirst && data.isLast)}
        <div class="buttons">
          <button type="button" disabled={data.isFirst} onclick={handleBack}
            ><ArrowLeftIcon />Back</button
          >
          <button type="button" disabled={data.isLast} onclick={handleNext}
            >Next<ArrowRightIcon /></button
          >
        </div>
      {/if}
    </div>
  {/if}
{:catch error}
  {error.message}
{/await}

<style>
  header {
    padding-inline: var(--space-m);
  }

  .searchWrapper {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    background: var(--mauve-3);
    border-radius: var(--radius-full);
    height: calc(var(--space-2xl) + var(--space-s));
    padding-inline: var(--space-m);

    &:focus-within {
      outline: 3px solid var(--pink-a9);
      outline-offset: 3px;
    }
  }

  .searchIcon {
    flex-shrink: 0;
    fill: currentColor;
  }

  .searchInput {
    background: transparent;
    border: none;
    min-width: 0;
    flex: 1;
    height: 100%;

    &::placeholder {
      color: var(--mauve-8);
    }

    &::-webkit-search-decoration,
    &::-webkit-search-cancel-button,
    &::-webkit-search-results-button,
    &::-webkit-search-results-decoration {
      -webkit-appearance: none;
    }

    &:focus {
      outline: none;
    }
  }

  .searchClear {
    all: unset;
    cursor: pointer;
    color: var(--mauve-11);
    flex-shrink: 0;

    &:hover {
      color: var(--mauve-12);
    }
  }

  .tags {
    margin-block-start: var(--space-s);
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: var(--space-2xs);
    overflow-x: auto;
    margin-inline: calc(var(--space-m) * -1);
    padding-inline: var(--space-m);
    padding-block-end: var(--space-m);
    margin-block-end: calc(var(--space-m) * -1);
    scrollbar-width: thin;
    @supports (padding: max(0px)) {
      padding-inline: max(var(--space-m), env(safe-area-inset-right));
      margin-inline: calc(max(var(--space-m), env(safe-area-inset-right)) * -1);
    }
  }

  .tag-group {
    display: flex;
    align-items: flex-start;
    min-width: 0;
    flex-shrink: 0;
    background: var(--mauve-3);
    border-radius: var(--radius-s);
  }

  .tag {
    all: unset;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    background: var(--mauve-3);
    color: var(--mauve-11);
    padding-block: var(--space-xs);
    padding-inline: var(--space-s);
    border-radius: var(--radius-s);
    position: relative;
    flex-shrink: 0;
    min-width: 0;
    line-height: 1;

    &:not(.selected):not(:hover) + :not(.selected):not(:hover)::before {
      content: '';
      height: 50%;
      width: 1px;
      background: var(--mauve-6);
      position: absolute;
      left: -0.5px;
    }

    &:hover {
      background: var(--mauve-4);
      cursor: pointer;

      .clear {
        color: var(--mauve-1);
      }
    }

    &.selected {
      background: var(--mauve-5);
    }

    &.active {
      background: var(--mauve-12);
      color: var(--mauve-1);
    }

    .clear {
      color: var(--mauve-9);
      font-size: 0.8em;
    }
  }

  .coversGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(calc(var(--space-3xl) * 4), 1fr));
    grid-template-rows: max-content;
    align-items: center;
    row-gap: var(--space-l);
    padding-block: var(--space-xl);
    @supports (padding: max(0px)) {
      padding-inline-start: max(var(--space-s), env(safe-area-inset-left));
      padding-inline-end: max(var(--space-s), env(safe-area-inset-right));
    }
    @media (max-width: 1100px) {
      grid-template-columns: repeat(auto-fill, minmax(calc(var(--space-3xl) * 3.5), 1fr));
    }
    @media (max-width: 580px) {
      grid-template-columns: repeat(auto-fill, minmax(calc(var(--space-3xl) * 3), 1fr));
    }
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    flex: 1;
    gap: var(--space-l);
    padding-block-end: var(--space-3xl);

    p {
      font-size: var(--step-1);
    }
  }

  .button {
    background: var(--mauve-12);
    color: var(--mauve-1);
    border: none;
    cursor: pointer;
    border-radius: var(--radius-full);
    padding-block: var(--space-s);
    padding-inline: var(--space-xl);
    margin-inline: auto;
    font-size: var(--step-1);
    font-weight: var(--font-weight-bold);

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: var(--pink-9);
        color: white;
      }
    }

    &:focus {
      outline: 3px solid var(--pink-a9);
      outline-offset: 3px;
    }
  }

  .pagination {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
    align-items: center;
    margin-inline: auto;
    margin-block-end: var(--space-xl);

    .buttons {
      display: flex;
      gap: var(--space-s);
    }

    button {
      background: var(--mauve-12);
      color: var(--mauve-1);
      border: none;
      cursor: pointer;
      display: inline-flex;
      gap: var(--space-s);
      align-items: center;
      border-radius: var(--radius-full);
      padding-block: var(--space-s);
      padding-inline: var(--space-l);
      font-size: var(--step-1);
      font-weight: var(--font-weight-bold);
      font-feature-settings: var(--font-unstable);

      &:first-child {
        padding-inline-start: var(--space-m);
      }

      &:last-child {
        padding-inline-end: var(--space-m);
      }

      @media (hover: hover) and (pointer: fine) {
        &:not([disabled]):hover {
          background: var(--pink-9);
          color: white;
        }
      }

      &[disabled] {
        background-color: var(--mauve-4);
        color: var(--mauve-8);
        cursor: default;
      }

      &:focus {
        outline: 3px solid var(--pink-a9);
        outline-offset: 3px;
      }
    }
  }
</style>
