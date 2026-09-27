import { fireEvent, render } from "@testing-library/svelte";
import { describe, it } from "vitest";
import ThemeToggle from "./ThemeToggle.svelte";

describe("ThemeToggle", () => {
  it("should mark the selected theme as pressed", async ({ expect }) => {
    const { container } = render(ThemeToggle);
    const light = container.querySelector("[data-theme-toggle-light]");
    const dark = container.querySelector("[data-theme-toggle-dark]");
    if (!light || !dark) throw new Error("toggle buttons missing");

    await fireEvent.click(dark);
    expect(dark.getAttribute("aria-pressed")).toBe("true");
    expect(light.getAttribute("aria-pressed")).toBe("false");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    await fireEvent.click(light);
    expect(light.getAttribute("aria-pressed")).toBe("true");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
