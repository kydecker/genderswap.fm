<script lang="ts">
import { theme } from "$lib/stores/theme";
import MoonIcon from "~icons/ri/moon-line";
import SunIcon from "~icons/ri/sun-line";
</script>

<div class="themeToggle" role="group" aria-label="Theme">
  <button
    type="button"
    data-theme-toggle-light
    aria-pressed={$theme === "light"}
    onclick={() => theme.set("light")}
  >
    <SunIcon aria-hidden="true" />
    Light
  </button>
  <button
    type="button"
    data-theme-toggle-dark
    aria-pressed={$theme === "dark"}
    onclick={() => theme.set("dark")}
  >
    <MoonIcon aria-hidden="true" />
    Dark
  </button>
</div>

<style>
  .themeToggle {
    display: inline-flex;
    gap: var(--space-2xs);
    padding: var(--space-2xs);
    border-radius: var(--radius-full);
    background: var(--mauve-3);
  }

  button {
    all: unset;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    padding-block: var(--space-2xs);
    padding-inline: var(--space-s);
    border-radius: var(--radius-full);
    color: var(--mauve-11);
    cursor: pointer;

    &:hover {
      color: var(--mauve-12);
    }

    &[aria-pressed="true"] {
      background: var(--mauve-1);
      color: var(--mauve-12);
      font-weight: var(--font-weight-bold);
    }

    &:focus-visible {
      outline: 3px solid var(--pink-a9);
      outline-offset: 2px;
    }
  }
</style>
