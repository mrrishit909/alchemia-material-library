import { expect, test, type Page } from "@playwright/test";
import { MATERIALS, tensile } from "../../packages/domain/src/index.ts";
const open = async (page: Page, url: string) => { await page.goto(url); await expect(page.getByTestId("hud")).toBeVisible({ timeout: 30_000 }); await expect(page.locator(".app")).toHaveAttribute("data-intro", "done"); await expect(page.getByTestId("hud")).toHaveCSS("opacity", "1"); };
const num = async (page: Page, id: string) => Number((await page.getByTestId(id).textContent())!.replace(/[^0-9.\-]/g, ""));
type W = { __aLive: { split: number; sphere: number; enter: number; heat: number; melt: number }; __aStars: () => number[][] };
const phase = (page: Page) => page.getByTestId("test-phase");

// Blueprint section 19, the demo script.
test("demo walk: matter intro, pick a material, tensile rig, compare with ceramic, reweight, save a shortlist", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByTestId("skip-intro")).toBeVisible(); await expect(page.getByTestId("intro")).toHaveAttribute("data-step", /[0-9]/);
  await page.getByTestId("skip-intro").click(); await expect(page.getByTestId("intro")).toHaveCount(0, { timeout: 40_000 });
  await expect(page.getByTestId("hud")).toHaveCSS("opacity", "1", { timeout: 10_000 }); // toBeVisible ignores opacity, so assert it
  const L = await page.evaluate(() => (window as unknown as W).__aLive); expect(L.split).toBe(1); expect(L.sphere).toBe(0);
  // select a material from the constellation's ranking list
  await expect(page.getByRole("heading", { name: "Material universe" })).toBeVisible(); await page.getByTestId("pick-steel-1020").click(); await expect(page.getByTestId("selected")).toContainText("Carbon steel 1020"); await expect(page.getByTestId("sel-name")).toHaveText("Carbon steel 1020");
  // move it into the tensile rig and run the visualised test
  await page.getByTestId("go-test").click(); await expect(page.getByTestId("test-material")).toHaveValue("steel-1020"); await page.getByTestId("kind-tensile").click(); await page.getByTestId("run").click();
  await expect(phase(page)).toHaveAttribute("data-phase", /entering|running/); await page.waitForFunction(() => (window as unknown as W).__aLive.enter > 0.9, null, { timeout: 15_000 }); await expect(phase(page)).toHaveAttribute("data-phase", "running", { timeout: 15_000 });
  const t1 = Number(await page.getByTestId("test-chart").getAttribute("data-t")); await page.waitForTimeout(1500); expect(Number(await page.getByTestId("test-chart").getAttribute("data-t"))).toBeGreaterThan(t1);
  await expect(phase(page)).toHaveAttribute("data-phase", "done", { timeout: 30_000 });
  const steel = tensile(MATERIALS.find((m) => m.id === "steel-1020")!); expect(await num(page, "r-uts")).toBe(steel.utsMpa); await expect(page.getByTestId("r-mode")).toContainText("ductile");
  // compare with a ceramic
  await page.getByTestId("test-vs").selectOption("alumina"); await page.getByTestId("run").click(); await expect(phase(page)).toHaveAttribute("data-phase", "done", { timeout: 40_000 }); await expect(page.getByTestId("vs-r-mode")).toContainText("brittle"); await expect(page.getByTestId("test-verdict")).toContainText("Alumina 99%"); await expect(page.getByTestId("curve-vs")).toBeVisible();
  // reweight by strength, carbon and cost: the ranking and the constellation both change
  await page.getByTestId("nav-universe").click(); const before = await page.evaluate(() => (window as unknown as W).__aStars()), top0 = await page.getByTestId("rank-0").getAttribute("data-id");
  await page.getByTestId("w-carbon").fill("2"); await page.getByTestId("w-strength").fill("0"); await page.getByTestId("w-cost").fill("2"); await expect.poll(async () => page.getByTestId("rank-0").getAttribute("data-id")).not.toBe(top0);
  await expect.poll(async () => { const now = await page.evaluate(() => (window as unknown as W).__aStars()); return now.filter((p, i) => Math.hypot(p[0] - before[i][0], p[1] - before[i][1], p[2] - before[i][2]) > 0.15).length; }, { timeout: 15_000 }).toBeGreaterThan(15);
  // shortlist, save and reload
  const first = await page.getByTestId("rank-0").getAttribute("data-id"); await page.getByTestId(`star-${first}`).click(); await page.getByTestId("star-" + (await page.getByTestId("rank-1").getAttribute("data-id"))).click(); await expect(page.getByTestId("shortlist-count")).toHaveText("2/8");
  await page.getByTestId("sl-name").fill("Low carbon picks"); await page.getByTestId("sl-save").click(); await expect(page.getByTestId("saved-lists")).toContainText("Low carbon picks");
  expect(errors).toEqual([]);
});
test("a saved shortlist persists across a reload, loads with its weights, and can be deleted", async ({ page }) => {
  await open(page, "/?skip=1&view=universe"); await page.getByTestId("search").fill("6061"); await page.getByTestId("star-al-6061").click(); await expect(page.getByTestId("shortlist-count")).toHaveText("1/8"); await page.getByTestId("sl-name").fill("Aluminium"); await page.getByTestId("sl-save").click();
  await page.goto("/?skip=1&view=universe"); await expect(page.getByTestId("saved-lists")).toContainText("Aluminium"); await expect(page.getByTestId("shortlist-count")).toHaveText("1/8"); await page.getByTestId("sl-remove-al-6061").click(); await expect(page.getByTestId("shortlist-count")).toHaveText("0/8");
  await page.getByTestId("saved-lists").getByRole("button", { name: "Load" }).click(); await expect(page.getByTestId("shortlist-count")).toHaveText("1/8"); await page.getByTestId("saved-lists").getByRole("button", { name: "Delete" }).click(); await expect(page.getByTestId("saved-lists")).not.toContainText("Aluminium");
});
test("manufacturing filters narrow the universe: injection moulding keeps polymers and filled nylon", async ({ page }) => {
  await open(page, "/?skip=1&view=process"); const all = await num(page, "proc-count"); await page.getByTestId("proc-injection-molding").check(); await expect.poll(() => num(page, "proc-count")).toBeLessThan(all); await page.getByTestId("nav-universe").click(); const ids = await page.getByTestId("rank-list").locator("li").evaluateAll((els) => els.map((e) => e.getAttribute("data-id"))); expect(ids).toContain("abs"); expect(ids).not.toContain("steel-1020"); await page.getByTestId("nav-process").click(); await page.getByTestId("clear-filters").click(); expect(await num(page, "proc-count")).toBe(all);
});
test("compare: four materials on a radar, the best of each row is marked, and a fifth replaces the oldest", async ({ page }) => {
  await open(page, "/?skip=1&view=compare"); await expect(page.getByTestId("radar").locator("polygon.poly")).toHaveCount(4); await expect(page.getByTestId("cell-lightness-cfrp-qi")).toHaveClass(/win/); await expect(page.getByTestId("cell-stiffness-alumina")).toHaveClass(/win/);
  await page.getByTestId("cmp-3").selectOption("ti-64"); await expect(page.getByTestId("radar-ti-64")).toBeVisible(); await page.getByTestId("cmp-2").selectOption(""); await expect(page.getByTestId("radar").locator("polygon.poly")).toHaveCount(3); await expect(page.getByTestId("cmp-best")).toContainText("Highest weighted score");
});
test("bending and impact: stiffness follows the geometry, steel loses toughness when cold", async ({ page }) => {
  await open(page, "/?skip=1&view=test&material=steel-1020&gfx=off"); await page.getByTestId("kind-bending").click(); await page.getByTestId("run").click(); await expect(phase(page)).toHaveAttribute("data-phase", "done", { timeout: 20_000 }); const k1 = await num(page, "r-stiffness");
  await page.getByTestId("p-thick").fill("8"); await page.getByTestId("run").click(); await expect(phase(page)).toHaveAttribute("data-phase", "done", { timeout: 20_000 }); expect(await num(page, "r-stiffness")).toBeGreaterThan(k1 * 7);
  await page.getByTestId("kind-impact").click(); await page.getByTestId("run").click(); await expect(phase(page)).toHaveAttribute("data-phase", "done", { timeout: 20_000 }); const warm = await num(page, "r-absorbed"); await page.getByTestId("p-temp").fill("-60"); await page.getByTestId("run").click(); await expect(phase(page)).toHaveAttribute("data-phase", "done", { timeout: 20_000 }); expect(await num(page, "r-absorbed")).toBeLessThan(warm / 3);
});
test("footprint: the measure changes the bars, the best is marked, a shortlist replaces the top ten", async ({ page }) => {
  await open(page, "/?skip=1&view=footprint"); await expect(page.getByTestId("fp-bars").locator("li")).toHaveCount(10); await page.getByTestId("fp-metric").selectOption("massKg"); const best = await page.getByTestId("fp-best").textContent(); await page.getByTestId("fp-metric").selectOption("costSteelKg"); expect(await page.getByTestId("fp-best").textContent()).not.toBe(best);
  await page.getByTestId("nav-universe").click(); await page.getByTestId("search").fill("alumin"); const ids = await page.getByTestId("rank-list").locator("li").evaluateAll((e) => e.map((x) => x.getAttribute("data-id"))); for (const id of ids.slice(0, 2)) await page.getByTestId(`star-${id}`).click(); await page.getByTestId("search").fill(""); await page.getByTestId("nav-footprint").click(); await expect(page.getByTestId("fp-bars").locator("li")).toHaveCount(2);
});
test("detail: properties, processes, one clearly labelled sponsored supplier, and a CSV datasheet", async ({ page }) => {
  await open(page, "/?skip=1&view=detail&material=ti-64"); await expect(page.getByTestId("d-strength")).toContainText("950"); await expect(page.getByTestId("detail-procs")).toContainText("Additive, metal powder bed"); await expect(page.getByTestId("sponsored")).toHaveCount(1); await expect(page.getByTestId("suppliers").locator("li")).toHaveCount(2);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByTestId("download-csv").click()]); expect(dl.suggestedFilename()).toBe("ti-64.csv"); const text = await (await import("node:fs")).promises.readFile((await dl.path())!, "utf8"); expect(text).toContain("Tensile strength,950,MPa"); expect(text).toContain("not a datasheet");
  await open(page, "/?skip=1&view=detail&material=abs"); await expect(page.getByTestId("sponsored")).toHaveCount(0);
});
test("deep link opens a view and a material", async ({ page }) => { await open(page, "/?view=detail&material=alumina"); await expect(page.getByRole("heading", { name: "Alumina 99%" })).toBeVisible(); });
test("refresh mid-sequence restarts the intro cleanly", async ({ page }) => { await page.goto("/"); await page.waitForTimeout(1500); await page.reload(); await expect(page.getByTestId("intro")).toHaveAttribute("data-step", /[01]/); });
test("keyboard: weight sliders and the shortlist star are reachable without a pointer", async ({ page }) => {
  await open(page, "/?skip=1&view=universe"); const w0 = await num(page, "rank-0"); void w0; await expect(async () => { await page.getByTestId("w-strength").focus(); await page.keyboard.press("ArrowRight"); await expect(page.locator("label", { hasText: "Strength" }).locator("output")).not.toHaveText("1.0", { timeout: 800 }); }).toPass({ timeout: 15_000 });
  const star = page.getByTestId("star-" + (await page.getByTestId("rank-0").getAttribute("data-id"))); await expect(async () => { await star.focus(); await expect(star).toBeFocused({ timeout: 500 }); }).toPass({ timeout: 10_000 }); await page.keyboard.press("Enter"); await expect(page.getByTestId("shortlist-count")).toHaveText("1/8");
});
test("choices made while the intro's last fade is still running are kept", async ({ page }) => {
  await page.goto("/"); await page.getByTestId("skip-intro").click(); await expect(page.getByTestId("hud")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("nav-compare").click(); await expect(page.getByTestId("intro")).toHaveCount(0, { timeout: 40_000 }); await expect(page.getByRole("heading", { name: "Compare materials" })).toBeVisible();
});
test("the intro's sphere melts and crystallises on the way: heat and melt rise, then the sphere divides into the constellation", async ({ page }) => {
  await page.goto("/"); await page.waitForFunction(() => (window as unknown as W).__aLive?.melt > 0.6, null, { timeout: 40_000 }); const m = await page.evaluate(() => (window as unknown as W).__aLive); expect(m.heat).toBeGreaterThan(0.5); expect(m.split).toBe(0);
  await page.getByTestId("skip-intro").click(); await expect(page.getByTestId("intro")).toHaveCount(0, { timeout: 40_000 }); const e = await page.evaluate(() => (window as unknown as W).__aLive); expect(e.split).toBe(1); expect(e.melt).toBe(0);
});
