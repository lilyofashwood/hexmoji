const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs/promises");
const { pathToFileURL } = require("node:url");
(async () => {
  const browser = await chromium.launch({ channel: "chromium", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [], external = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => { if (/^https?:/.test(request.url())) external.push(request.url()); });
    await page.goto(pathToFileURL(path.resolve(__dirname, "../index.html")).href);
    assert.equal(await page.locator("#output").inputValue(), "🍌🍩🍬🍹");
    await page.locator("#mode").selectOption("lookup-a");
    assert.equal(await page.locator("#output").inputValue(), "🍐🍩🍬🍹");
    await page.locator("#input").fill("Lily hi");
    assert((await page.locator("#status").textContent()).normalize("NFKC").includes("ambiguous channel"));
    await page.locator("#mode").selectOption("utf8");
    await page.locator("#input").fill("𝓵𝓲𝓵𝔂 🧑🏽‍💻\n");
    assert((await page.locator("#output").inputValue()).startsWith("HX2:"));
    await page.getByRole("button", { name: "Use result as input" }).click();
    assert.equal(await page.locator("#output").inputValue(), "𝓵𝓲𝓵𝔂 🧑🏽‍💻\n");
    assert.equal((await page.locator("#status").textContent()).normalize("NFKC"), "exact primary text · exact channel bits");
    await page.locator("#input").fill("malformed frame");
    assert((await page.locator("#status").textContent()).normalize("NFKC").toLowerCase().startsWith("rejected:"));
    await page.getByRole("button", { name: "Encode", exact: true }).click();
    await page.locator("#mode").selectOption("direct");
    await page.locator("#input").fill("Lily");
    await fs.mkdir(path.resolve(__dirname, "../output"), { recursive: true });
    await page.screenshot({ path: path.resolve(__dirname, "../output/demo-desktop.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.resolve(__dirname, "../output/demo-mobile.png"), fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.deepEqual(errors, []); assert.deepEqual(external, []);
    console.log(`PASS Hexmoji offline file demo: variant identity, fish ambiguity, exact UTF-8, malformed frame, desktop/mobile; no external requests or page errors. Chrome ${browser.version()}`);
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
