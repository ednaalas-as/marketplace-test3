// Records a captioned walkthrough of the live marketplace with Playwright.
// Usage: node record.js <imagePath> <outDir>
const { chromium } = require("playwright");

const SITE = "https://test3-marketplace-edna.vercel.app";
const [, , IMAGE, OUT] = process.argv;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Caption banner + fake cursor, re-injected on every page load.
const overlay = () => {
  const style = document.createElement("style");
  style.textContent = `
    #demo-cap{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;
      background:rgba(5,5,5,.82);color:#fff;font:600 20px/1.3 system-ui,-apple-system,sans-serif;
      padding:12px 22px;border-radius:12px;max-width:85vw;text-align:center;pointer-events:none;
      transition:opacity .25s}
    #demo-cap small{display:block;font-weight:400;font-size:15px;opacity:.85;margin-top:2px}
    @media (max-width:500px){#demo-cap{font-size:15px;padding:8px 14px;bottom:16px;width:max-content;max-width:92vw}
      #demo-cap small{font-size:12px}}
    #demo-cur{position:fixed;z-index:100000;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;
      background:rgba(24,119,242,.35);border:2px solid #1877f2;pointer-events:none;transition:transform .12s}
    #demo-cur.down{transform:scale(.7)}`;
  const add = () => {
    document.head.appendChild(style);
    const cap = document.createElement("div"); cap.id = "demo-cap"; cap.style.opacity = "0";
    const cur = document.createElement("div"); cur.id = "demo-cur";
    const p = JSON.parse(sessionStorage.getItem("demo-cur") || '{"x":-50,"y":-50}');
    cur.style.left = p.x + "px"; cur.style.top = p.y + "px";
    document.body.append(cap, cur);
    const c = sessionStorage.getItem("demo-cap"); if (c) { cap.innerHTML = c; cap.style.opacity = "1"; }
    addEventListener("mousemove", (e) => { cur.style.left = e.clientX + "px"; cur.style.top = e.clientY + "px";
      sessionStorage.setItem("demo-cur", JSON.stringify({ x: e.clientX, y: e.clientY })); }, true);
    addEventListener("mousedown", () => cur.classList.add("down"), true);
    addEventListener("mouseup", () => cur.classList.remove("down"), true);
  };
  if (document.body) add(); else addEventListener("DOMContentLoaded", add);
};

async function caption(page, title, sub = "") {
  const html = sub ? `${title}<small>${sub}</small>` : title;
  await page.evaluate((h) => {
    sessionStorage.setItem("demo-cap", h);
    const el = document.getElementById("demo-cap");
    if (el) { el.innerHTML = h; el.style.opacity = "1"; }
  }, html);
}

async function moveTo(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 18 });
  await wait(250);
}
async function click(page, locator) { await moveTo(page, locator); await locator.click(); }
async function typeInto(page, locator, text, delay = 45) {
  await click(page, locator); await locator.pressSequentially(text, { delay });
}
async function smoothScroll(page, dy, steps = 20) {
  for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, dy / steps); await wait(30); }
}

(async () => {
  const browser = await chromium.launch();

  // ---------- Desktop walkthrough ----------
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: OUT + "/desktop", size: { width: 1280, height: 800 } },
  });
  await ctx.addInitScript(overlay);
  const page = await ctx.newPage();

  await page.goto(SITE, { waitUntil: "networkidle" });
  await page.mouse.move(640, 400);
  await caption(page, "Marketplace: Test 3 demo", "Next.js + Supabase + Vercel · test3-marketplace-edna.vercel.app");
  await wait(3500);

  await caption(page, "1. Browse listings", "Every listing is loaded live from the Supabase database");
  await smoothScroll(page, 500); await wait(1500); await smoothScroll(page, -500); await wait(1000);

  await caption(page, "2. Filter by category", "Each chip queries the database for that category");
  for (const name of ["Vehicles", "Electronics", "Books"]) {
    await click(page, page.getByRole("button", { name, exact: true }));
    await page.waitForLoadState("networkidle"); await wait(1700);
  }
  await click(page, page.getByRole("button", { name: "All", exact: true }));
  await page.waitForLoadState("networkidle"); await wait(1200);

  await caption(page, "3. Keyword search (bonus)", "Searches titles and descriptions as you type");
  const search = page.getByRole("searchbox", { name: "Search Marketplace" });
  await typeInto(page, search, "guitar", 110);
  await page.waitForURL(/q=guitar/); await page.waitForLoadState("networkidle"); await wait(2000);
  await click(page, page.getByRole("button", { name: "Clear search" }));
  await page.waitForURL((u) => !u.search.includes("q=")); await wait(800);
  await typeInto(page, search, "xyz123", 110);
  await page.waitForURL(/q=xyz123/); await page.waitForLoadState("networkidle");
  await caption(page, "3. Keyword search (bonus)", "No-results state with a one-click way back");
  await wait(2000);
  await click(page, page.getByRole("button", { name: "Clear search" }));
  await page.waitForURL((u) => !u.search.includes("q=")); await page.waitForLoadState("networkidle"); await wait(1000);

  await caption(page, "4. Listing detail page", "Each listing has its own page at /item/[id]");
  await click(page, page.getByRole("link", { name: /Solid wood bookshelf/ }));
  await page.waitForURL(/\/item\//); await page.waitForLoadState("networkidle"); await wait(2500);
  await smoothScroll(page, 300); await wait(1500); await smoothScroll(page, -300); await wait(600);

  await caption(page, "5. Message the seller", "No account needed: buyer email + message are saved in Supabase");
  await click(page, page.getByRole("button", { name: "Message seller" }));
  await wait(800);
  const dialog = page.getByRole("dialog");
  await typeInto(page, dialog.getByLabel("Your email"), "reviewer.demo@example.com");
  await wait(400);
  await click(page, dialog.getByRole("button", { name: "Send message" }));
  await dialog.getByText("Message sent!").waitFor(); await wait(2600);
  await click(page, dialog.getByRole("button", { name: "Done" })); await wait(800);

  await caption(page, "6. Create a listing", "Validation runs before anything is uploaded");
  await click(page, page.getByRole("link", { name: "Create listing" }));
  await page.waitForURL(/\/create/); await page.waitForLoadState("networkidle"); await wait(1200);
  await click(page, page.getByRole("button", { name: "Publish listing" }));
  await wait(1200); await smoothScroll(page, 450); await wait(1500); await smoothScroll(page, -900); await wait(600);

  await caption(page, "6. Create a listing", "Photo preview, then title, price, category, description and email");
  await page.locator('input[type="file"]').setInputFiles(IMAGE);
  await wait(1800);
  await typeInto(page, page.getByPlaceholder("What are you selling?"), "Noise-cancelling headphones, like new");
  await typeInto(page, page.getByPlaceholder("0.00"), "95");
  await moveTo(page, page.getByRole("combobox"));
  await page.getByRole("combobox").selectOption("Electronics"); await wait(500);
  await typeInto(page, page.getByPlaceholder(/Describe the condition/),
    "Used for two months, comes with the original cable and carry pouch.", 22);
  await typeInto(page, page.getByPlaceholder("you@example.com"), "seller.demo@example.com");
  await wait(600);
  await caption(page, "6. Create a listing", "Photo goes to Supabase Storage, the listing row to PostgreSQL");
  await click(page, page.getByRole("button", { name: "Publish listing" }));
  await page.waitForURL(/\/item\/.*created=1/, { timeout: 30000 });
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => {
    const img = document.querySelector("article img");
    return img && img.complete && img.naturalWidth > 0;
  }, null, { timeout: 30000 });
  await wait(400);
  await caption(page, "Published!", "Redirected to the new listing's own page");
  await wait(3500);

  await caption(page, "The new listing is live on the homepage", "Saved in Supabase, so it survives a refresh");
  await click(page, page.getByRole("link", { name: "Back to Marketplace" }));
  await page.waitForLoadState("networkidle"); await wait(1500);
  await page.reload({ waitUntil: "networkidle" }); await wait(3000);

  const createdUrl = page.url();
  await ctx.close();

  // ---------- Mobile segment ----------
  const m = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    recordVideo: { dir: OUT + "/mobile", size: { width: 390, height: 844 } },
  });
  await m.addInitScript(overlay);
  const mp = await m.newPage();
  await mp.goto(SITE, { waitUntil: "networkidle" });
  await wait(1200);
  await caption(mp, "7. Responsive design", "Same site on a phone: 2-column grid");
  await wait(2500);
  for (let i = 0; i < 3; i++) { await mp.mouse.wheel(0, 300); await wait(600); }
  await mp.goto(SITE + "/item/" + (await (await fetch(SITE + "/api/listings?q=bookshelf")).json()).listings[0].id,
    { waitUntil: "networkidle" });
  await caption(mp, "7. Responsive design", "Detail page on a phone");
  await wait(3000);
  await m.close();
  await browser.close();
  console.log("done", createdUrl);
})().catch((e) => { console.error(e); process.exit(1); });
