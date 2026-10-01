import { env } from "cloudflare:workers";
import { error } from "@sveltejs/kit";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export const getDb = () => {
  if (!env.DB) error(500, "Database binding not available");

  return drizzle(env.DB, { schema });
};
