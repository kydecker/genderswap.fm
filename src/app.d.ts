import type { AnyD1Database } from "drizzle-orm/d1";

declare global {
  namespace App {
    interface PageData {
      favicon?: string;
    }
    interface Platform {
      env: {
        DB: AnyD1Database;
        ASSETS?: { fetch: typeof fetch };
      };
    }
  }
}
