<script lang="ts">
import ErrorIcon from "~icons/ri/error-warning-line";

let { error, banner = false }: { error: string; banner?: boolean } = $props();
</script>

<div class="error" class:banner>
  <ErrorIcon />
  <span class="errorMessage">{error}</span>
</div>

<style>
  .error {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    color: var(--red-9);
    margin-block-start: var(--space-s);

    &.banner {
      background-color: var(--red-3);
      padding-block: var(--space-s);
      padding-inline: var(--space-m);
      border-radius: var(--radius-s);
    }
  }
</style>
