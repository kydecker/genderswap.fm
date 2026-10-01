<script lang="ts">
import CoverGrid from "#lib/components/CoverGrid.svelte";
import PageMeta from "#lib/components/PageMeta.svelte";
import { TAGS } from "#lib/constants.js";
import { tagTitle } from "#lib/helpers.js";

let { data } = $props();

let tag = $derived(TAGS[data.tag]);
let title = $derived(tagTitle(data.tag));
</script>

<PageMeta {title} description={tag.description} />

<CoverGrid {data} {title} description={tag.description} />
