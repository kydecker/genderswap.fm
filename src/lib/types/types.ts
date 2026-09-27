import type { InferSelectModel } from "drizzle-orm";
import type { covers, GENDERS, songs, TAG_VALUES } from "$lib/server/db/schema";

type DbTables = {
  songs: typeof songs;
  covers: typeof covers;
};

type DbEnums = {
  gender: (typeof GENDERS)[number];
  tags: (typeof TAG_VALUES)[number];
};

export type Tables<T extends keyof DbTables> = InferSelectModel<DbTables[T]>;

export type Enums<T extends keyof DbEnums> = DbEnums[T];
