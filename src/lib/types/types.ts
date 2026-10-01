import type { InferSelectModel } from "drizzle-orm";
import type * as schema from "#lib/server/db/schema.js";

export type Tables<T extends "songs" | "covers"> = InferSelectModel<
  (typeof schema)[T]
>;

export type Enums<T extends "gender" | "tags"> = {
  gender: schema.Gender;
  tags: schema.Tag;
}[T];
