import type { D1Database } from "@cloudflare/workers-types";

declare global {
  namespace App {
    interface Platform {
      env: {
        DB: D1Database;
      };
    }
  }
}
