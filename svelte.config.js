import { preprocessMeltUI } from '@melt-ui/pp';
import sequence from 'svelte-sequential-preprocessor';
import adapter from '@sveltejs/adapter-cloudflare';
import { mdsvex } from 'mdsvex';
import { sveltePreprocess } from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config}*/
const config = {
  extensions: ['.svelte', '.md'],
  preprocess: sequence([
    sveltePreprocess({
      typescript: true,
      scss: true
    }),
    mdsvex({
      extensions: ['.md'],
      layout: import.meta.dirname + '/src/lib/components/ProseLayout.svelte'
    }),
    preprocessMeltUI()
  ]),
  kit: {
    adapter: adapter({
      runtime: 'nodejs22.x'
    })
  }
};

export default config;
