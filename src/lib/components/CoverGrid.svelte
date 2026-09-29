<script lang="ts">
import { page } from "$app/state";
import CoverCard from "$lib/components/CoverCard.svelte";
import { getPageHref } from "$lib/helpers";
import type { GridData } from "$lib/server/browse";
import ArrowLeftIcon from "~icons/ri/arrow-left-line";
import ArrowRightIcon from "~icons/ri/arrow-right-line";

let {
  data,
  title,
  description,
}: { data: GridData; title?: string; description?: string } = $props();
</script>

{#if title}
  <div class="categoryHeading">
    <a class="backLink" href="/"><ArrowLeftIcon aria-hidden="true" />All categories</a>
    <h1 class="categoryTitle">{title}</h1>
    {#if description}
      <p class="categoryDescription">{description}</p>
    {/if}
  </div>
{/if}
{#if data.covers.length === 0}
  <div class="empty">
    <p>No covers found.</p>
    <a href="/new" class="button">Add a cover</a>
  </div>
{:else}
  <div class="coversGrid">
    {#each data.covers as cover, index}
      <CoverCard
        original={cover.original}
        cover={cover.cover}
        slug={cover.slug}
        sizes="(max-width: 29rem) calc(50vw - 1.5rem), calc(1.2 * clamp(8.5rem, 7rem + 3vw, 11rem))"
        lazy={index >= 30}
        priority={index < 3}
      />
    {/each}
  </div>
  <div class="pagination">
    {#if data.totalCount}
      <div class="viewingCount">
        Viewing {data.from + 1}–{Math.min(data.to + 1, data.totalCount)} of{' '}
        {data.totalCount} covers
      </div>
    {/if}
    {#if !(data.isFirst && data.isLast)}
      <nav class="buttons" aria-label="Pagination">
        {#if data.isFirst}
          <span class="button pageLink" aria-disabled="true"><ArrowLeftIcon aria-hidden="true" />Back</span>
        {:else}
          <a class="button pageLink" href={getPageHref(page.url, data.page - 1)} rel="prev"
            ><ArrowLeftIcon aria-hidden="true" />Back</a
          >
        {/if}
        {#if data.isLast}
          <span class="button pageLink" aria-disabled="true">Next<ArrowRightIcon aria-hidden="true" /></span>
        {:else}
          <a class="button pageLink" href={getPageHref(page.url, data.page + 1)} rel="next"
            >Next<ArrowRightIcon aria-hidden="true" /></a
          >
        {/if}
      </nav>
    {/if}
  </div>
{/if}

<style>
  .categoryHeading {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2xs);
    padding-block-start: var(--space-xl);
    padding-inline: var(--gutter-start);
  }

  .backLink {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    color: var(--color-text-muted);
    border-radius: var(--radius-xs);

    &:hover {
      color: var(--color-text);
    }
  }

  .categoryTitle {
    font-size: var(--step-3);
    font-feature-settings: var(--font-stable);
  }

  .categoryDescription {
    color: var(--color-text-muted);
  }

  .coversGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(clamp(8.5rem, 7rem + 3vw, 11rem), 1fr));
    grid-template-rows: max-content;
    align-items: start;
    gap: var(--space-l) var(--space-m);
    padding-block: var(--space-xl);
    padding-inline-start: var(--gutter-start);
    padding-inline-end: var(--gutter-end);
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    flex: 1;
    gap: var(--space-l);
    padding-block-end: var(--space-3xl);

    p {
      font-size: var(--step-1);
    }
  }


  .pagination {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
    align-items: center;
    margin-inline: auto;
    margin-block-end: var(--space-xl);

    .buttons {
      display: flex;
      gap: var(--space-s);
    }

    .pageLink {
      padding-inline: var(--space-l);

      &:first-child {
        padding-inline-start: var(--space-m);
      }

      &:last-child {
        padding-inline-end: var(--space-m);
      }
    }
  }
</style>
