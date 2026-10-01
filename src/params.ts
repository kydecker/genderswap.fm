import { defineParams } from "@sveltejs/kit/params";
import { TAG_BY_SLUG } from "#lib/constants.ts";

export const params = defineParams({
  category: (param) => (TAG_BY_SLUG.has(param) ? param : undefined),
});
