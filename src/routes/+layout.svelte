<script lang="ts">
import "$lib/styles/reset.css";
import "$lib/styles/theme.css";
import "$lib/styles/base.css";

import Footer from "$lib/components/Footer.svelte";
import Header from "$lib/components/Header.svelte";

let { children } = $props();
</script>

<Header />
<main class="main">
  {@render children?.()}
</main>
<Footer />

<style>
  .main {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
</style>
