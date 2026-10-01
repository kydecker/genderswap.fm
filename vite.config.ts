import { preprocessMeltUI } from "@melt-ui/pp";
import adapter from "@sveltejs/adapter-cloudflare";
import { sveltekit } from "@sveltejs/kit/vite";
import { mdsvex } from "mdsvex";
import { sveltePreprocess } from "svelte-preprocess";
import sequence from "svelte-sequential-preprocessor";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.{js,ts}"],
    coverage: {
      include: ["src/**/*.{js,ts,svelte}"],
      exclude: [
        "src/lib/stores/**",
        "src/lib/types/**",
        "src/routes/**",
        "src/lib/schemas.ts",
        "src/lib/server/**",
      ],
      reporter: ["text", "json-summary", "json"],
    },
  },
  resolve: {
    conditions: mode === "test" ? ["browser"] : undefined,
  },
  plugins: [
    sveltekit({
      extensions: [".svelte", ".md"],
      preprocess: sequence([
        sveltePreprocess(),
        mdsvex({
          extensions: [".md"],
          layout: `${import.meta.dirname}/src/lib/components/ProseLayout.svelte`,
        }),
        preprocessMeltUI(),
      ]),
      inlineStyleThreshold: 16 * 1024,
      adapter: adapter(),
    }),
    Icons({ compiler: "svelte" }),
  ],
}));
