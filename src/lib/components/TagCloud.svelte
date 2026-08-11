<script lang="ts">
let { children } = $props();
</script>

<div class="tags">
  {@render children?.()}
</div>

<style>
  .tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--space-s);
  }
</style>
