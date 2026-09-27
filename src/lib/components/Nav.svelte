<script lang="ts">
import { tick, untrack } from "svelte";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { TAG_BY_SLUG, TAGS } from "$lib/constants";
import { toTitleCase } from "$lib/helpers";
import AddIcon from "~icons/ri/add-line";
import BackIcon from "~icons/ri/arrow-left-s-line";
import HomeIcon from "~icons/ri/home-5-line";
import InfoIcon from "~icons/ri/information-line";
import SearchIcon from "~icons/ri/search-line";
import ShuffleIcon from "~icons/ri/shuffle-line";

const SEARCHABLE_ROUTES = ["/", "/latest", "/[category=category]"];

let urlQuery = $derived(page.url.searchParams.get("q") ?? "");
let searching = $state(false);
let query = $state("");
let input: HTMLInputElement | undefined = $state();

let category = $derived(
  page.params.category ? TAG_BY_SLUG.get(page.params.category) : undefined,
);
let placeholder = $derived(
  category ? `Search ${toTitleCase(TAGS[category].label)}…` : "Search covers…",
);
let searchPath = $derived(
  SEARCHABLE_ROUTES.includes(page.route.id ?? "") ? page.url.pathname : "/",
);

$effect(() => {
  const q = urlQuery;
  untrack(() => {
    if (q) searching = true;
    if (document.activeElement !== input) query = q;
  });
});

const current = (path: string) =>
  page.url.pathname === path ? ("page" as const) : undefined;

const openSearch = async () => {
  searching = true;
  await tick();
  input?.focus();
};

let debounceTimer: ReturnType<typeof setTimeout>;

const search = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const params = query ? `?${new URLSearchParams({ q: query })}` : "";
    goto(`${searchPath}${params}`, {
      keepFocus: true,
      replaceState: page.url.pathname === searchPath,
    });
  }, 250);
};

const closeSearch = () => {
  clearTimeout(debounceTimer);
  searching = false;
  query = "";
  if (urlQuery) goto(page.url.pathname, { replaceState: true });
};
</script>

<nav class="nav" class:searching aria-label="Site">
  <div class="tabs" inert={searching}>
    <a class="tab" href="/" aria-current={current("/")}>
      <HomeIcon aria-hidden="true" />
      <span>Browse</span>
    </a>
    <button type="button" class="tab" data-search-toggle onclick={openSearch}>
      <SearchIcon aria-hidden="true" />
      <span>Search</span>
    </button>
    <a class="add" href="/new" aria-label="Add a cover" aria-current={current("/new")}>
      <AddIcon aria-hidden="true" />
    </a>
    <a class="tab" href="/about" aria-current={current("/about")}>
      <InfoIcon aria-hidden="true" />
      <span>About</span>
    </a>
    <a class="tab" href="/random" data-sveltekit-preload-data="off">
      <ShuffleIcon aria-hidden="true" />
      <span>Random</span>
    </a>
  </div>
  {#if searching}
    <form class="search" role="search" onsubmit={(e) => e.preventDefault()}>
      <button type="button" class="close" aria-label="Close search" onclick={closeSearch}>
        <BackIcon aria-hidden="true" />
      </button>
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
    </form>
  {/if}
</nav>

<style>
  .nav {
    position: fixed;
    inset-block-end: max(var(--space-s), env(safe-area-inset-bottom));
    inset-inline-start: 50%;
    translate: -50% 0;
    z-index: 100;
    width: min(20rem, calc(100% - 2 * var(--space-s)));
    padding: var(--space-2xs);
    border: 1px solid transparent;
    border-radius: var(--radius-m);
    background: var(--mauve-1);
    box-shadow: var(--shadow-album-l);

    :global(html.dark) & {
      border-color: var(--white-a3);
    }
  }

  .tabs {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    align-items: center;

    .searching & {
      visibility: hidden;
    }
  }

  .tab {
    all: unset;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: calc(var(--space-2xs) / 2);
    padding-block: var(--space-2xs);
    border-radius: var(--radius-s);
    color: var(--mauve-11);
    font-size: calc(var(--step--1) * 0.85);
    line-height: 1;
    cursor: pointer;

    :global(svg) {
      font-size: var(--step-0);
    }

    &[aria-current="page"] {
      color: var(--mauve-12);
      font-weight: var(--font-weight-bold);
    }

    &:hover,
    &:focus-visible {
      color: var(--mauve-12);
    }

    &:focus-visible {
      outline: 3px solid var(--pink-a9);
      outline-offset: -3px;
    }
  }

  .add {
    justify-self: center;
    display: grid;
    place-items: center;
    width: var(--space-2xl);
    height: var(--space-2xl);
    border-radius: var(--radius-full);
    background: var(--mauve-12);
    color: var(--mauve-1);
    font-size: var(--step-0);

    &:hover,
    &:focus-visible {
      background: var(--mauve-11);
    }

    &:focus-visible {
      outline: 3px solid var(--pink-a9);
      outline-offset: 3px;
    }
  }

  .search {
    position: absolute;
    inset: var(--space-2xs);
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding-inline: var(--space-2xs) var(--space-s);
    border-radius: var(--radius-s);
    background: var(--mauve-3);
    color: var(--mauve-11);

    &:focus-within {
      outline: 3px solid var(--pink-a9);
      outline-offset: 2px;
    }

    input {
      flex: 1;
      min-width: 0;
      height: 100%;
      border: none;
      background: transparent;
      color: var(--mauve-12);

      &::placeholder {
        color: var(--mauve-8);
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
    all: unset;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: var(--space-xl);
    height: var(--space-xl);
    border-radius: var(--radius-full);
    cursor: pointer;

    &:hover,
    &:focus-visible {
      color: var(--mauve-12);
    }

    &:focus-visible {
      outline: 3px solid var(--pink-a9);
    }
  }
</style>
