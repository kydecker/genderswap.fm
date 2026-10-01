<script lang="ts">
import CoverGrid from "#lib/components/CoverGrid.svelte";
import CoverRow from "#lib/components/CoverRow.svelte";
import PageMeta from "#lib/components/PageMeta.svelte";
import { LATEST_DESCRIPTION, LATEST_TITLE, TAGS } from "#lib/constants.js";
import { tagTitle } from "#lib/helpers.js";
import { pageColorOnFocus } from "#lib/pageColor.js";

let { data } = $props();
</script>

<PageMeta
  description="A catalogue of the best gender-swapped song covers. Search, listen, and add your own."
/>

{#if data.view === "rows"}
  <section class="intro" aria-label="About Genderswap.fm">
    <p>
      Genderswap.fm is a catalogue of song covers performed by artists of different genders. Search, listen, and <a href="/new">add your own</a>. By
      <a href="https://ky.fyi">Ky Decker</a>, open source on
      <a href="https://github.com/kydecker/genderswap.fm">GitHub</a>.
    </p>
  </section>
  <div class="rows" {@attach pageColorOnFocus}>
    {#each data.rows as row, index (row.tag)}
      <CoverRow
        title={row.tag ? tagTitle(row.tag) : LATEST_TITLE}
        description={row.tag ? TAGS[row.tag].description : LATEST_DESCRIPTION}
        href={row.tag ? `/${TAGS[row.tag].slug}` : "/latest"}
        covers={row.slugs.map((slug) => data.covers[slug])}
        totalCount={row.totalCount}
        lazy={index > 2}
        priority={index === 0}
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
    padding-block: var(--space-xl) var(--space-l);
  }

  .intro {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-block: var(--space-l);
    padding-inline: var(--gutter-start) var(--gutter-end);
    color: var(--color-text-muted);
    text-align: center;
    text-wrap: pretty;

    @media (width >= 56rem) {
      justify-content: start;
      margin-block-end: 0;
      block-size: var(--space-2xl);
      text-align: start;
    }

    p {
      max-inline-size: 80ch;
    }

    a {
      color: var(--color-text);
      text-decoration: underline;
      text-underline-offset: 0.15em;
      border-radius: var(--radius-2xs);
    }
  }
</style>
