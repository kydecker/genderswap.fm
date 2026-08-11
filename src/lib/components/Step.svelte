<script lang="ts">
import type { Snippet } from "svelte";

let { title, children }: { title: string; children?: Snippet } = $props();
</script>

<li class="step">
  <h2 class="stepTitle">{title}</h2>
  <div class="stepContent">
    {@render children?.()}
  </div>
</li>

<style>
  .step {
    display: grid;
    grid-template:
      'number title'
      'line content';
    grid-template-columns: var(--space-2xl) 1fr;
    counter-increment: step;
    column-gap: var(--space-m);

    &::before {
      content: counter(step);
      display: flex;
      align-items: center;
      justify-content: center;
      grid-area: number;
      font-weight: var(--font-weight-bold);
      background: var(--mauve-4);
      border-radius: var(--radius-full);
      width: var(--space-2xl);
      height: var(--space-2xl);
    }

    &:not(:last-child)::after {
      content: '';
      grid-area: line;
      display: block;
      justify-self: center;
      width: 3px;
      height: 100%;
      background: var(--mauve-4);
    }

    @media (max-width: 480px) {
      grid-template:
        'number title'
        'content content';
      grid-template-columns: var(--space-2xl) 1fr;

      &:not(:last-child)::after {
        content: unset;
      }
    }
  }

  .stepTitle {
    font-size: var(--step-1);
    grid-area: title;
    align-self: center;
  }

  .stepContent {
    grid-area: content;
    padding-block-start: var(--space-s);
    padding-block-end: var(--space-3xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-l);
  }
</style>
