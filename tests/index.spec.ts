import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.describe("should display the correct page information", () => {
  test("should display the page title", async ({ page }) => {
    const title = await page.title();
    expect(title).toBe("Genderswap.fm");
  });

  test("should include a meta description", async ({ page }) => {
    const description = await page.getAttribute(
      'meta[name="description"]',
      "content",
    );
    expect(description).toBe(
      "A catalogue of the best gender-swapped song covers. Search, listen, and add your own.",
    );
  });
});

test.describe("should display the correct theme", () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => window.localStorage.removeItem("theme"));
  });

  test.use({ colorScheme: "no-preference" });
  test("should default to light mode when no OS color scheme is set", async ({
    page,
  }) => {
    const html = page.locator("html");
    await expect(html).not.toHaveClass("dark");
  });

  test.use({ colorScheme: "no-preference" });
  test("should switch to dark mode when toggle is clicked", async ({
    page,
  }) => {
    const darkToggle = page.locator("[data-theme-toggle-dark]");
    await darkToggle.click();

    const html = page.locator("html");
    await expect(html).toHaveClass("dark");
  });

  test.use({ colorScheme: "dark" });
  test("should switch to light mode when light toggle is clicked, even if OS color scheme is dark", async ({
    page,
  }) => {
    const lightToggle = page.locator("[data-theme-toggle-light]");
    await lightToggle.click();

    const html = page.locator("html");
    await expect(html).not.toHaveClass("dark");
  });

  test.use({ colorScheme: "no-preference" });
  test("should set localStorage theme to dark when dark toggle is clicked", async ({
    page,
  }) => {
    const darkToggle = page.locator("[data-theme-toggle-dark]");
    await darkToggle.click();

    const html = page.locator("html");
    await expect(html).toHaveClass("dark");

    const localStorageTheme = await page.evaluate(() =>
      window.localStorage.getItem("theme"),
    );
    expect(localStorageTheme).toBe("dark");
  });
});

test.describe("should display and toggle tags", () => {
  test("should show category rows by default", async ({ page }) => {
    const activeTag = page.locator("button.tag.active");
    await expect(activeTag).not.toBeVisible();

    const titles = page.locator(".row .heading .title");
    await expect(titles.first()).toHaveText("Latest uploads");
    await expect(titles.nth(1)).toHaveText("MTF");
    await expect(
      page.locator(".row").first().locator(".coverCard"),
    ).toHaveCount(10);
  });

  test("should open and clear a category when its title is clicked", async ({
    page,
  }) => {
    await page
      .locator(".row .heading .title a")
      .filter({ hasText: "MTF" })
      .click();

    await expect(page).toHaveURL("/mtf");

    const activeTag = page.locator("button.tag.active");
    await expect(activeTag).toBeVisible();
    await expect(activeTag).toHaveText("MTF");
    await expect(page.locator("h1.categoryTitle")).toHaveText("MTF");
    await expect(page.locator(".categoryDescription")).toHaveText(
      "Girls cover boys.",
    );

    await activeTag.click();
    await expect(page).toHaveURL("/");
    await expect(activeTag).not.toBeVisible();
  });

  test("should open latest uploads when its title is clicked", async ({
    page,
  }) => {
    await page
      .locator(".row .heading .title a")
      .filter({ hasText: "Latest uploads" })
      .click();

    await expect(page).toHaveURL("/latest");
    await expect(page.locator("h1.categoryTitle")).toHaveText("Latest uploads");
  });

  test("should display the category for its URL", async ({ page }) => {
    await page.goto("/mtf");

    const activeTag = page.locator("button.tag.active");
    await expect(activeTag).toBeVisible();
    await expect(activeTag).toHaveText("MTF");
    await expect(page.locator("h1.categoryTitle")).toHaveText("MTF");
    expect(await page.title()).toBe("MTF · Genderswap.fm");
  });

  test("should redirect legacy query URLs to category routes", async ({
    page,
  }) => {
    await page.goto("/?tag=valence_up&page=2");
    await expect(page).toHaveURL("/happier?page=2");

    await page.goto("/?view=latest");
    await expect(page).toHaveURL("/latest");

    await page.goto("/?page=2");
    await expect(page).toHaveURL("/latest?page=2");
  });

  test("should 404 for unknown categories", async ({ page }) => {
    const response = await page.goto("/not-a-category");
    expect(response?.status()).toBe(404);
  });
});

test.describe("should display and submit search queries", () => {
  test("should not have any query in search by default", async ({ page }) => {
    const searchInput = page.locator("input#search");
    await expect(searchInput).toHaveValue("");
    await expect(searchInput).toHaveAttribute("placeholder", "Search covers…");
  });

  test("should display the search query in the input", async ({ page }) => {
    const searchInput = page.locator("input#search");
    await searchInput.fill("crazy in love");

    await expect(searchInput).toHaveValue("crazy in love");
    await expect(page).toHaveURL("/?q=crazy+in+love");
  });

  test("should clear the input of the selected tag and query on x button click", async ({
    page,
  }) => {
    await page
      .locator(".row .heading .title a")
      .filter({ hasText: "MTF" })
      .click();

    await expect(page).toHaveURL("/mtf");

    const searchInput = page.locator("input#search");
    await searchInput.fill("crazy in love");

    await expect(page).toHaveURL("/mtf?q=crazy+in+love");

    const clearButton = page.locator("button.searchClear");
    await clearButton.click();

    await expect(searchInput).toHaveValue("");
    await expect(page).toHaveURL("/");
  });

  test("should remove a selected tag when typing backspace in an empty input", async ({
    page,
  }) => {
    await page
      .locator(".row .heading .title a")
      .filter({ hasText: "MTF" })
      .click();

    await expect(page).toHaveURL("/mtf");

    const searchInput = page.locator("input#search");
    await searchInput.press("Backspace");

    const activeTag = page.locator("button.tag.active");

    await expect(page).toHaveURL("/");
    await expect(activeTag).not.toBeVisible();
  });

  test("should display the query in the input if one is in the URL", async ({
    page,
  }) => {
    await page.goto("/?q=crazy+in+love");

    const searchInput = page.locator("input#search");
    await expect(searchInput).toHaveValue("crazy in love");
  });
});

test.describe("should navigate to other pages successfully", () => {
  test("should navigate to /new on button click", async ({ page }) => {
    const addCoverButton = page.locator('a[href="/new"]');
    await addCoverButton.click();
    await expect(page).toHaveURL("/new");

    const title = await page.title();
    expect(title).toBe("Add a cover");
  });

  test("should navigate to /about on link click", async ({ page }) => {
    const aboutLink = page.locator('a[href="/about"]');
    await aboutLink.click();
    await expect(page).toHaveURL("/about");

    const title = await page.title();
    expect(title).toBe("About Genderswap.fm");
  });

  test("should disable navigating back from first page", async ({ page }) => {
    await page.goto("/latest");
    const backButton = page.locator("button").filter({ hasText: "Back" });
    await expect(backButton).toBeDisabled();
  });

  test("should navigate to the next page on click", async ({ page }) => {
    await page.goto("/latest");
    const nextButton = page.locator("button").filter({ hasText: "Next" });
    await nextButton.click();
    await expect(page).toHaveURL("/latest?page=2");
  });
});
