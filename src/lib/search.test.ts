import { describe, expect, it } from "vitest";
import { toFtsQuery } from "./search";

describe("toFtsQuery", () => {
  it.each([
    ["kate bush", '"kate" AND "bush"'],
    ["Kate", '"Kate"'],
    ['"running up that hill"', '"running up that hill"'],
    ["the beatles", '"beatles"'],
    ["bush -kate", '"bush" NOT "kate"'],
    ["bowie or bush", '("bowie" OR "bush")'],
    ["david bowie or bush", '(("david" AND "bowie") OR "bush")'],
    ["AC/DC", '"AC/DC"'],
    ['he said "hi', '"he" AND "said" AND "hi"'],
    ["don't", '"don\'t"'],
  ])("converts %s", (input, expected) => {
    expect(toFtsQuery(input)).toBe(expected);
  });

  it.each(["", "   ", "the", "-kate", "or", '""', "*"])(
    "returns null for %j",
    (input) => {
      expect(toFtsQuery(input)).toBeNull();
    },
  );
});
