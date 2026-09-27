import { describe, it } from "vitest";
import { TAG_BY_SLUG, TAGS } from "./constants";

const RESERVED_PATHS = ["about", "api", "cover", "latest", "new", "random"];

describe("tag slugs", () => {
  it("should be unique", ({ expect }) => {
    expect(TAG_BY_SLUG.size).toBe(Object.keys(TAGS).length);
  });

  it("should be URL-safe", ({ expect }) => {
    for (const { slug } of Object.values(TAGS)) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("should not collide with top-level routes", ({ expect }) => {
    for (const path of RESERVED_PATHS) {
      expect(TAG_BY_SLUG.has(path)).toBe(false);
    }
  });
});
