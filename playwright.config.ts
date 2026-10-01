import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  webServer: {
    command: "pnpm build && pnpm preview --port 4173",
    port: 4173,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
  },
  testDir: "tests",
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  projects: [
    { name: "read", testIgnore: /new\.spec\.ts/ },
    { name: "write", testMatch: /new\.spec\.ts/, dependencies: ["read"] },
  ],
  use: {
    baseURL: "http://localhost:4173",
  },
};

export default config;
