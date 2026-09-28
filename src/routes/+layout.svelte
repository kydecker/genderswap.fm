<script lang="ts">
import "$lib/styles/reset.css";
import "$lib/styles/theme.css";
import "$lib/styles/base.css";

import { afterNavigate } from "$app/navigation";
import { asset } from "$app/paths";
import { page } from "$app/state";
import Logo from "$lib/components/Logo.svelte";
import Nav from "$lib/components/Nav.svelte";
import { resetPageColor } from "$lib/pageColor";

let { children } = $props();

afterNavigate(resetPageColor);
</script>

<svelte:head>
  {#if page.data.favicon}
    <link rel="icon" href={page.data.favicon} type="image/jpeg" />
  {:else}
    <link rel="icon" href={asset("/favicon.svg")} type="image/svg+xml" />
    <link rel="icon" href={asset("/favicon-light.png")} type="image/png" media="(prefers-color-scheme: light)" />
    <link rel="icon" href={asset("/favicon-dark.png")} type="image/png" media="(prefers-color-scheme: dark)" />
  {/if}
</svelte:head>

<header class="siteHeader">
  <Logo />
  <Nav />
</header>
<main class="main">
  {@render children?.()}
</main>

<style>
  .siteHeader {
    width: 100%;
    padding-block: var(--space-l) var(--space-s);
    padding-inline-start: max(var(--space-l), env(safe-area-inset-left));
    padding-inline-end: max(var(--space-l), env(safe-area-inset-right));
    gap: var(--space-l);

    @media (min-width: 600px) {
      display: flex;
      position: sticky;
      top: 0;
      z-index: 100;
      justify-content: space-between;
      align-items: center;
      pointer-events: none;

      > :global(*) {
        pointer-events: auto;
      }
    }
  }

  .main {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    padding-block-end: calc(var(--space-3xl) * 2);

    @media (min-width: 600px) {
      padding-block-end: var(--space-xl);
    }
  }
</style>
