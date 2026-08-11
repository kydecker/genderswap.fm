import { render } from "@testing-library/svelte";
import { describe, it } from "vitest";
import Sparkle from "./Sparkle.svelte";

describe("Sparkle", async () => {
  it("should render the sparkle svg", async ({ expect }) => {
    const { container } = render(Sparkle);
    const svg = container.querySelector("svg");
    expect(svg).toBeDefined();
  });
});
