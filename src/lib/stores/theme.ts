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

const updateThemeToggle = (theme: Theme) => {
  if (!browser) return;
  const lightToggle = document.querySelector("[data-theme-toggle-light]");
  const darkToggle = document.querySelector("[data-theme-toggle-dark]");

  if (theme === "light") {
    lightToggle?.classList.add("active");
    darkToggle?.classList.remove("active");
  } else {
    lightToggle?.classList.remove("active");
    darkToggle?.classList.add("active");
  }
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
    updateThemeToggle(value);
  }
});
