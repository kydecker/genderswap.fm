<script lang="ts">
let {
  text,
  count,
  url,
  isActive,
}: { text: string; count?: number | null; url: string; isActive?: boolean } =
  $props();
</script>

{#if url}
  <a href={url} class="tag" class:active={isActive}>
    {text}
    {#if count}
      <span class="count">{count}</span>
    {/if}
  </a>
{:else}
  <div class="tag">
    {text}
    {#if count}
      <span class="count">{count}</span>
    {/if}
  </div>
{/if}

<style>
  .tag {
    all: unset;
    display: inline-flex;
    gap: var(--space-xs);
    align-items: baseline;
    background: var(--color-surface);
    backdrop-filter: var(--backdrop-surface);
    color: var(--color-text-muted);
    padding-block: var(--space-xs) var(--space-xs);
    padding-inline: var(--space-s);
    border-radius: var(--radius-s);
    font-size: var(--step-0);
    flex-shrink: 0;
    text-wrap: nowrap;
    line-height: 1;

    &.active {
      background: var(--color-text);
      color: var(--color-bg);
    }
  }

  a.tag:focus-visible {
    outline: var(--focus-ring);
    outline-offset: var(--focus-ring-offset);
  }

  a.tag:hover:not(.active) {
    background: var(--color-surface-hover);
    color: var(--color-text);
    cursor: pointer;
  }

  .count {
    color: var(--color-text-muted);
    font-size: var(--step--1);
  }
</style>
