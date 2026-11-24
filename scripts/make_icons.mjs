// Usage: node make_icons.mjs <art.webp|png or "-"> <outDir/icons> [label]
// Renders app icons (512, 192, 180 apple-touch, maskable 512) with Playwright.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(process.cwd() + '/');
const { chromium } = require('playwright');
const [art, outDir, label = '✈'] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const img = art && art !== '-' && fs.existsSync(art) ? `data:image/${art.endsWith('.png') ? 'png' : 'webp'};base64,` + fs.readFileSync(art).toString('base64') : null;
const browser = await chromium.launch();
for (const [name, sz, pad] of [['icon-512', 512, .16], ['icon-192', 192, .16], ['apple-touch-icon', 180, .14], ['maskable-512', 512, .24]]) {
  const p = await browser.newPage({ viewport: { width: sz, height: sz } });
  const inner = img
    ? `<img src="${img}" style="position:absolute;left:${sz*pad}px;top:${sz*pad}px;width:${sz*(1-2*pad)}px;height:${sz*(1-2*pad)}px;border-radius:50%;box-shadow:0 0 0 ${sz*.025}px #fff">`
    : `<div style="position:absolute;left:${sz*pad}px;top:${sz*pad}px;width:${sz*(1-2*pad)}px;height:${sz*(1-2*pad)}px;border-radius:50%;background:#fff;display:grid;place-items:center;font:800 ${sz*.32}px system-ui;color:#22306B">${label}</div>`;
  await p.setContent(`<body style="margin:0"><div style="width:${sz}px;height:${sz}px;background:#22306B;position:relative;overflow:hidden">
    <div style="position:absolute;width:${sz*1.1}px;height:${sz*1.1}px;border-radius:50%;background:#2E3D82;right:-${sz*.45}px;bottom:-${sz*.55}px"></div>${inner}
    <div style="position:absolute;width:${sz*.13}px;height:${sz*.13}px;border-radius:50%;background:#E5708F;right:${sz*pad*.55}px;top:${sz*pad*.55}px;box-shadow:0 0 0 ${sz*.018}px #22306B"></div></div></body>`);
  await p.waitForTimeout(150);
  await p.screenshot({ path: `${outDir}/${name}.png` });
}
await browser.close();
console.error('icons written to', outDir);
