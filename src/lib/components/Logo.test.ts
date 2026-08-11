import { render } from "@testing-library/svelte";
import { describe, it } from "vitest";
import Logo from "./Logo.svelte";

describe("Logo", async () => {
  it("should render the logo", async ({ expect }) => {
    const { container, getByText } = render(Logo);
    const text = getByText("Genderswap.fm");
    expect(text).toBeDefined();

    const svg = container.querySelector("svg");
    expect(svg).toBeDefined();
  });

  it("should visually hide text", async ({ expect }) => {
    const { container } = render(Logo);
    const text = container.querySelector("span");
    expect(text).toBeDefined();
    expect(text?.classList).toContain("visually-hidden");
  });
});
