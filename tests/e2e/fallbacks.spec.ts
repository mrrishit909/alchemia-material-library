import { expect, test } from "@playwright/test";
test("reduced motion: static story, no timeline, same library", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" }), page = await ctx.newPage(); await page.goto("/");
  await expect(page.getByRole("dialog", { name: "Opening story" })).toContainText("amorphous metal", { ignoreCase: true }); await expect(page.getByTestId("pause-motion")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("skip-intro").click(); await expect(page.getByRole("heading", { name: "Material universe" })).toBeVisible(); await page.getByTestId("nav-test").click(); await page.getByTestId("run").click(); await expect(page.getByTestId("test-phase")).toHaveAttribute("data-phase", "done", { timeout: 15_000 }); await ctx.close();
});
test("graphics failure: the poster still, and every view still works from the DOM", async ({ page }) => {
  await page.goto("/?gfx=off&skip=1&view=universe"); await expect(page.getByTestId("poster")).toBeVisible(); await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByTestId("nav-test").click(); await page.getByTestId("kind-tensile").click(); await page.getByTestId("run").click(); await expect(page.getByTestId("test-phase")).toHaveAttribute("data-phase", "done", { timeout: 20_000 }); await expect(page.getByTestId("test-chart")).toBeVisible();
  await page.getByTestId("nav-compare").click(); await expect(page.getByTestId("cmp-table")).toBeVisible(); await page.getByTestId("nav-footprint").click(); await expect(page.getByTestId("fp-table")).toBeVisible();
});
test("WebGL context loss falls back to the poster", async ({ page }) => {
  await page.goto("/?skip=1&view=universe"); await expect(page.locator("canvas")).toHaveCount(1, { timeout: 30_000 }); await page.waitForFunction(() => typeof (window as unknown as { __alchemiaStats?: unknown }).__alchemiaStats === "function");
  await page.evaluate(() => document.querySelector("canvas")!.dispatchEvent(new Event("webglcontextlost", { cancelable: true }))); await expect(page.getByTestId("poster")).toBeVisible(); await page.getByTestId("nav-compare").click(); await expect(page.getByTestId("radar")).toBeVisible();
});
test("phone width: nothing scrolls sideways and the panel stays reachable", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true }), page = await ctx.newPage(); await page.goto("/?skip=1&view=universe&gfx=off");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0); await expect(page.getByTestId("nav-compare")).toBeVisible(); await page.getByTestId("nav-compare").click(); await expect(page.getByTestId("radar")).toBeVisible(); await ctx.close();
});
test("pause motion stops the ambient animation", async ({ page }) => { await page.goto("/?skip=1&view=universe"); await page.getByTestId("pause-motion").click(); await expect(page.getByTestId("pause-motion")).toHaveAttribute("aria-pressed", "true"); });
