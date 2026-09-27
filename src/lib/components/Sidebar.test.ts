import { render } from "@testing-library/svelte";
import { describe, it } from "vitest";
import Sidebar from "./Sidebar.svelte";

describe("Sidebar", async () => {
  it("should render the logo", async ({ expect }) => {
    const { container } = render(Sidebar);
    const logo = container.querySelector(".logo");
    expect(logo).not.toBeNull();
  });

  it('should render the "add a cover" button', async ({ expect }) => {
    const { container } = render(Sidebar);
    const button = container.querySelector('a[href="/new"]');
    expect(button).not.toBeNull();
  });

  it("should render the site links and theme toggle", async ({ expect }) => {
    const { container } = render(Sidebar);
    for (const href of ["/", "/random", "/about"]) {
      expect(container.querySelector(`a[href="${href}"]`)).not.toBeNull();
    }
    expect(container.querySelector("[data-theme-toggle-light]")).not.toBeNull();
    expect(container.querySelector("[data-theme-toggle-dark]")).not.toBeNull();
  });
});
