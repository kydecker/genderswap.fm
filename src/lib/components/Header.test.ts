import { render } from "@testing-library/svelte";
import { describe, it } from "vitest";
import Header from "./Header.svelte";

describe("Header", async () => {
  it("should render the logo", async ({ expect }) => {
    const { container } = render(Header);
    const logo = container.querySelector(".logo");
    expect(logo).toBeDefined();
  });

  it('should render the "add a cover" button', async ({ expect }) => {
    const { container } = render(Header);
    const button = container.querySelector('a[href="/new"]');
    expect(button).toBeDefined();
  });
});
