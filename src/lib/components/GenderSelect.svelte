<script lang="ts">
import { createToggleGroup, melt } from "@melt-ui/svelte";
import ErrorMessage from "$lib/components/ErrorMessage.svelte";
import type { Enums } from "$lib/types/types";
import MenIcon from "~icons/ri/men-line";
import SparklingIcon from "~icons/ri/sparkling-line";
import WomenIcon from "~icons/ri/women-line";

let {
  name,
  value = $bindable(),
  errors,
}: {
  name: string;
  value: Enums<"gender">[];
  errors: string[] | undefined;
} = $props();

const {
  elements: { root, item },
  states: { value: innerValue },
} = createToggleGroup({
  type: "multiple",
  onValueChange: ({ next }) => {
    value = next as Enums<"gender">[];
    return next;
  },
});

innerValue.set(value);
</script>

<fieldset use:melt={$root} class="genderSelect" {name}>
  <div class="label" aria-invalid={errors ? 'true' : undefined}>
    Vocals include{' '}
    <span class="instructions">select all that apply</span>
  </div>
  <div class="toggleWrapper">
    <div class="toggleGroup">
      <button use:melt={$item('male')} aria-label={`Select men`}>
        <MenIcon />
        men
      </button>
      <button use:melt={$item('female')} aria-label={`Select women`}>
        <WomenIcon />
        women
      </button>
      <button use:melt={$item('other')} aria-label={`Select other`}>
        <SparklingIcon />
        other
      </button>
    </div>
    {#if errors}
      {#each errors as error}
        <ErrorMessage {error} />
      {/each}
    {/if}
  </div>
</fieldset>

<style>
  .genderSelect {
    all: unset;
  }

  .label {
    display: block;
    padding-block-end: var(--space-xs);
  }

  .instructions {
    font-size: var(--step--1);
    font-style: italic;
  }

  .toggleWrapper {
    display: flex;
    flex-direction: column;
  }

  .toggleGroup {
    display: flex;
    gap: var(--space-xs);
  }

  button {
    all: unset;
    background-color: var(--mauve-3);
    color: var(--mauve-11);
    border-radius: var(--radius-full);
    display: flex;
    line-height: 1;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    padding-block: var(--space-xs);
    padding-inline: var(--space-s);
    padding-inline-end: var(--space-m);
    cursor: pointer;

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background-color: var(--mauve-4);
      }
    }

    &[data-state='on'] {
      background-color: var(--pink-9);
      border-color: var(--pink-9);
      color: white;
    }

    &:focus {
      outline: 3px solid var(--pink-a9);
      outline-offset: 3px;
    }
  }
</style>
