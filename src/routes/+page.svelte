<script lang="ts">
import { page } from "$app/state";
import CoverGrid from "$lib/components/CoverGrid.svelte";
import CoverRow from "$lib/components/CoverRow.svelte";
import SearchBar from "$lib/components/SearchBar.svelte";
import { LATEST_TITLE, SITE_URL, TAGS } from "$lib/constants";

let { data } = $props();
</script>

<svelte:head>
  <title>Genderswap.fm</title>
  <meta
    name="description"
    content="A catalogue of the best gender-swapped song covers. Search, listen, and add your own."
  />
  <link rel="canonical" href={SITE_URL} />
  <meta property="og:image" content={`${page.url.origin}/og-image.png`} />
  <meta property="og:image:alt" content="Genderswap.fm" />
</svelte:head>

<SearchBar />
{#if data.view === "rows"}
  <div class="rows">
    {#each data.rows as row, index (row.tag)}
      <CoverRow
        title={row.tag ? TAGS[row.tag].label : LATEST_TITLE}
        description={row.tag ? TAGS[row.tag].description : undefined}
        href={row.tag ? `/${TAGS[row.tag].slug}` : "/latest"}
        covers={row.covers}
        totalCount={row.totalCount}
        lazy={index > 0}
      />
    {/each}
  </div>
{:else}
  <CoverGrid {data} />
{/if}

<style>
  .rows {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
    padding-block: var(--space-xl);
  }

</style>
