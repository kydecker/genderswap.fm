<script lang="ts">
import "$lib/styles/reset.css";
import "$lib/styles/theme.css";
import "$lib/styles/base.css";

import { tick } from "svelte";
import { MediaQuery } from "svelte/reactivity";
import { afterNavigate } from "$app/navigation";
import Logo from "$lib/components/Logo.svelte";
import Sidebar from "$lib/components/Sidebar.svelte";
import CloseIcon from "~icons/ri/close-line";
import MenuIcon from "~icons/ri/menu-line";

let { children } = $props();

const isDesktop = new MediaQuery("min-width: 900px");

let drawerOpen = $state(false);

let openButton: HTMLButtonElement;
let closeButton: HTMLButtonElement;

const setDrawerOpen = async (value: boolean) => {
  drawerOpen = value;
  await tick();
  (value ? closeButton : openButton)?.focus();
};

afterNavigate(() => {
  drawerOpen = false;
});

$effect(() => {
  if (isDesktop.current) drawerOpen = false;
});
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Escape" && drawerOpen) setDrawerOpen(false);
  }}
/>

<div class="shell" class:drawerOpen>
  <div class="sidebarWrapper">
    <button
      type="button"
      class="menuButton"
      aria-controls="site-nav"
      aria-expanded={drawerOpen}
      aria-label="Hide navigation"
      bind:this={closeButton}
      onclick={() => setDrawerOpen(false)}
    >
      <CloseIcon />
    </button>
    <Sidebar id="site-nav" />
  </div>
  <button
    type="button"
    class="backdrop"
    tabindex="-1"
    aria-label="Hide navigation"
    onclick={() => setDrawerOpen(false)}
  ></button>
  <div class="content" inert={drawerOpen}>
    <div class="topbar">
      <Logo />
      <button
        type="button"
        class="menuButton"
        aria-controls="site-nav"
        aria-expanded={drawerOpen}
        aria-label="Show navigation"
        bind:this={openButton}
        onclick={() => setDrawerOpen(true)}
      >
        <MenuIcon />
      </button>
    </div>
    <main class="main">
      {@render children?.()}
    </main>
  </div>
</div>

<style>
  .shell {
    --sidebar-width: 15rem;

    flex: 1;
    width: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .sidebarWrapper {
    position: fixed;
    inset-block: 0;
    inset-inline-start: 0;
    z-index: 1001;
    width: min(var(--sidebar-width), 85vw);
    background: var(--mauve-1);
    box-shadow: var(--shadow-album-l);
    transform: translateX(-100%);
    visibility: hidden;
    transition:
      transform 0.25s ease,
      visibility 0.25s;

    .drawerOpen & {
      transform: none;
      visibility: visible;
      transition: transform 0.25s ease;
    }

    .menuButton {
      position: absolute;
      top: var(--space-s);
      inset-inline-end: var(--space-s);
      z-index: 1;
    }
  }

  .backdrop {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 1000;
    border: none;
    background: rgb(0 0 0 / 0.4);
    cursor: default;

    .drawerOpen & {
      display: block;
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
    padding-block: var(--space-s);
    padding-inline: var(--space-l);
    background: var(--mauve-1);

    @supports (padding: max(0px)) {
      padding-inline-start: max(var(--space-l), env(safe-area-inset-left));
      padding-inline-end: max(var(--space-l), env(safe-area-inset-right));
    }
  }

  .menuButton {
    all: unset;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: var(--space-2xl);
    height: var(--space-2xl);
    border-radius: var(--radius-full);
    color: var(--mauve-11);
    font-size: var(--step-1);
    cursor: pointer;

    &:hover {
      background: var(--mauve-3);
      color: var(--mauve-12);
    }

    &:focus-visible {
      outline: 3px solid var(--pink-a9);
      outline-offset: 2px;
    }
  }

  .main {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  @media (min-width: 900px) {
    .shell {
      grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
    }

    .sidebarWrapper {
      position: sticky;
      top: 0;
      height: 100dvh;
      width: auto;
      z-index: auto;
      transform: none;
      visibility: visible;
      box-shadow: none;
      transition: none;
      border-inline-end: 1px solid var(--mauve-4);

      .menuButton {
        display: none;
      }
    }

    .backdrop {
      display: none !important;
    }

    .topbar {
      display: none;
    }

    .main {
      padding-block-start: var(--space-s);
    }
  }
</style>
