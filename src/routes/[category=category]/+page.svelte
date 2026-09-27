<script lang="ts">
import { page } from "$app/state";
import CoverGrid from "$lib/components/CoverGrid.svelte";
import SearchBar from "$lib/components/SearchBar.svelte";
import { SITE_URL, TAGS, toTitleCase } from "$lib/constants";

let { data } = $props();

let tag = $derived(TAGS[data.tag]);
</script>

<svelte:head>
  <title>{`${toTitleCase(tag.label)} · Genderswap.fm`}</title>
  <meta name="description" content={tag.description} />
  <link rel="canonical" href={`${SITE_URL}/${tag.slug}`} />
  <meta property="og:image" content={`${page.url.origin}/og-image.png`} />
  <meta property="og:image:alt" content="Genderswap.fm" />
</svelte:head>

<SearchBar tag={data.tag} />
<CoverGrid {data} title={tag.label} description={tag.description} />
