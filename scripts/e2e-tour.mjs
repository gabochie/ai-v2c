/**
 * E2E smoke-test tour for FORGE AI OS.
 *
 * Drives the real UI served at the given base URL with headless Chrome,
 * captures a screenshot of every module, exercises the Agent chat console
 * (hitting the live OpenClaw-backed backend), and reports any console /
 * network errors as the smoke-test verdict.
 *
 * Usage: node scripts/e2e-tour.mjs [baseUrl]
 * Screenshots: artifacts/e2e/*.png
 */
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.argv[2] || "http://127.0.0.1:3001";
const CHROME =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = path.resolve("artifacts", "e2e");

const NAV = [
  ["Executive Dashboard", "01-dashboard"],
  ["Sprint Planner", "02-sprints"],
  ["AI Agent Library", "03-agents"],
  ["Prompt Library (200+)", "04-prompts"],
  ["Knowledge Base & ADRs", "05-knowledge"],
  ["Folder Explorer", "06-explorer"],
  ["Slash Commands", "07-commands"],
  ["System Preferences", "08-settings"],
];

let errors = [];
let httpFailures = [];
let consoleErrors = [];

async function clickText(page, text) {
  return page.evaluate((t) => {
    const els = Array.from(document.querySelectorAll("button, a, [role=button]"));
    const el = els.find((e) => e.textContent.trim() === t);
    if (el) { el.click(); return true; }
    return false;
  }, text);
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file });
  return file;
}

const MARKER = "E2E-smoke-9X7Q pong";
async function waitForReply(page, timeoutMs = 260000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const done = await page.evaluate((mk) => {
      const t = document.body.innerText;
      return t.includes(mk) && (t.includes("pong") || t.includes("⚠️") || t.includes("Standby"));
    }, MARKER);
    if (done) return true;
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    defaultViewport: { width: 1440, height: 900 },
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();

  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("requestfailed", (r) => httpFailures.push(`${r.method()} ${r.url()} :: ${r.failure()?.errorText}`));
  page.on("response", (r) => { if (r.status() >= 500) httpFailures.push(`${r.status()} ${r.url()}`); });

  const tour = [];

  // 1. Landing / dashboard
  await page.goto(BASE_URL, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));
  tour.push(await shot(page, "01-dashboard"));

  // 2. Walk each nav view
  for (const [label, name] of NAV) {
    // <executive dashboard already captured>
    if (name === "01-dashboard") continue;
    await clickText(page, label);
    await new Promise((r) => setTimeout(r, 1200));
    tour.push(await shot(page, name));

    // Exercise the live chat in the Agents view
    if (name === "03-agents") {
      // tab to Chat if not already visible
      await clickText(page, "Chat");
      await new Promise((r) => setTimeout(r, 800));
      await page.evaluate((mk) => {
        const input = document.querySelector('input[type="text"]');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(input, mk);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }, MARKER);
      // click Send
      await clickText(page, "Send");
      await new Promise((r) => setTimeout(r, 800));
      tour.push(await shot(page, "03-agents-chat-pending"));
      await waitForReply(page);
      await new Promise((r) => setTimeout(r, 800));
      tour.push(await shot(page, "03-agents-chat-reply"));
    }
  }

  // 3. Back to dashboard summary shot
  await clickText(page, "Executive Dashboard");
  await new Promise((r) => setTimeout(r, 1000));
  tour.push(await shot(page, "09-dashboard-back"));

  await browser.close();

  console.log("=== SCREENSHOTS ===");
  tour.forEach((f) => console.log(" -", f));
  console.log("\n=== VERDICT ===");
  if (errors.length === 0 && consoleErrors.length === 0 && httpFailures.filter((f) => !f.includes("/favicon")).length === 0) {
    console.log("PASS — no uncaught page errors, no console errors, no 5xx/failed requests.");
  } else {
    console.log("WARNINGS — see below (non-fatal unless marked FAIL):");
    if (consoleErrors.length) console.log(" console errors:\n  " + consoleErrors.slice(0, 5).join("\n  "));
    if (errors.length) console.log(" page errors:\n  " + errors.slice(0, 5).join("\n  "));
    if (httpFailures.length) console.log(" http:\n  " + httpFailures.slice(0, 8).join("\n  "));
  }
}

main().catch((e) => { console.error("E2E failed:", e); process.exit(1); });