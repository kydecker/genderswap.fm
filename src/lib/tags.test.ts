import { describe, expect, it } from "vitest";
import { computeTags } from "./tags";

const song = (overrides = {}) => ({
  acousticness: 0.5,
  album_year: 2000,
  duration_ms: 200000,
  energy: 0.5,
  gender: ["other" as const],
  tempo: 120,
  valence: 0.5,
  ...overrides,
});

describe("computeTags", () => {
  it("returns no tags for identical songs", () => {
    expect(computeTags(song(), song())).toEqual([]);
  });

  it.each([
    ["acousticness", 0.1, 0.85, "acousticness_up", "acousticness_down"],
    ["duration_ms", 100000, 220000, "duration_up", "duration_down"],
    ["energy", 0.25, 0.75, "energy_up", "energy_down"],
    ["tempo", 100, 140, "tempo_up", "tempo_down"],
    ["valence", 0.25, 0.75, "valence_up", "valence_down"],
  ])(
    "tags %s at the threshold in both directions",
    (field, low, high, up, down) => {
      expect(
        computeTags(song({ [field]: low }), song({ [field]: high })),
      ).toEqual([up]);
      expect(
        computeTags(song({ [field]: high }), song({ [field]: low })),
      ).toEqual([down]);
    },
  );

  it("ignores differences just under the threshold", () => {
    expect(computeTags(song({ tempo: 100 }), song({ tempo: 139.9 }))).toEqual(
      [],
    );
  });

  it("adds no tag when either value is null", () => {
    expect(computeTags(song({ energy: null }), song({ energy: 1 }))).toEqual(
      [],
    );
  });

  it.each([
    [["female"], ["male"], "transition_ftm"],
    [["male"], ["female"], "transition_mtf"],
    [["female"], ["female"], "transition_ftf"],
    [["male"], ["male"], "transition_mtm"],
  ])("tags %j -> %j as %s", (original, cover, tag) => {
    expect(
      computeTags(song({ gender: original }), song({ gender: cover })),
    ).toEqual([tag]);
  });

  it("adds no transition tag for mixed or other genders", () => {
    expect(
      computeTags(
        song({ gender: ["male", "female"] }),
        song({ gender: ["female"] }),
      ),
    ).toEqual([]);
  });

  it.each([
    [9, []],
    [10, ["years_apart_10"]],
    [29, ["years_apart_20"]],
    [55, ["years_apart_50"]],
    [-30, []],
  ])("tags a %i year gap as %j", (years, expected) => {
    expect(
      computeTags(
        song({ album_year: 1970 }),
        song({ album_year: 1970 + years }),
      ),
    ).toEqual(expected);
  });
});
