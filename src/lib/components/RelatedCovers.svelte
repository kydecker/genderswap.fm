<script lang="ts">
import type { ComponentProps } from "svelte";
import CoverCard from "$lib/components/CoverCard.svelte";

type Cover = Pick<
  ComponentProps<typeof CoverCard>,
  "original" | "cover" | "slug"
>;

let { covers }: { covers: Cover[] } = $props();
</script>

{#if covers.length}
  <aside class="related" aria-labelledby="related-title">
    <h2 id="related-title" class="title">Related</h2>
    <div class="list">
      {#each covers as cover, index (cover.slug)}
        <div class="item">
          <CoverCard
            original={cover.original}
            cover={cover.cover}
            slug={cover.slug}
            sizes="(min-width: 56rem) 11rem, clamp(8.75rem, 7.5rem + 3vw, 12rem)"
            lazy={index >= 4}
            tintOnHover={false}
          />
        </div>
      {/each}
    </div>
  </aside>
{/if}

<style>
  .related {
    --gutter: max(var(--space-l), env(safe-area-inset-left));
    --item-width: clamp(8.75rem, 7.5rem + 3vw, 12rem);
    --sticky-top: 6rem;

    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
    min-width: 0;

    @media (min-width: 56rem) {
      position: sticky;
      top: var(--sticky-top);
      max-height: calc(100dvh - var(--sticky-top) - var(--space-xl));
      padding-block-start: var(--space-xl);
      gap: var(--space-s);
    }
  }

  .title {
    font-size: var(--step-2);
    font-feature-settings: var(--font-stable);
    padding-inline: var(--gutter);

    @media (min-width: 56rem) {
      padding-inline: 0;
    }
  }

  .list {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    gap: var(--space-m);
    scroll-padding-inline: var(--gutter);
    padding-inline: var(--gutter);
    padding-block: var(--space-s);
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    @media (min-width: 56rem) {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
      gap: var(--space-l) var(--space-m);
      overflow-x: hidden;
      overflow-y: auto;
      overscroll-behavior: contain;
      scroll-snap-type: none;
      padding-inline: var(--space-2xs);
      margin-inline: calc(-1 * var(--space-2xs));
      padding-block: var(--space-2xs) var(--space-xl);
      scrollbar-width: thin;
      mask-image: linear-gradient(to bottom, #000 calc(100% - var(--space-xl)), transparent);

      &::-webkit-scrollbar {
        display: initial;
      }
    }
  }

  .item {
    flex: 0 0 var(--item-width);
    align-self: flex-start;
    scroll-snap-align: start;

    @media (min-width: 56rem) {
      flex: initial;
    }
  }
</style>
