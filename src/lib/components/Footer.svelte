<script lang="ts">
  import { theme } from '$lib/stores/theme';
  import SunIcon from '~icons/ri/sun-line';
  import MoonIcon from '~icons/ri/moon-line';
</script>

<footer>
  <nav class="nav">
    <span class="credits">
      A project by <a href="https://ky.fyi">Ky Decker</a>
    </span>
    <div class="links">
      <a href="/about">About</a>
      <a href="https://github.com/kydecker/genderswap.fm">GitHub</a>
      <a href="/random">Random</a>
    </div>
  </nav>
  <div class="toggle">
    <button
      type="button"
      class:active={$theme === 'light'}
      data-theme-toggle-light
      aria-label="Enable light theme"
      onclick={() => theme.set('light')}
    >
      <SunIcon style="width: 20px" />
    </button>
    <button
      type="button"
      class:active={$theme === 'dark'}
      data-theme-toggle-dark
      aria-label="Enable dark theme"
      onclick={() => theme.set('dark')}
    >
      <MoonIcon style="width: 20px" />
    </button>
  </div>
</footer>

<style lang="scss">
  footer {
    width: 100%;
    padding-inline: var(--space-m);
    padding-block: var(--space-l);
    display: grid;
    grid-template-areas: 'nav toggle';
    grid-template-columns: 1fr fit-content(64px);
    align-items: center;
    row-gap: var(--space-l);
    z-index: 0;

    @supports (padding: max(0px)) {
      padding-inline-start: max(var(--space-m), env(safe-area-inset-left));
      padding-inline-end: max(var(--space-m), env(safe-area-inset-right));
      padding-block-end: max(var(--space-l), env(safe-area-inset-bottom));
    }

    a {
      font-weight: var(--font-weight-bold);
      text-decoration: underline;
      text-decoration-color: var(--mauve-7);
      text-underline-offset: 0.15em;
      white-space: nowrap;

      @media (hover: hover) and (pointer: fine) {
        &:hover {
          text-decoration-color: inherit;
        }
      }
    }
  }

  .nav {
    grid-area: nav;
  }

  .nav,
  .links {
    font-size: var(--step--1);
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-s);
  }

  .credits {
    white-space: nowrap;
  }

  .toggle {
    grid-area: toggle;
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.2em;
    margin-inline-start: 0.5em;
    border-radius: var(--radius-full);
    line-height: 0;

    button {
      all: unset;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      color: var(--mauve-10);
      cursor: pointer;

      &[data-theme-toggle-light].active,
      &[data-theme-toggle-light]:hover {
        background: var(--orange-3);
        color: var(--orange-11);
      }

      &[data-theme-toggle-dark].active,
      &[data-theme-toggle-dark]:hover {
        background: var(--purple-3);
        color: var(--purple-11);
      }
    }
  }
</style>
