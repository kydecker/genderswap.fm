import { error, redirect } from "@sveltejs/kit";
import { gte, sql } from "drizzle-orm";
import { getDb } from "$lib/server/db";
import { covers } from "$lib/server/db/schema";

export async function GET({ platform }) {
  const random = await getDb(platform)
    .select({ slug: covers.slug })
    .from(covers)
    .where(
      gte(covers.id, sql`(select abs(random()) % max(id) + 1 from ${covers})`),
    )
    .orderBy(covers.id)
    .limit(1)
    .get();

  if (!random) error(404, { message: "No covers yet" });

  redirect(302, `/cover/${random.slug}`);
}
