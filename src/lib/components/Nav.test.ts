import { render } from "@testing-library/svelte";
import { describe, it } from "vitest";
import Nav from "./Nav.svelte";

describe("Nav", () => {
  it("should render the site links", ({ expect }) => {
    const { container } = render(Nav);
    for (const href of ["/", "/random", "/new", "/about"]) {
      expect(container.querySelector(`nav a[href="${href}"]`)).not.toBeNull();
    }
  });

  it("should render the search toggle", ({ expect }) => {
    const { container } = render(Nav);
    expect(container.querySelector("[data-search-toggle]")).not.toBeNull();
  });
});
