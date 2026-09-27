import type { AnyD1Database } from "drizzle-orm/d1";

declare global {
  namespace App {
    interface Platform {
      env: {
        DB: AnyD1Database;
        ASSETS?: { fetch: typeof fetch };
      };
    }
  }
}
