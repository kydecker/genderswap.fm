import { render } from "@testing-library/svelte";
import { describe, it } from "vitest";
import NewCoverIcon from "./NewCoverIcon.svelte";

describe("NewCoverIcon", async () => {
  it("should render the new cover icon svg", async ({ expect }) => {
    const { container } = render(NewCoverIcon);
    const svg = container.querySelector("svg");
    expect(svg).toBeDefined();
  });
});
