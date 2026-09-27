import { error, redirect } from "@sveltejs/kit";
import { sql } from "drizzle-orm";
import { getDb } from "$lib/server/db";
import { covers } from "$lib/server/db/schema";

export async function GET({ platform }) {
  const random = await getDb(platform)
    .select({ slug: covers.slug })
    .from(covers)
    .orderBy(sql`random()`)
    .limit(1)
    .get();

  if (!random) error(404, { message: "No covers yet" });

  redirect(302, `/cover/${random.slug}`);
}
