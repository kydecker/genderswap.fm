<script lang="ts">
import { tick, untrack } from "svelte";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { TAG_BY_SLUG } from "$lib/constants";
import { createDebouncer, tagTitle } from "$lib/helpers";
import AddIcon from "~icons/ri/add-line";
import BackIcon from "~icons/ri/arrow-left-s-line";
import HomeFillIcon from "~icons/ri/home-5-fill";
import HomeIcon from "~icons/ri/home-5-line";
import InfoFillIcon from "~icons/ri/information-fill";
import InfoIcon from "~icons/ri/information-line";
import SearchIcon from "~icons/ri/search-line";
import ShuffleIcon from "~icons/ri/shuffle-line";

let urlQuery = $derived(page.url.searchParams.get("q") ?? "");
let open = $state(false);
let searching = $derived(open || urlQuery !== "");
let query = $state("");
let input: HTMLInputElement | undefined = $state();

let category = $derived(
  page.params.category ? TAG_BY_SLUG.get(page.params.category) : undefined,
);
let placeholder = $derived(
  category ? `Search ${tagTitle(category)}…` : "Search covers…",
);
let searchPath = $derived(page.data.searchable ? page.url.pathname : "/");

$effect(() => {
  const q = urlQuery;
  untrack(() => {
    if (document.activeElement !== input) query = q;
  });
});

const current = (path: string) =>
  page.url.pathname === path ? ("page" as const) : undefined;

let browsing = $derived(!["/about", "/new"].includes(page.url.pathname));

const openSearch = async () => {
  open = true;
  await tick();
  input?.focus();
};

const debounce = createDebouncer();

const search = () =>
  debounce(() => {
    const params = query ? `?${new URLSearchParams({ q: query })}` : "";
    goto(`${searchPath}${params}`, {
      keepFocus: true,
      replaceState: page.url.pathname === searchPath,
    });
  });

const closeSearch = () => {
  debounce.cancel();
  open = false;
  query = "";
  if (urlQuery) goto(page.url.pathname, { replaceState: true });
};
</script>

<nav class="nav" class:searching aria-label="Site">
  <div class="tabs" inert={searching}>
    <a class="tab" href="/" aria-current={current("/") ?? (browsing || undefined)}>
      {#if browsing}<HomeFillIcon aria-hidden="true" />{:else}<HomeIcon aria-hidden="true" />{/if}
      <span>Browse</span>
    </a>
    <button type="button" class="tab" data-search-toggle onclick={openSearch}>
      <SearchIcon aria-hidden="true" />
      <span>Search</span>
    </button>
    <a class="tab" href="/random" data-sveltekit-preload-data="off">
      <ShuffleIcon aria-hidden="true" />
      <span>Random</span>
    </a>
    <a class="tab" href="/about" aria-current={current("/about")}>
      {#if current("/about")}<InfoFillIcon aria-hidden="true" />{:else}<InfoIcon aria-hidden="true" />{/if}
      <span>About</span>
    </a>
    <a class="add" href="/new" aria-label="Add a cover" aria-current={current("/new")}>
      <AddIcon aria-hidden="true" />
    </a>
  </div>
  {#if searching}
    <form class="search" role="search" onsubmit={(e) => e.preventDefault()}>
      <button type="button" class="close bubble" aria-label="Close search" onclick={closeSearch}>
        <BackIcon aria-hidden="true" />
      </button>
      <div class="field bubble">
        <SearchIcon aria-hidden="true" />
        <input
          bind:this={input}
          bind:value={query}
          id="search"
          type="search"
          aria-label="Search covers"
          {placeholder}
          oninput={search}
          onkeydown={(e) => e.key === "Escape" && closeSearch()}
        />
      </div>
    </form>
  {/if}
</nav>

<style>
  .nav {
    --icon-size: min(var(--step-2), 1.375rem);
    --nav-padding: var(--space-2xs);

    position: relative;
    width: 22rem;
    flex-shrink: 0;
    padding: var(--nav-padding);

    &.searching {
      background: none;
      box-shadow: none;
      backdrop-filter: none;
    }

    @media (max-width: 599.98px) {
      position: fixed;
      inset-block-end: max(var(--space-s), env(safe-area-inset-bottom));
      inset-inline-start: 50%;
      translate: -50% 0;
      z-index: 100;
      width: min(24rem, calc(100% - 2 * var(--space-s)));
    }
  }

  .nav,
  .bubble {
    border: 1px solid transparent;
    border-radius: var(--radius-full);
    background: var(--color-surface);
    backdrop-filter: var(--backdrop-surface);
    box-shadow: var(--shadow-bar);
  }

  .tabs {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    grid-auto-rows: 2.75rem;

    .searching & {
      visibility: hidden;
    }
  }

  .tab {
    all: unset;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: calc(var(--space-2xs) / 2);
    border-radius: var(--radius-full);
    color: var(--color-text-muted);
    font-size: calc(var(--step--1) * 0.85);
    line-height: 1;
    cursor: pointer;

    :global(svg) {
      font-size: var(--icon-size);
      margin-block-start: -0.1em;
    }

    &[aria-current] {
      color: var(--color-text);
      font-weight: var(--font-weight-bold);
    }

    &:hover,
    &:focus-visible {
      color: var(--color-text);
    }

    &:focus-visible {
      outline: var(--focus-ring);
      outline-offset: 0;
    }
  }

  .add {
    display: grid;
    place-items: center;
    border-radius: var(--radius-full);
    background: var(--color-text);
    color: var(--color-bg);
    font-size: var(--icon-size);

    &:hover,
    &:focus-visible {
      background: var(--color-text-muted);
    }
  }

  .search {
    position: absolute;
    inset: -1px;
    display: grid;
    grid-template-columns:
      calc((100% - 2 * var(--nav-padding) - 2px) / 5 + 2 * var(--nav-padding) + 2px)
      minmax(0, 1fr);
    gap: var(--nav-padding);
    color: var(--color-text-muted);
  }

  .field {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding-inline: var(--space-m);

    @media (hover:hover) {
      &:hover {
        background: var(--color-surface-hover);
      }
    }

    &:focus-within {
      background: var(--color-surface-hover);
      outline: var(--focus-ring);
      outline-offset: 0;
    }

    :global(svg) {
      flex-shrink: 0;
    }

    input {
      flex: 1;
      min-width: 0;
      height: 100%;
      border: none;
      background: transparent;
      color: var(--color-text);

      &::placeholder {
        color: var(--color-text-subtle);
      }

      &::-webkit-search-cancel-button {
        -webkit-appearance: none;
      }

      &:focus {
        outline: none;
      }
    }
  }

  .close {
    appearance: none;
    padding: 0;
    color: inherit;
    display: grid;
    place-items: center;
    font-size: var(--icon-size);
    cursor: pointer;

    &:hover,
    &:focus-visible {
      background-color: var(--color-surface-hover);
      color: var(--color-text);
    }

    &:focus-visible {
      outline: var(--focus-ring);
      outline-offset: 0;
    }
  }
</style>
