<script lang="ts">
import { SITE_URL } from "#lib/constants.js";
import { page } from "$app/state";

let { title, description }: { title?: string; description: string } = $props();

let path = $derived(page.url.pathname === "/" ? "" : page.url.pathname);
</script>

<svelte:head>
  <title>{title ? `${title} · Genderswap.fm` : "Genderswap.fm"}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={`${SITE_URL}${path}`} />
  <meta property="og:image" content={`${page.url.origin}/og-image.png`} />
  <meta property="og:image:alt" content="Genderswap.fm" />
</svelte:head>
