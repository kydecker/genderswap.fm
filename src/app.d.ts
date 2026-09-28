import type { AnyD1Database } from "drizzle-orm/d1";
import type { ArtworkBucket } from "$lib/server/artwork";

declare global {
  namespace App {
    interface PageData {
      favicon?: string;
    }
    interface Platform {
      env: {
        DB: AnyD1Database;
        ARTWORK: ArtworkBucket;
        ASSETS?: { fetch: typeof fetch };
      };
    }
  }
}
