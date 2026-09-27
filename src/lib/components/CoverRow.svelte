<script lang="ts">
import type { ComponentProps } from "svelte";
import CoverCard from "$lib/components/CoverCard.svelte";
import ArrowLeftIcon from "~icons/ri/arrow-left-s-line";
import ArrowRightIcon from "~icons/ri/arrow-right-s-line";

type Cover = Pick<
  ComponentProps<typeof CoverCard>,
  "original" | "cover" | "slug"
>;

let {
  title,
  description,
  href,
  covers,
  totalCount,
  lazy,
}: {
  title: string;
  description?: string;
  href: string;
  covers: Cover[];
  totalCount?: number;
  lazy?: boolean;
} = $props();

let track: HTMLDivElement;
let atStart = $state(true);
let atEnd = $state(false);

const updateEnds = () => {
  atStart = track.scrollLeft <= 1;
  atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
};

const scrollByPage = (direction: 1 | -1) => {
  track.scrollBy({
    left: direction * track.clientWidth * 0.8,
    behavior: "smooth",
  });
};

$effect(() => {
  const observer = new ResizeObserver(updateEnds);
  observer.observe(track);
  return () => observer.disconnect();
});
</script>

<section class="row">
  <div class="heading">
    <h2 class="title">
      <a {href}>{title}<ArrowRightIcon aria-hidden="true" /></a>
    </h2>
    {#if description}
      <p class="description">{description}</p>
    {/if}
  </div>
  <div class="scroller">
    <div class="track" bind:this={track} onscroll={updateEnds}>
      {#each covers as cover, index}
        <div class="item">
          <CoverCard
            original={cover.original}
            cover={cover.cover}
            slug={cover.slug}
            lazy={lazy || index > 5}
          />
        </div>
      {/each}
      {#if totalCount && totalCount > covers.length}
        <a class="seeAll" {href}>
          <span>All {totalCount}</span>
          <ArrowRightIcon aria-hidden="true" />
        </a>
      {/if}
    </div>
    <button
      type="button"
      class="nav prev"
      aria-label={`Scroll ${title} back`}
      hidden={atStart}
      onclick={() => scrollByPage(-1)}><ArrowLeftIcon /></button
    >
    <button
      type="button"
      class="nav next"
      aria-label={`Scroll ${title} forward`}
      hidden={atEnd}
      onclick={() => scrollByPage(1)}><ArrowRightIcon /></button
    >
  </div>
</section>

<style>
  .row {
    --gutter: max(var(--space-l), env(safe-area-inset-left));
    --item-width: clamp(8.75rem, 7.5rem + 3vw, 12rem);

    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
  }

  .heading {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
    padding-inline: var(--gutter);
  }

  .title {
    font-size: var(--step-2);
    font-feature-settings: var(--font-stable);


    a {
      display: inline-flex;
      align-items: baseline;
      border-radius: var(--radius-xs);

      :global(svg) {
        font-size: 0.7em;
        translate: 0 0.25em;
        color: var(--mauve-9);
        transition: transform 0.2s ease;
      }

      &:hover {
        color: var(--pink-11);

        :global(svg) {
          color: currentColor;
          transform: translateX(2px);
        }
      }

      &:focus-visible {
        outline: var(--focus-ring);
        outline-offset: var(--focus-ring-offset);
      }
    }
  }

  .description {
    color: var(--mauve-11);
  }

  .scroller {
    position: relative;
  }

  .track {
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
  }

  .item {
    flex: 0 0 var(--item-width);
    align-self: flex-start;
    scroll-snap-align: start;
  }

  .seeAll {
    flex: 0 0 var(--item-width);
    align-self: flex-start;
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2xs);
    padding: var(--space-s);
    text-align: center;
    border-radius: var(--radius-album);
    background: var(--mauve-3);
    color: var(--mauve-11);
    font-weight: var(--font-weight-bold);
    scroll-snap-align: start;

    &:hover {
      background: var(--mauve-4);
      color: var(--mauve-12);
    }

    &:focus-visible {
      outline: var(--focus-ring);
      outline-offset: var(--focus-ring-offset);
    }
  }

  .nav {
    position: absolute;
    top: calc(var(--space-s) + var(--item-width) / 2);
    translate: 0 -50%;
    z-index: 3;
    display: grid;
    place-items: center;
    width: var(--space-2xl);
    height: var(--space-2xl);
    border: none;
    border-radius: var(--radius-full);
    background: white;
    color: black;
    font-size: var(--step-1);
    box-shadow: var(--shadow-album-s);
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;

    &[hidden] {
      display: none;
    }

    &.prev {
      left: max(var(--space-m), env(safe-area-inset-left));
    }

    &.next {
      right: max(var(--space-m), env(safe-area-inset-right));
    }

    &:hover {
      filter: brightness(0.94);
    }

    &:focus-visible {
      opacity: 1;
      pointer-events: auto;
      outline: var(--focus-ring);
      outline-offset: var(--focus-ring-offset);
    }
  }

  @media (hover: hover) and (pointer: fine) {
    .scroller:hover .nav {
      opacity: 1;
      pointer-events: auto;
    }
  }
</style>
