<script lang="ts">
import { page } from "$app/state";
import CoverGrid from "$lib/components/CoverGrid.svelte";
import SearchBar from "$lib/components/SearchBar.svelte";
import { LATEST_TITLE, SITE_URL, toTitleCase } from "$lib/constants";

let { data } = $props();
</script>

<svelte:head>
  <title>{`${toTitleCase(LATEST_TITLE)} · Genderswap.fm`}</title>
  <meta
    name="description"
    content="The newest gender-swapped song covers on Genderswap.fm."
  />
  <link rel="canonical" href={`${SITE_URL}/latest`} />
  <meta property="og:image" content={`${page.url.origin}/og-image.png`} />
  <meta property="og:image:alt" content="Genderswap.fm" />
</svelte:head>

<SearchBar />
<CoverGrid {data} title={LATEST_TITLE} />
