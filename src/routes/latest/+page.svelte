<script lang="ts">
import CoverGrid from "$lib/components/CoverGrid.svelte";
import PageMeta from "$lib/components/PageMeta.svelte";
import SearchBar from "$lib/components/SearchBar.svelte";
import { LATEST_TITLE } from "$lib/constants";

let { data } = $props();
</script>

<PageMeta
  title={LATEST_TITLE}
  description="The newest gender-swapped song covers on Genderswap.fm."
/>

<SearchBar />
<CoverGrid {data} title={LATEST_TITLE} />
