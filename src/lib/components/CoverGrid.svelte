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
        lazy={index > 5}
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
          <span class="pageLink" aria-disabled="true"><ArrowLeftIcon aria-hidden="true" />Back</span>
        {:else}
          <a class="pageLink" href={getPageHref(page.url, data.page - 1)} rel="prev"
            ><ArrowLeftIcon aria-hidden="true" />Back</a
          >
        {/if}
        {#if data.isLast}
          <span class="pageLink" aria-disabled="true">Next<ArrowRightIcon aria-hidden="true" /></span>
        {:else}
          <a class="pageLink" href={getPageHref(page.url, data.page + 1)} rel="next"
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
    padding-inline: max(var(--space-l), env(safe-area-inset-left));
  }

  .backLink {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    color: var(--mauve-11);
    border-radius: var(--radius-xs);

    &:hover {
      color: var(--mauve-12);
    }

    &:focus-visible {
      outline: var(--focus-ring);
      outline-offset: var(--focus-ring-offset);
    }
  }

  .categoryTitle {
    font-size: var(--step-3);
    font-feature-settings: var(--font-stable);

  }

  .categoryDescription {
    color: var(--mauve-11);
  }

  .coversGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(clamp(8.5rem, 7rem + 3vw, 11rem), 1fr));
    grid-template-rows: max-content;
    align-items: start;
    gap: var(--space-l) var(--space-m);
    padding-block: var(--space-xl);
    padding-inline-start: max(var(--space-l), env(safe-area-inset-left));
    padding-inline-end: max(var(--space-l), env(safe-area-inset-right));
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

  .button {
    background: var(--mauve-12);
    color: var(--mauve-1);
    border: none;
    cursor: pointer;
    border-radius: var(--radius-full);
    padding-block: var(--space-s);
    padding-inline: var(--space-xl);
    margin-inline: auto;
    font-size: var(--step-1);
    font-weight: var(--font-weight-bold);

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: var(--pink-9);
        color: white;
      }
    }

    &:focus-visible {
      outline: var(--focus-ring);
      outline-offset: var(--focus-ring-offset);
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
      background: var(--mauve-12);
      color: var(--mauve-1);
      border: none;
      cursor: pointer;
      display: inline-flex;
      gap: var(--space-s);
      align-items: center;
      border-radius: var(--radius-full);
      padding-block: var(--space-s);
      padding-inline: var(--space-l);
      font-size: var(--step-1);
      font-weight: var(--font-weight-bold);
      font-feature-settings: var(--font-unstable);

      &:first-child {
        padding-inline-start: var(--space-m);
      }

      &:last-child {
        padding-inline-end: var(--space-m);
      }

      @media (hover: hover) and (pointer: fine) {
        &:not([aria-disabled]):hover {
          background: var(--pink-9);
          color: white;
        }
      }

      &[aria-disabled] {
        background-color: var(--mauve-4);
        color: var(--mauve-8);
        cursor: default;
      }

      &:focus-visible {
        outline: var(--focus-ring);
        outline-offset: var(--focus-ring-offset);
      }
    }
  }
</style>
