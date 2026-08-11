import { preprocessMeltUI } from "@melt-ui/pp";
import adapter from "@sveltejs/adapter-cloudflare";
import { mdsvex } from "mdsvex";
import { sveltePreprocess } from "svelte-preprocess";
import sequence from "svelte-sequential-preprocessor";

/** @type {import('@sveltejs/kit').Config}*/
const config = {
  extensions: [".svelte", ".md"],
  preprocess: sequence([
    sveltePreprocess({
      typescript: true,
    }),
    mdsvex({
      extensions: [".md"],
      layout: `${import.meta.dirname}/src/lib/components/ProseLayout.svelte`,
    }),
    preprocessMeltUI(),
  ]),
  kit: {
    adapter: adapter({
      runtime: "nodejs24.x",
    }),
  },
};

export default config;
