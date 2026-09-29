<script lang="ts">
import type { ComponentProps } from "svelte";
import CoverCard from "$lib/components/CoverCard.svelte";

type Cover = Pick<
  ComponentProps<typeof CoverCard>,
  "original" | "cover" | "slug"
>;

let { covers }: { covers: Cover[] } = $props();
</script>

{#key covers}
  {#if covers.length}
    <aside class="related" aria-labelledby="related-title">
      <h2 id="related-title" class="title">Related</h2>
      <div class="list">
        {#each covers as cover, index (cover.slug)}
          <div class="item">
            <CoverCard
              {...cover}
              sizes="(min-width: 56rem) 11rem, clamp(8.75rem, 7.5rem + 3vw, 12rem)"
              lazy={index >= 4}
              tintOnHover={false}
            />
          </div>
        {/each}
      </div>
    </aside>
  {/if}
{/key}

<style>
  .related {
    --gutter: max(var(--space-l), env(safe-area-inset-left));
    --item-width: clamp(8.75rem, 7.5rem + 3vw, 12rem);
    --header-offset: 6rem;
    --ring-space: calc(var(--space-2xs) + var(--focus-ring-width));

    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
    min-width: 0;

    @media (min-width: 56rem) {
      position: sticky;
      top: 0;
      max-height: 100dvh;
      margin-block: calc(-1 * var(--header-offset)) -100dvh;
      padding-block-start: calc(var(--header-offset) + var(--space-xl));
      padding-inline: var(--ring-space);
      margin-inline: calc(-1 * var(--ring-space));
      gap: var(--space-s);
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }
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
      overflow: visible;
      scroll-snap-type: none;
      padding-inline: 0;
      padding-block: var(--space-2xs) var(--space-xl);
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
