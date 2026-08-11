<script lang="ts">
let { children } = $props();
</script>

<ol class="steps">
  {@render children?.()}
</ol>

<style>
  .steps {
    list-style: none;
    counter-reset: steps;
    margin: 0;
    padding: 0;
  }
</style>
