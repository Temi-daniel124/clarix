// Renders the PNG app icons from their SVG sources with headless Chromium, so the PNGs are
// pixel-for-pixel the same drawing as the SVGs:
//   public/icons/icon.svg          -> public/icons/icon-192.png, public/icons/icon-512.png
//   public/icons/icon-maskable.svg -> public/icons/icon-maskable-512.png
//   src/app/apple-icon.svg         -> src/app/apple-icon.png (Next.js serves apple-icon as PNG only)
//
// Playwright is not a project dependency; it must already be resolvable (globally installed,
// or via NODE_PATH). Nothing is installed here.
//
// Run: node scripts/brand/render-icons.mjs
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const jobs = [
  { src: "public/icons/icon.svg", out: "public/icons/icon-192.png", size: 192 },
  { src: "public/icons/icon.svg", out: "public/icons/icon-512.png", size: 512 },
  { src: "public/icons/icon-maskable.svg", out: "public/icons/icon-maskable-512.png", size: 512 },
  { src: "src/app/apple-icon.svg", out: "src/app/apple-icon.png", size: 180 },
];

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const { src, out, size } of jobs) {
    const svg = await readFile(path.join(root, src), "utf8");
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<!doctype html><html><body style="margin:0;background:transparent">` +
        `<img id="icon" src="${dataUrl}" width="${size}" height="${size}" style="display:block">` +
        `</body></html>`,
    );
    await page.locator("#icon").evaluate((img) => img.decode());
    await page.screenshot({
      path: path.join(root, out),
      omitBackground: true,
      clip: { x: 0, y: 0, width: size, height: size },
    });
    console.log(`wrote ${out} (${size}x${size})`);
  }
} finally {
  await browser.close();
}
