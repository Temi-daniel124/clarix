#!/usr/bin/env node
/**
 * Visual check for the public pages (plan 1, task 10).
 *
 *   BASE_URL=http://localhost:3000 node scripts/visual/check-marketing.mjs
 *
 * For each page at 360, 390, 768 and 1440 wide it asserts:
 *   - no horizontal overflow (scrollWidth <= innerWidth);
 *   - no console errors, page errors or failed same-origin requests (nothing is ignored);
 *   - the one-primary rule (spec §6): exactly one primary button in the first viewport (at most
 *     one on /privacy, which has no call to action of its own), and no viewport-height slice of
 *     the whole page ever holds more than one;
 * and saves scripts/visual/out/<page>-<width>.png (first viewport) and <page>-<width>-full.png
 * (whole page, taken with the viewport as tall as the page because the `reveal` utility is
 * scroll-driven). Finally it checks that under reduced motion the hero carousel is still on its
 * first photo after 7 seconds, and that without it the carousel does advance.
 *
 * A primary is recognised by `shadow-primary-float`, the class only the primary variant of
 * buttonVariants carries (button.test.ts pins that). Exits non-zero on any failure.
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = join(dirname(fileURLToPath(import.meta.url)), "out");
const PRIMARY = "shadow-primary-float";

const PAGES = [
  { path: "/", name: "home", firstViewport: "exactly-one" },
  { path: "/pricing", name: "pricing", firstViewport: "exactly-one" },
  { path: "/for-members", name: "for-members", firstViewport: "exactly-one" },
  { path: "/privacy", name: "privacy", firstViewport: "at-most-one" },
  { path: "/login", name: "login", firstViewport: "exactly-one" },
];

const VIEWPORTS = [
  { width: 360, height: 780 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

const failures = [];
const fail = (label, message) => {
  failures.push(`${label}: ${message}`);
  console.log(`  FAIL ${message}`);
};
const pass = (message) => console.log(`  ok   ${message}`);

/** Primaries that are rendered and intersect the current viewport, described for messages. */
function primariesInViewport(primaryClass) {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  return [...document.querySelectorAll("a, button")]
    .filter((el) => el.classList.contains(primaryClass))
    .filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || Number(style.opacity) === 0) return false;
      return r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
    })
    .map((el) => `"${(el.textContent ?? "").trim().replace(/\s+/g, " ")}"`);
}

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready);
}

async function checkPage(browser, target, viewport) {
  const label = `${target.path} @ ${viewport.width}`;
  console.log(label);

  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("requestfailed", (req) => {
    if (req.url().startsWith(BASE_URL)) {
      errors.push(`requestfailed: ${req.url()} (${req.failure()?.errorText})`);
    }
  });
  page.on("response", (res) => {
    if (res.url().startsWith(BASE_URL) && res.status() >= 400) {
      errors.push(`HTTP ${res.status()}: ${res.url()}`);
    }
  });

  const response = await page.goto(BASE_URL + target.path, { waitUntil: "load" });
  if (!response || !response.ok()) {
    fail(label, `page responded ${response?.status()}`);
  }
  await settle(page);

  // 1. No horizontal overflow.
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  if (scrollWidth <= innerWidth) pass(`no horizontal overflow (${scrollWidth} <= ${innerWidth})`);
  else fail(label, `horizontal overflow: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`);

  // 2. Exactly one (or, on /privacy, at most one) primary in the first viewport.
  const first = await page.evaluate(primariesInViewport, PRIMARY);
  const firstOk =
    target.firstViewport === "exactly-one" ? first.length === 1 : first.length <= 1;
  const rule = target.firstViewport === "exactly-one" ? "exactly one" : "at most one";
  if (firstOk) pass(`${rule} primary in the first viewport (${first.join(", ") || "none"})`);
  else fail(label, `${first.length} primaries in the first viewport, expected ${rule}: ${first.join(", ")}`);

  // 4a. First-viewport screenshot.
  await page.screenshot({ path: join(OUT, `${target.name}-${viewport.width}.png`) });

  // 3. No viewport-height slice of the page holds more than one primary. Scrolled in quarter-
  //    viewport steps so sticky and fixed elements are counted where they actually sit.
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Math.max(1, Math.floor(viewport.height / 4));
  let worst = { count: 0, at: 0, names: [] };
  for (let y = 0; y <= Math.max(0, pageHeight - viewport.height) + step; y += step) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    const names = await page.evaluate(primariesInViewport, PRIMARY);
    if (names.length > worst.count) worst = { count: names.length, at: y, names };
  }
  if (worst.count <= 1) pass(`no viewport slice holds more than one primary (page ${pageHeight}px)`);
  else fail(label, `${worst.count} primaries in one viewport at scrollY ${worst.at}: ${worst.names.join(", ")}`);

  // 4b. Full-page screenshot with the viewport as tall as the page, so every reveal has run.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.setViewportSize({ width: viewport.width, height: pageHeight });
  await page.waitForTimeout(400);
  const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  if (fullHeight !== pageHeight) {
    await page.setViewportSize({ width: viewport.width, height: fullHeight });
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: join(OUT, `${target.name}-${viewport.width}-full.png`), fullPage: true });

  // 5. Console errors, collected across everything above.
  if (errors.length === 0) pass("no console errors or failed requests");
  else for (const e of errors) fail(label, e);

  await context.close();
}

async function checkCarousel(browser, reducedMotion) {
  const label = `/ carousel (${reducedMotion ? "reduced motion" : "full motion"})`;
  console.log(label);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
  });
  const page = await context.newPage();
  await page.goto(BASE_URL + "/", { waitUntil: "load" });
  await page.waitForTimeout(7000);
  const active = await page.getAttribute("[data-active-slide]", "data-active-slide");
  if (reducedMotion) {
    if (active === "0") pass(`still on the first photo after 7s (data-active-slide=${active})`);
    else fail(label, `moved to slide ${active} after 7s under reduced motion`);
  } else if (active !== null && active !== "0") {
    pass(`advanced on its own after 7s (data-active-slide=${active})`);
  } else {
    fail(label, `did not advance after 7s without reduced motion (data-active-slide=${active})`);
  }
  await context.close();
}

mkdirSync(OUT, { recursive: true });
console.log(`Visual check against ${BASE_URL}\n`);

const browser = await chromium.launch();
try {
  for (const target of PAGES) {
    for (const viewport of VIEWPORTS) {
      try {
        await checkPage(browser, target, viewport);
      } catch (err) {
        fail(`${target.path} @ ${viewport.width}`, `threw: ${err.message}`);
      }
    }
  }
  for (const reduced of [true, false]) {
    try {
      await checkCarousel(browser, reduced);
    } catch (err) {
      fail("/ carousel", `threw: ${err.message}`);
    }
  }
} finally {
  await browser.close();
}

console.log("");
if (failures.length > 0) {
  console.log(`FAIL: ${failures.length} problem(s)`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log(`PASS: ${PAGES.length * VIEWPORTS.length} page/width checks, carousel checks; screenshots in ${OUT}`);
