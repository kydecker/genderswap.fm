<script lang="ts">
import { type ConfettiOptions, confetti } from "@tsparticles/confetti";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { onMount } from "svelte";
import { page } from "$app/state";
import ColorSwirl from "$lib/components/ColorSwirl.svelte";
import CoverComparison from "$lib/components/CoverComparison.svelte";
import Sparkle from "$lib/components/Sparkle.svelte";
import Tag from "$lib/components/Tag.svelte";
import TagCloud from "$lib/components/TagCloud.svelte";
import { OG_HEIGHT, OG_WIDTH, SITE_URL, TAGS } from "$lib/constants";
import { getArtistLink, getSortedTags } from "$lib/helpers.js";
import { resolveColorToken } from "$lib/pageColor";

let { data } = $props();

const isNew = $derived(page.url.searchParams.get("new") === "true");

const isHexColor = (color: string | null | undefined): color is string =>
  !!color && /^#[0-9a-f]{6}$/i.test(color);

const pageColor = $derived(data.cover.album_color);
const swirlColors = $derived.by((): [string, string] | null => {
  const coverColor = data.cover.album_color;
  const originalColor = data.original.album_color;
  if (!isHexColor(coverColor) || !isHexColor(originalColor)) return null;
  if (coverColor === originalColor) return null;
  return [coverColor, originalColor];
});

dayjs.extend(relativeTime);
const formattedDate = $derived(dayjs(data.created_at).fromNow());

onMount(async () => {
  const fireConfetti = (placement: "left" | "right" | "bottom") => {
    const center = 90;

    const minWidth = 400;
    const maxWidth = 1600;

    const interpolate = (minValue: number, maxValue: number) =>
      ((window.innerWidth - minWidth) / (maxWidth - minWidth)) *
        (maxValue - minValue) +
      minValue;

    const scalar = interpolate(1.4, 1.8);
    const velocity = interpolate(85, 120);
    const angle = interpolate(20, 45);
    const count = interpolate(40, 80);
    const spread = interpolate(8, 20);

    const sharedProps: Partial<ConfettiOptions> = {
      scalar: scalar,
      colors: ["--color-text", "--color-surface-raised"].map(resolveColorToken),
      shapes: ["square"],
      gravity: 2,
      ticks: 30,
      disableForReducedMotion: true,
    };

    const directionalProps: Record<
      "left" | "right" | "bottom",
      Partial<ConfettiOptions>
    > = {
      left: {
        count,
        startVelocity: velocity - 10,
        angle: center - angle,
        origin: { x: 0, y: 1 },
        spread,
      },
      right: {
        count,
        startVelocity: velocity - 10,
        angle: center + angle,
        origin: { x: 1, y: 1 },
        spread,
      },
      bottom: {
        count: count * 2,
        startVelocity: velocity,
        angle: center,
        origin: { x: 0.5, y: 1 },
        spread: spread * 2.5,
      },
    };

    confetti({
      ...sharedProps,
      ...directionalProps[placement],
    });
  };

  if (isNew) {
    setTimeout(() => fireConfetti("left"), 1000);
    setTimeout(() => fireConfetti("right"), 1600);
    setTimeout(() => fireConfetti("bottom"), 3000);
  }
});
</script>

<svelte:head>
  <title>{data.title}</title>
  <meta
    name="description"
    content={data.description ?? 'Some covers deliver the age-old simple pleasures of drag.'}
  />
  <link rel="canonical" href={`${SITE_URL}${page.url.pathname}`} />
  <meta property="og:image" content={`${page.url.origin}${page.url.pathname}/og.png`} />
  <meta property="og:image:alt" content={data.pageTitle} />
  <meta property="og:image:width" content={`${OG_WIDTH}`} />
  <meta property="og:image:height" content={`${OG_HEIGHT}`} />
  {#if isHexColor(pageColor)}
    {@html `<style>:root { --color-page: ${pageColor}; }</style>`}
  {/if}
</svelte:head>

{#if swirlColors}
  <ColorSwirl colors={swirlColors} />
{/if}

<div class="layout">
  <header class="header">
    <h1 class="title">
      {data.pageTitle}{#if isNew}<Sparkle />{/if}
    </h1>
    <div class="subtitle">
      <a class="artist" href={getArtistLink(data.cover.artists[0])}>{data.cover.artists[0]}</a>
      covering{' '}
      <a class="artist" href={getArtistLink(data.original.artists[0])}>{data.original.artists[0]}</a>
    </div>
    {#if data.tags}
      <TagCloud>
        {#each getSortedTags(data.tags) as tag}
          <Tag text={TAGS[tag].label} url={`/${TAGS[tag].slug}`} />
        {/each}
      </TagCloud>
    {/if}
  </header>
  <div class="comparison">
    <CoverComparison cover={data} />
  </div>
  <footer class="footer">
    {#if data.description}
      <p class="description">{data.description}</p>
    {/if}
    <span
      >Added {data.contributor ? `by ${data.contributor}` : 'anonymously'}
      <time datetime={data.created_at}>{formattedDate}</time></span
    >
  </footer>
</div>

<style>
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 40rem);
    grid-template-areas:
      'header'
      'comparison'
      'footer';
    justify-content: center;
    align-items: start;
    padding-inline: var(--space-l);

    @supports (padding: max(0px)) {
      padding-inline-start: max(var(--space-l), env(safe-area-inset-left));
      padding-inline-end: max(var(--space-l), env(safe-area-inset-right));
    }

    @media (min-width: 56rem) {
      grid-template-columns: minmax(0, 26rem) minmax(0, 40rem);
      grid-template-rows: auto 1fr;
      grid-template-areas:
        'header comparison'
        'footer comparison';
      column-gap: var(--space-2xl);
      padding-block: var(--space-xl);
    }
  }

  .comparison {
    grid-area: comparison;
  }

  .header {
    grid-area: header;
    padding-block: var(--space-xl);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-wrap: balance;

    :global(.tags) {
      justify-content: flex-start;
    }

    @media (min-width: 56rem) {
      padding-block: 0;
    }
  }

  .title {
    position: relative;
  }

  .subtitle {
    font-size: var(--step-2);
    line-height: var(--line-height-h3);
    color: var(--color-text-muted);
    margin-block-start: var(--space-m);
    margin-block-end: var(--space-l);
    text-wrap: balance;
  }

  .artist {
    color: var(--color-text);

    @media (hover: hover) {
      &:hover {
        text-decoration: underline;
        text-decoration-color: var(--color-text-muted);
      }
    }
  }

  .description {
    background-color: var(--color-surface);
    padding: var(--space-s) var(--space-m);
    border-radius: var(--radius-l);
    font-size: var(--step-0);
    margin-block-end: var(--space-s);
    max-width: 40ch;
  }

  .footer {
    grid-area: footer;
    padding-block: var(--space-xl);
    font-size: var(--step--1);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
</style>
