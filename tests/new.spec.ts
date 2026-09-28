import { execFileSync } from "node:child_process";
import { expect, type Page, test } from "@playwright/test";
import { encode } from "jpeg-js";

const runId = Date.now() % 1_000_000_000;

const makeTrack = (
  offset: number,
  role: string,
  color: [number, number, number],
) => ({
  wrapperType: "track",
  kind: "song",
  trackId: runId + offset,
  trackName: `E2E ${role} ${runId}`,
  artistId: runId + offset,
  artistName: `E2E ${role} Artist`,
  collectionName: `E2E ${role} Album - Single`,
  releaseDate:
    role === "Original" ? "1973-10-15T07:00:00Z" : "2002-11-04T08:00:00Z",
  artworkUrl100: `https://is1-ssl.mzstatic.com/image/thumb/Music/e2e/${role.toLowerCase()}.jpg/100x100bb.jpg`,
  trackTimeMillis: 101_000 + offset,
  trackViewUrl: `https://music.apple.com/us/album/e2e/1?i=${runId + offset}&uo=4`,
  color,
});

const original = makeTrack(1, "Original", [200, 40, 40]);
const cover = makeTrack(2, "Cover", [40, 60, 200]);
const slug = `e2e-cover-${runId}-e2e-cover-artist`;

const solidJpeg = ([r, g, b]: [number, number, number]) => {
  const data = Buffer.alloc(64 * 64 * 4);
  for (let i = 0; i < data.length; i += 4) data.set([r, g, b, 255], i);
  return encode({ data, width: 64, height: 64 }, 90).data;
};

const mockApple = async (page: Page) => {
  await page.route("https://itunes.apple.com/**", async (route) => {
    const term = new URL(route.request().url()).searchParams.get("term") ?? "";
    const results = [original, cover].filter((track) =>
      track.trackName
        .toLowerCase()
        .includes(term.toLowerCase().split(" ")[1] ?? ""),
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({
      json: { results },
      headers: { "access-control-allow-origin": "*" },
    });
  });
  await page.route("https://is1-ssl.mzstatic.com/**", (route) => {
    const track = route.request().url().includes("/original.jpg/")
      ? original
      : cover;
    return route.fulfill({
      body: solidJpeg(track.color),
      contentType: "image/jpeg",
      headers: { "access-control-allow-origin": "*" },
    });
  });
};

const pageColor = (page: Page) =>
  page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--color-page")
      .trim(),
  );

const selectSong = async (page: Page, query: string, name: string) => {
  const search = page.locator("input.searchInput").first();
  await search.click();
  await search.pressSequentially(query, { delay: 30 });
  await expect(page.locator(".searchResults .status")).toHaveText("Searching…");
  await page.locator(".result").filter({ hasText: name }).click();
};

test.describe.configure({ mode: "serial" });

test.afterAll(() => {
  execFileSync(
    "pnpm",
    [
      ..."exec wrangler d1 execute genderswap-fm --local --command".split(" "),
      `DELETE FROM covers WHERE slug = '${slug}'; DELETE FROM songs WHERE apple_id IN ('${original.trackId}', '${cover.trackId}');`,
    ],
    { stdio: "ignore" },
  );
});

test("should submit a new cover", async ({ page }) => {
  await mockApple(page);
  await page.goto("/new");
  const initialColor = await pageColor(page);

  await selectSong(page, `e2e cover ${runId}`, cover.trackName);
  await expect(page.locator(".selectedSong").first()).toContainText(
    "E2E Cover Album · 2002",
  );
  await expect.poll(() => pageColor(page)).not.toBe(initialColor);
  await page.getByRole("button", { name: "Select men" }).first().click();

  await selectSong(page, `e2e original ${runId}`, original.trackName);
  await expect(page.locator("canvas.colorSwirl")).toHaveClass(/ready/);
  await page.getByRole("button", { name: "Select women" }).nth(1).click();

  await page.locator("textarea").fill("Written by an end-to-end test.");
  await page.locator("form button[type=submit]").last().click();

  await expect(page).toHaveURL(`/cover/${slug}?new=true`);
  await expect(page.locator("h2.name")).toHaveText([
    cover.trackName,
    original.trackName,
  ]);
  await expect(
    page.getByRole("link", { name: "Listen to cover on Apple Music" }),
  ).toHaveAttribute(
    "href",
    `https://music.apple.com/us/album/e2e/1?i=${cover.trackId}`,
  );
  await expect(page.getByText("Written by an end-to-end test.")).toBeVisible();
});

test("should warn when a cover was already submitted", async ({ page }) => {
  await mockApple(page);
  await page.goto("/new");
  await selectSong(page, `e2e cover ${runId}`, cover.trackName);
  await expect(page.locator(".bannerTitle")).toContainText(
    "This cover was already submitted",
  );
});

test("should explain empty and failed searches", async ({ page }) => {
  await page.route("https://itunes.apple.com/**", (route) =>
    route.request().url().includes("fail")
      ? route.fulfill({ status: 403 })
      : route.fulfill({ json: { results: [] } }),
  );
  await page.goto("/new");
  const search = page.locator("input.searchInput").first();
  await search.click();
  await search.pressSequentially("zzqx nothing", { delay: 30 });
  await expect(page.locator(".searchResults .status")).toHaveText(
    "No songs found for “zzqx nothing”",
  );
  await search.pressSequentially(" fail", { delay: 30 });
  await expect(page.locator(".searchResults .status")).toContainText(
    "Couldn’t reach Apple Music",
  );
});
