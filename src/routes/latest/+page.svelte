<script lang="ts">
import CoverGrid from "#lib/components/CoverGrid.svelte";
import PageMeta from "#lib/components/PageMeta.svelte";
import { LATEST_DESCRIPTION, LATEST_TITLE } from "#lib/constants.js";

let { data } = $props();
</script>

<PageMeta
  title={LATEST_TITLE}
  description="The newest gender-swapped song covers on Genderswap.fm."
/>

<CoverGrid {data} title={LATEST_TITLE} description={LATEST_DESCRIPTION} />
