<script lang="ts">
import "$lib/styles/reset.css";
import "$lib/styles/theme.css";
import "$lib/styles/base.css";

import Logo from "$lib/components/Logo.svelte";
import Nav from "$lib/components/Nav.svelte";

let { children } = $props();
</script>

<header class="siteHeader">
  <Logo />
</header>
<main class="main">
  {@render children?.()}
</main>
<Nav />

<style>
  .siteHeader {
    display: flex;
    justify-content: center;
    width: 100%;
    padding-block: var(--space-l) var(--space-s);
    padding-inline-start: max(var(--space-l), env(safe-area-inset-left));
    padding-inline-end: max(var(--space-l), env(safe-area-inset-right));
  }

  .main {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    padding-block-end: calc(var(--space-3xl) * 2);
  }
</style>
