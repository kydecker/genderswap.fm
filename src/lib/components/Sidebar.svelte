<script lang="ts">
import { page } from "$app/state";
import { theme } from "$lib/stores/theme";
import GithubIcon from "~icons/ri/github-line";
import HomeIcon from "~icons/ri/home-5-line";
import InfoIcon from "~icons/ri/information-line";
import MoonIcon from "~icons/ri/moon-line";
import ShuffleIcon from "~icons/ri/shuffle-line";
import SunIcon from "~icons/ri/sun-line";
import Logo from "./Logo.svelte";
import NewCoverIcon from "./NewCoverIcon.svelte";

let { id }: { id?: string } = $props();
</script>

<aside class="sidebar" {id}>
  <div class="logo">
    <Logo />
  </div>
  <nav class="links" aria-label="Site">
    <a href="/" aria-current={page.url.pathname === "/" ? "page" : undefined}
      ><HomeIcon aria-hidden="true" />Browse</a
    >
    <a href="/random" data-sveltekit-preload-data="off"
      ><ShuffleIcon aria-hidden="true" />Random</a
    >
    <a
      href="/about"
      aria-current={page.url.pathname === "/about" ? "page" : undefined}
      ><InfoIcon aria-hidden="true" />About</a
    >
    <a href="https://github.com/kydecker/genderswap.fm"
      ><GithubIcon aria-hidden="true" />GitHub</a
    >
  </nav>
  <div class="bottom">
    <a href="/new" class="button">
      <NewCoverIcon />
      Add a cover
    </a>
    <span class="credits">
      A project by <a href="https://ky.fyi">Ky Decker</a>
    </span>
    <div class="toggle">
      <button
        type="button"
        class:active={$theme === 'light'}
        data-theme-toggle-light
        aria-label="Enable light theme"
        onclick={() => theme.set('light')}
      >
        <SunIcon style="width: 20px" />
      </button>
      <button
        type="button"
        class:active={$theme === 'dark'}
        data-theme-toggle-dark
        aria-label="Enable dark theme"
        onclick={() => theme.set('dark')}
      >
        <MoonIcon style="width: 20px" />
      </button>
    </div>
  </div>
</aside>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--space-l);
    height: 100%;
    padding-block: var(--space-s) var(--space-l);
    padding-inline: var(--space-m);
    overflow-y: auto;

    @supports (padding: max(0px)) {
      padding-inline-start: max(var(--space-m), env(safe-area-inset-left));
      padding-block-end: max(var(--space-l), env(safe-area-inset-bottom));
    }
  }

  .logo {
    min-height: var(--space-2xl);
    display: flex;
    align-items: center;
    padding-inline-end: calc(var(--space-2xl) + var(--space-xs));
  }

  .button {
    all: unset;
    display: flex;
    align-self: stretch;
    margin-block-end: var(--space-s);
    align-items: center;
    justify-content: center;
    background: var(--mauve-12);
    color: var(--mauve-1);
    font-size: var(--step-0);
    line-height: 1;
    gap: var(--space-xs);
    font-weight: var(--font-weight-bold);
    padding-inline: var(--space-m);
    padding-block: var(--space-s);
    border-radius: var(--radius-full);
    font-feature-settings: var(--font-unstable);
    cursor: pointer;

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: var(--pink-9);
        color: white;
      }
    }

    &:focus-visible {
      outline: 3px solid var(--pink-a9);
      outline-offset: 3px;
    }
  }

  .links {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-m);

    a {
      display: flex;
      align-items: center;
      gap: var(--space-s);
      border-radius: var(--radius-xs);
      color: var(--mauve-11);

      :global(svg) {
        flex-shrink: 0;
        font-size: 1.2em;
      }

      &[aria-current="page"] {
        color: var(--mauve-12);
        font-weight: var(--font-weight-bold);
      }

      &:hover,
      &:focus-visible {
        color: var(--pink-11);
      }

      &:focus-visible {
        outline: 3px solid var(--pink-a9);
        outline-offset: var(--space-xs);
      }
    }
  }

  .bottom {
    margin-block-start: auto;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-s);
    font-size: var(--step--1);
    color: var(--mauve-11);

    .credits a {
      font-weight: var(--font-weight-bold);
      color: var(--mauve-12);
      text-decoration: underline;
      text-decoration-color: var(--mauve-7);
      text-underline-offset: 0.15em;

      @media (hover: hover) and (pointer: fine) {
        &:hover {
          text-decoration-color: inherit;
        }
      }
    }
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 0.2em;
    margin-inline-start: -6px;
    line-height: 0;

    button {
      all: unset;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      color: var(--mauve-10);
      cursor: pointer;

      &[data-theme-toggle-light].active,
      &[data-theme-toggle-light]:hover {
        background: var(--orange-3);
        color: var(--orange-11);
      }

      &[data-theme-toggle-dark].active,
      &[data-theme-toggle-dark]:hover {
        background: var(--purple-3);
        color: var(--purple-11);
      }

      &:focus-visible {
        outline: 3px solid var(--pink-a9);
        outline-offset: 2px;
      }
    }
  }
</style>
