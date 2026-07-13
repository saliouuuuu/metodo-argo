// Export dual del master A3 → PDF desktop (A3 spread) + PDF mobile (A4 singola)
// Uso: node export.mjs  (genera entrambi in ../ scratchpad o accanto al master)
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const master = 'file://' + resolve(here, 'master-a3.html');
const out = process.argv[2] || here;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

// --- Desktop: A3 orizzontale, uno spread per pagina ---
let page = await browser.newPage();
await page.goto(master, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.pdf({ path: `${out}/Metodo-Argo-DESKTOP-A3.pdf`, width: '420mm', height: '297mm',
  printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
console.log('✔ desktop A3 →', `${out}/Metodo-Argo-DESKTOP-A3.pdf`);

// --- Mobile: A4 verticale, una faccia per pagina ---
page = await browser.newPage();
await page.goto(master + '?mode=mobile', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.pdf({ path: `${out}/Metodo-Argo-MOBILE-A4.pdf`, format: 'A4',
  printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
console.log('✔ mobile A4 →', `${out}/Metodo-Argo-MOBILE-A4.pdf`);

await browser.close();
