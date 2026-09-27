import { writable } from "svelte/store";
import { browser } from "$app/environment";

type Theme = "light" | "dark";

const updateThemeColor = () => {
  if (!browser) return;
  const bgColor = window.getComputedStyle(
    document.documentElement,
  ).backgroundColor;
  const metaThemeColor = document.querySelector("meta[name=theme-color]");
  metaThemeColor?.setAttribute("content", bgColor);
};

const initialTheme: Theme =
  browser && document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";

export const theme = writable<Theme>(initialTheme);

theme.subscribe((value) => {
  if (browser) {
    localStorage.setItem("theme", value);
    document.documentElement.classList.toggle("dark", value === "dark");

    updateThemeColor();
  }
});
