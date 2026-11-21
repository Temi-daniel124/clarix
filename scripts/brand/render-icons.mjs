// Renders the PNG app icons from their SVG sources with headless Chromium, so the PNGs are
// pixel-for-pixel the same drawing as the SVGs:
//   public/icons/icon.svg          -> public/icons/icon-192.png, public/icons/icon-512.png
//   public/icons/icon-maskable.svg -> public/icons/icon-maskable-512.png
//   src/app/apple-icon.svg         -> src/app/apple-icon.png (Next.js serves apple-icon as PNG only)
//   src/app/icon.svg               -> src/app/favicon.ico (16 and 32 px, PNG payloads in an ICO)
//
// Playwright is not a project dependency; it must already be resolvable (globally installed,
// or via NODE_PATH). Nothing is installed here.
//
// Run: node scripts/brand/render-icons.mjs
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

const jobs = [
  { src: "public/icons/icon.svg", out: "public/icons/icon-192.png", size: 192 },
  { src: "public/icons/icon.svg", out: "public/icons/icon-512.png", size: 512 },
  {
    src: "public/icons/icon-maskable.svg",
    out: "public/icons/icon-maskable-512.png",
    size: 512,
  },
  { src: "src/app/apple-icon.svg", out: "src/app/apple-icon.png", size: 180 },
];

// The favicon sizes, rendered from the same icon.svg. The SVG's own media query swaps in the
// 16px drawing (no track, thicker arc) when it is measured at that size.
const FAVICON = {
  src: "src/app/icon.svg",
  out: "src/app/favicon.ico",
  sizes: [16, 32],
};

/** Packs PNG buffers into an ICO file. Since Vista, ICO entries may hold PNG data directly. */
function packIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + 16 * entries.length;
  const dirs = entries.map(({ size, png }) => {
    const d = Buffer.alloc(16);
    d.writeUInt8(size, 0); // width (0 would mean 256)
    d.writeUInt8(size, 1); // height
    d.writeUInt16LE(1, 4); // colour planes
    d.writeUInt16LE(32, 6); // bits per pixel
    d.writeUInt32LE(png.length, 8);
    d.writeUInt32LE(offset, 12);
    offset += png.length;
    return d;
  });
  return Buffer.concat([header, ...dirs, ...entries.map((e) => e.png)]);
}

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

  const faviconSvg = await readFile(path.join(root, FAVICON.src), "utf8");
  const faviconUrl = `data:image/svg+xml;base64,${Buffer.from(faviconSvg).toString("base64")}`;
  const entries = [];
  for (const size of FAVICON.sizes) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<!doctype html><html><body style="margin:0;background:transparent">` +
        `<img id="icon" src="${faviconUrl}" width="${size}" height="${size}" style="display:block">` +
        `</body></html>`,
    );
    await page.locator("#icon").evaluate((img) => img.decode());
    const png = await page.screenshot({
      omitBackground: true,
      clip: { x: 0, y: 0, width: size, height: size },
    });
    entries.push({ size, png });
  }
  await writeFile(path.join(root, FAVICON.out), packIco(entries));
  console.log(`wrote ${FAVICON.out} (${FAVICON.sizes.join(" + ")})`);
} finally {
  await browser.close();
}
