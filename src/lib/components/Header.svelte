<script lang="ts">
import Logo from "./Logo.svelte";
import NewCoverIcon from "./NewCoverIcon.svelte";
</script>

<header>
  <Logo />
  <nav>
    <a href="/new" class="button">
      <NewCoverIcon />
      Add a cover
    </a>
  </nav>
</header>

<style>
  header {
    width: 100%;
    position: sticky;
    top: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-m);
    padding-block: var(--space-s);
    padding-inline-start: var(--space-m);
    padding-inline-end: var(--space-m);
    pointer-events: none;
    @supports (padding: max(0px)) {
      padding-inline-start: max(var(--space-m), env(safe-area-inset-left));
      padding-inline-end: max(var(--space-m), env(safe-area-inset-right));
    }
  }

  .button {
    all: unset;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--mauve-12);
    color: var(--mauve-1);
    line-height: 1;
    gap: var(--space-xs);
    font-weight: var(--font-weight-bold);
    padding-inline-start: var(--space-s);
    padding-inline: var(--space-m);
    padding-block: var(--space-xs);
    border-radius: var(--radius-full);
    pointer-events: auto;
    font-feature-settings: var(--font-unstable);
    transform: rotate(3deg);
    cursor: pointer;

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: var(--pink-9);
        color: white;
      }
    }

    &:focus {
      outline: 3px solid var(--pink-a9);
      outline-offset: 3px;
    }
  }
</style>
