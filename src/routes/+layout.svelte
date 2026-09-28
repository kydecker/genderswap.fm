<script lang="ts">
import "$lib/styles/reset.css";
import "$lib/styles/theme.css";
import "$lib/styles/base.css";

import { afterNavigate } from "$app/navigation";
import Logo from "$lib/components/Logo.svelte";
import Nav from "$lib/components/Nav.svelte";
import { resetPageColor } from "$lib/pageColor";

let { children } = $props();

afterNavigate(resetPageColor);
</script>

<header class="siteHeader">
  <Logo />
  <Nav />
</header>
<main class="main">
  {@render children?.()}
</main>

<style>
  .siteHeader {
    display: flex;
    width: 100%;
    padding-block: var(--space-l) var(--space-s);
    padding-inline-start: max(var(--space-l), env(safe-area-inset-left));
    padding-inline-end: max(var(--space-l), env(safe-area-inset-right));
    gap: var(--space-l);

    @media (min-width: 600px) {
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
