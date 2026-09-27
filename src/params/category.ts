import type { ParamMatcher } from "@sveltejs/kit";
import { TAG_BY_SLUG } from "$lib/constants";

export const match = ((param) => TAG_BY_SLUG.has(param)) satisfies ParamMatcher;
