<script lang="ts">
import CoverGrid from "$lib/components/CoverGrid.svelte";
import PageMeta from "$lib/components/PageMeta.svelte";
import { TAGS } from "$lib/constants";
import { toTitleCase } from "$lib/helpers";

let { data } = $props();

let tag = $derived(TAGS[data.tag]);
let title = $derived(toTitleCase(tag.label));
</script>

<PageMeta {title} description={tag.description} />

<CoverGrid {data} {title} description={tag.description} />
