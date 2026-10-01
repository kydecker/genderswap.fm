<svelte:options css="injected" />

<script lang="ts">
let {
  title,
  tags,
  artwork,
  logo,
  shadow,
  palette,
}: {
  title: string;
  tags: string[];
  artwork: string;
  logo: string;
  shadow: string;
  palette: { bg: string; text: string };
} = $props();

const titleSize = $derived(
  title.length > 70 ? 56 : title.length > 50 ? 64 : title.length > 30 ? 72 : 80,
);
</script>

<div class="og" style:background-color={palette.bg} style:color={palette.text}>
  <div class="top">
    <div class="title" style:font-size={`${titleSize}px`}>{title}</div>
    <div class="album">
      <img class="shadow" src={shadow} alt="" />
      <img class="artwork" src={artwork} alt="" />
    </div>
  </div>
  <div class="bottom">
    <div class="tags">
      {#each tags as tag}
        <div class="tag">{tag}</div>
      {/each}
    </div>
    <img class="logo" src={logo} alt="" />
  </div>
</div>

<style>
  .og {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
    height: 100%;
    padding: 48px 60px;
    font-family: "Labil Grotesk";
    font-size: 32px;
  }

  .top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
  }

  .title {
    width: 55%;
    padding-right: 24px;
    font-weight: 700;
    line-height: 1;
  }

  .album {
    position: relative;
    width: 400px;
    height: 400px;
  }

  .shadow {
    position: absolute;
    left: -188.24px;
    top: -188.24px;
    width: 776.47px;
    height: 776.47px;
  }

  .artwork {
    position: absolute;
    width: 400px;
    height: 400px;
    border-radius: 8px;
    object-fit: cover;
  }

  .bottom {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 32px;
    width: 100%;
  }

  .tags {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
  }

  .tag {
    padding: 6px 16px 9px;
    border-radius: 12px;
    background-color: rgba(255, 255, 255, 0.25);
    font-size: 28px;
    line-height: 1.2;
  }

  .logo {
    flex-shrink: 0;
    width: 400px;
    height: 57.86px;
  }
</style>
