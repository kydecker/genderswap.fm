<script lang="ts">
import CoverGrid from "$lib/components/CoverGrid.svelte";
import CoverRow from "$lib/components/CoverRow.svelte";
import PageMeta from "$lib/components/PageMeta.svelte";
import SearchBar from "$lib/components/SearchBar.svelte";
import { LATEST_TITLE, TAGS } from "$lib/constants";
import { toTitleCase } from "$lib/helpers";

let { data } = $props();
</script>

<PageMeta
  description="A catalogue of the best gender-swapped song covers. Search, listen, and add your own."
/>

<SearchBar />
{#if data.view === "rows"}
  <div class="rows">
    {#each data.rows as row, index (row.tag)}
      <CoverRow
        title={row.tag ? toTitleCase(TAGS[row.tag].label) : LATEST_TITLE}
        description={row.tag ? TAGS[row.tag].description : undefined}
        href={row.tag ? `/${TAGS[row.tag].slug}` : "/latest"}
        covers={row.slugs.map((slug) => data.covers[slug])}
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
    gap: var(--space-m);
    padding-block: var(--space-l);
  }

</style>
