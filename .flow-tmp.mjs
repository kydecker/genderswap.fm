import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage();
const searches = [];
let fail = false;
await page.route("https://itunes.apple.com/**", async (route) => {
  const term = new URL(route.request().url()).searchParams.get("term");
  searches.push(term);
  if (fail) return route.fulfill({ status: 403, body: "" });
  await new Promise((r) => setTimeout(r, 600));
  return route.continue();
});
await page.goto("http://localhost:5199/new", { waitUntil: "networkidle" });
const input = page.locator("input.searchInput").first();
const state = async (label) => {
  const s = await page.evaluate(() => ({
    spinning: !!document.querySelector(".searchIcon.spinning"),
    busy: document
      .querySelector("input.searchInput")
      ?.getAttribute("aria-busy"),
    status: [...document.querySelectorAll(".searchResults .status")].map((e) =>
      e.textContent.trim(),
    ),
    results: [...document.querySelectorAll(".searchResults .resultName")]
      .slice(0, 2)
      .map((e) => e.textContent),
    stale: !!document.querySelector(".searchResults.stale"),
  }));
  console.log(label.padEnd(28), JSON.stringify(s));
};
await input.click();
await input.pressSequentially("hurt", { delay: 40 });
await state("typing 'hurt' (pending)");
await page.waitForTimeout(150);
await state("+150ms");
await page.waitForSelector(".resultName");
await state("results arrived");
await input.pressSequentially(" johnny cash", { delay: 400 });
await state("slow typing, pending");
await page.waitForTimeout(1200);
await state("after wait");
for (let i = 0; i < 11; i++) await input.press("Backspace");
await page.waitForTimeout(50);
await state("backspaced to 'hurt' (cache)");
fail = true;
await input.pressSequentially(" nin", { delay: 30 });
await page.waitForTimeout(900);
await state("iTunes 403");
fail = false;
await input.fill("h");
await page.waitForTimeout(400);
await state("1 char");
console.log("iTunes terms requested:", searches);
await browser.close();
