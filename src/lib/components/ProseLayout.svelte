<script lang="ts">
  import { page } from '$app/state';
  import dayjs from 'dayjs';

  let { title, description, datePublished, dateModified, children } = $props();

  const formattedPublishDate = $derived(dayjs(datePublished).format('MMMM D, YYYY'));
  const formattedModifiedDate = $derived(dayjs(dateModified).format('MMMM D, YYYY'));
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={`https://genderswap.fm${page.url.pathname}`} />
</svelte:head>

<article itemscope itemtype="https://schema.org/BlogPosting">
  <header class="prose-header">
    <h1 itemprop="name" class="prose-title">{title}</h1>
    <div class="prose-dates">
      <span>Published <time datetime={datePublished.toString()}>{formattedPublishDate}</time></span>
      {#if dateModified}
        <span>
          Updated
          <time datetime={dateModified.toString()}>
            {formattedModifiedDate}
          </time>
        </span>
      {/if}
    </div>
  </header>
  <section itemprop="articleBody" class="prose">
    {@render children?.()}
  </section>
</article>

<style lang="scss" global>
  .prose {
    box-sizing: content-box;
    max-inline-size: 54ch;
    margin-inline: auto;
    padding-inline: var(--space-xl);
    padding-block-end: var(--space-3xl);
  }

  .prose-header {
    text-align: center;
    padding-inline: var(--space-xl);
    padding-block-start: var(--space-xl);
    padding-block-end: var(--space-3xl);
  }

  .prose-dates {
    font-size: var(--step-1);
    color: var(--mauve-11);
    margin-block-start: var(--space-m);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    column-gap: var(--space-l);
  }

  .prose a {
    text-indent: 0;
  }

  .prose p a,
  .prose li a {
    position: relative;
    text-decoration: underline;
    text-decoration-color: var(--mauve-7);
    text-underline-offset: 0.1em;
    transition: all 0.2s ease-in-out;
  }

  .prose h2,
  .prose h3 {
    margin-bottom: var(--space-l);
  }

  .prose a:hover,
  .prose a:focus {
    color: var(--pink-12);
  }

  .prose p a:hover,
  .prose p a:focus,
  .prose li a:hover,
  .prose li a:focus {
    text-decoration-color: var(--pink-9);
  }

  .prose h2 {
    font-size: var(--step-3);
    margin-top: var(--space-3xl);
  }

  .prose h2:first-child {
    margin-top: 0;
  }

  .prose * + p,
  .prose * + ul,
  .prose * + ol,
  .prose * + blockquote {
    margin-top: var(--space-l);
    margin-bottom: var(--space-l);
  }

  .prose ul,
  .prose ol {
    padding-left: var(--space-xl);
  }

  .prose ul ul,
  .prose ol ol {
    margin-top: 0;
    margin-bottom: 0;
  }

  .prose blockquote {
    border-left: 2px solid var(--mauve-7);
    padding-left: 1.3em;
    font-style: italic;
    hanging-punctuation: first;
  }

  .prose blockquote cite {
    display: block;
    font-style: normal;
  }

  .prose blockquote cite::before {
    content: '—';
    color: var(--mauve-11);
    margin-inline-end: 0.3em;
  }

  .prose img {
    /* This width is just for Andrea Lawlor's email;
         if other images are added, might need to enable MDX
         and set width per-image */
    width: 585px;
    max-width: 100%;
    border-radius: var(--radius-s);
    margin-inline: auto;
  }
</style>
