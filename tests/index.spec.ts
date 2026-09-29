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

test.describe("should display and toggle tags", () => {
  test("should show category rows by default", async ({ page }) => {
    const titles = page.locator(".row .heading .title");
    await expect(titles.first()).toHaveText("Latest");
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

    await expect(page.locator("h1.categoryTitle")).toHaveText("MTF");
    await expect(page.locator(".categoryDescription")).toHaveText(
      "Girls cover boys.",
    );

    await page.locator(".backLink").click();
    await expect(page).toHaveURL("/");
  });

  test("should open latest uploads when its title is clicked", async ({
    page,
  }) => {
    await page
      .locator(".row .heading .title a")
      .filter({ hasText: "Latest" })
      .click();

    await expect(page).toHaveURL("/latest");
    await expect(page.locator("h1.categoryTitle")).toHaveText("Latest");
  });

  test("should display the category for its URL", async ({ page }) => {
    await page.goto("/mtf");

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
  test("should show search inline with no query by default", async ({
    page,
  }) => {
    await expect(page.locator("[data-search-toggle]")).not.toBeVisible();

    const searchInput = page.locator("input#search");
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveValue("");
    await expect(searchInput).toHaveAttribute("placeholder", "Search covers…");
  });

  test("should display the search query in the input", async ({ page }) => {
    const searchInput = page.locator("input#search");
    await searchInput.fill("crazy in love");

    await expect(searchInput).toHaveValue("crazy in love");
    await expect(page).toHaveURL("/?q=crazy+in+love");
  });

  test("should search within a category and clear on escape", async ({
    page,
  }) => {
    await page.goto("/mtf");

    const searchInput = page.locator("input#search");
    await expect(searchInput).toHaveAttribute("placeholder", "Search MTF…");
    await searchInput.fill("crazy in love");

    await expect(page).toHaveURL("/mtf?q=crazy+in+love");

    await searchInput.press("Escape");

    await expect(searchInput).toHaveValue("");
    await expect(page).toHaveURL("/mtf");
  });

  test("should search all covers from pages without a grid", async ({
    page,
  }) => {
    await page.goto("/about");
    await page.locator("input#search").fill("abba");

    await expect(page).toHaveURL("/?q=abba");
  });

  test("should display the query in the input if one is in the URL", async ({
    page,
  }) => {
    await page.goto("/?q=crazy+in+love");

    const searchInput = page.locator("input#search");
    await expect(searchInput).toHaveValue("crazy in love");
  });

  test.describe("on mobile", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("should open search from the nav toggle", async ({ page }) => {
      const searchInput = page.locator("input#search");
      await expect(searchInput).not.toBeVisible();

      await page.locator("[data-search-toggle]").click();

      await expect(searchInput).toBeFocused();
      await expect(searchInput).toHaveValue("");
    });

    test("should search within a category and clear on close", async ({
      page,
    }) => {
      await page.goto("/mtf");
      await page.locator("[data-search-toggle]").click();

      const searchInput = page.locator("input#search");
      await expect(searchInput).toHaveAttribute("placeholder", "Search MTF…");
      await searchInput.fill("crazy in love");

      await expect(page).toHaveURL("/mtf?q=crazy+in+love");

      await page.getByRole("button", { name: "Close search" }).click();

      await expect(searchInput).not.toBeVisible();
      await expect(page).toHaveURL("/mtf");
    });
  });
});

test.describe("should navigate to other pages successfully", () => {
  test("should navigate to /new on button click", async ({ page }) => {
    const addCoverButton = page
      .getByRole("navigation", { name: "Site" })
      .locator('a[href="/new"]');
    await addCoverButton.click();
    await expect(page).toHaveURL("/new");

    const title = await page.title();
    expect(title).toBe("Add a cover");
  });

  test("should navigate to /about on link click", async ({ page }) => {
    const aboutLink = page
      .getByRole("navigation", { name: "Site" })
      .locator('a[href="/about"]');
    await aboutLink.click();
    await expect(page).toHaveURL("/about");

    const title = await page.title();
    expect(title).toBe("About Genderswap.fm");
  });

  test("should disable navigating back from first page", async ({ page }) => {
    await page.goto("/latest");
    const back = page.locator(".pageLink").filter({ hasText: "Back" });
    await expect(back).toHaveAttribute("aria-disabled", "true");
    await expect(back).not.toHaveAttribute("href");
  });

  test("should navigate between pages with links", async ({ page }) => {
    await page.goto("/latest");
    await page.getByRole("link", { name: "Next", exact: true }).click();
    await expect(page).toHaveURL("/latest?page=2");

    await page.getByRole("link", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL("/latest");
  });
});

test.describe("should display related covers on the detail page", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.locator(".row .coverCard a").first().click();
    await expect(page).toHaveURL(/\/cover\//);
  });

  test("should list other covers under Related", async ({ page }) => {
    const related = page.getByRole("complementary", { name: "Related" });
    await expect(related.locator('a[href^="/cover/"]').first()).toBeVisible();

    const { pathname } = new URL(page.url());
    await expect(related.locator(`a[href="${pathname}"]`)).toHaveCount(0);
  });

  test("should not change the page color when hovering related covers", async ({
    page,
  }) => {
    const pageColor = () =>
      page.evaluate(() =>
        document.documentElement.style.getPropertyValue("--color-page"),
      );
    const before = await pageColor();
    await page
      .getByRole("complementary", { name: "Related" })
      .locator(".coverCard")
      .first()
      .hover();
    expect(await pageColor()).toBe(before);
  });
});
