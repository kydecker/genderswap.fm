<script lang="ts">
import type {
  FocusEventHandler,
  FormEventHandler,
  KeyboardEventHandler,
} from "svelte/elements";
import { scale } from "svelte/transition";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { TAGS } from "$lib/constants";
import type { Enums } from "$lib/types/types";
import CloseCircleIcon from "~icons/ri/close-circle-fill";
import SearchIcon from "~icons/ri/search-line";

let { tag }: { tag?: Enums<"tags"> } = $props();

let isFocused = $state(false);
let currentQuery = $state("");

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
  clearTimeout(debounceTimer);
  currentQuery = "";
  goto(tag ? "/" : page.url.pathname, { keepFocus: true, replaceState: true });
};

const handleTagClear = () => {
  clearTimeout(debounceTimer);
  goto(currentQuery ? `/?q=${encodeURIComponent(currentQuery)}` : "/", {
    keepFocus: true,
  });
};

const handleKeydown: KeyboardEventHandler<HTMLInputElement> = (e) => {
  if (e.key === "Backspace" && currentQuery === "" && tag) {
    handleTagClear();
  }
};

const handleFocus: FocusEventHandler<HTMLInputElement> = () => {
  isFocused = true;
};

const handleBlur: FocusEventHandler<HTMLInputElement> = () => {
  isFocused = false;
};
</script>

<header>
  <div aria-label="Search" class="searchWrapper">
    <div class="searchIcon">
      <SearchIcon />
    </div>
    {#if tag}
      <button class="tag active" onclick={handleTagClear}
        >{TAGS[tag].label}
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
</header>

<style>
  header {
    padding-inline-start: max(var(--space-l), env(safe-area-inset-left));
    padding-inline-end: max(var(--space-l), env(safe-area-inset-right));

    @media (min-width: 900px) {
      padding-block-start: calc(var(--space-2xl) * 5 / 14 - var(--space-s) / 2);
    }
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

    &:hover {
      background: var(--mauve-4);
      cursor: pointer;

      .clear {
        color: var(--mauve-1);
      }
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

</style>
