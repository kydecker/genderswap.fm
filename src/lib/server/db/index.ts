import { error } from "@sveltejs/kit";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export const getDb = (platform: App.Platform | undefined) => {
  if (!platform?.env.DB) error(500, "Database binding not available");

  return drizzle(platform.env.DB, { schema });
};
