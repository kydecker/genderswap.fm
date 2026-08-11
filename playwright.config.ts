import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  webServer: {
    command: "pnpm build && pnpm preview",
    port: 4173,
  },
  testDir: "tests",
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  use: {
    baseURL: "http://localhost:4173",
  },
};

export default config;
