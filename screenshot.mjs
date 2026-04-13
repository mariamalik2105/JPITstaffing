import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

const screenshotsDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

// Find next available N
let n = 1;
while (fs.existsSync(path.join(screenshotsDir, label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`))) n++;
const filename = label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`;
const outPath = path.join(screenshotsDir, filename);

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: (() => {
    // Try multiple common Chrome locations
    const candidates = [
      'C:/Users/nateh/.cache/puppeteer/chrome/win64-131.0.6778.85/chrome-win64/chrome.exe',
      'C:/Users/maria/.cache/puppeteer/chrome/win64-131.0.6778.85/chrome-win64/chrome.exe',
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return undefined; // let puppeteer find it
  })(),
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
// Scroll through entire page to trigger IntersectionObservers
await page.evaluate(async () => {
  const totalHeight = document.body.scrollHeight;
  const step = 600;
  for (let y = 0; y <= totalHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 80));
  }
  window.scrollTo(0, 0);
});
await new Promise(r => setTimeout(r, 600)); // let final animations settle
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: temporary screenshots/${filename}`);
