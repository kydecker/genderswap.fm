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
    padding-block: max(var(--space-2xl), env(safe-area-inset-top)) var(--space-s);
    text-align: center;
    padding-inline-start: var(--gutter-start);
    padding-inline-end: var(--gutter-end);

    @media (min-width: 56rem) {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: var(--space-xl);
      flex: none;
      width: 17rem;
      height: 100dvh;
      padding-block: var(--space-l) var(--space-m);
      padding-inline: max(var(--space-l), env(safe-area-inset-left)) var(--space-xs);
      text-align: start;
      overflow-y: auto;
    }
  }

  .main {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    container: main / inline-size;
    padding-block-end: calc(var(--space-3xl) * 2);

    @media (min-width: 56rem) {
      min-width: 0;
      align-self: stretch;
      padding-block-end: var(--space-xl);
    }
  }

  @media (min-width: 56rem) {
    :global(body) {
      flex-direction: row;
    }
  }
</style>
