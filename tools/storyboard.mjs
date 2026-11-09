// Storyboard: rendert die ganze Folge als Bildercollage – schnell, ohne Video.
// Pro Szene ein Kameraplan von oben (roter Kameraweg + Blickrichtungen, blaue Punkte = Figuren)
// und Standbilder alle ~2 s sowie bei jeder Dialogzeile, Einblendung und Szene, beschriftet mit Zeit und Text.
//
//   node tools/storyboard.mjs scenes/pov-studio-7-tage [--every 2] [--w 360]
//
// Ausgabe: <scene>/storyboard/storyboard.png (alles) und shot-<n>.png (je Szene)
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath: funktioniert auch unter Windows (C:\...)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const sceneDir = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))) || 'scenes/pov-studio-7-tage';
const every = +opt('--every', 2);
const W = +opt('--w', 360), H = Math.round((W * 16) / 9);

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

// --gpu: Grafikkarte nutzen (am PC viel schneller); sonst Software-Rendering (läuft überall)
const browser = await chromium.launch({
  args: process.argv.includes('--gpu') ? ['--ignore-gpu-blocklist', '--enable-gpu'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => console.error('[page error]', e.message));
await page.goto(`http://localhost:${port}/${sceneDir}/index.html?w=${W}&h=${H}&t=0`);
await page.waitForFunction(() => window.__ready, null, { timeout: 180000 });
const S = await page.evaluate(() => window.__pov.script);

const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
const esc = (x) => String(x).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const shots = [];
for (const [i, shot] of S.SHOTS.entries()) {
  // Zeitpunkte: Szenenanfang, Raster, Dialogzeilen, Einblendungen
  const T = [shot.t0 + 0.6];
  for (let t = shot.t0 + every; t < shot.t1 - 0.4; t += every) T.push(t);
  for (const l of [...S.LINES, ...S.BOXES, ...S.TITLES]) if (l.t0 >= shot.t0 && l.t0 < shot.t1 - 0.3) T.push(l.t0 + 0.4);
  T.sort((a, b) => a - b);
  const times = T.filter((t, j) => j === 0 || t - T[j - 1] > 0.7);
  await page.evaluate((n) => window.__pov.renderPlan(n), i);
  const plan = (await page.screenshot({ type: 'jpeg', quality: 85 })).toString('base64');
  const frames = [];
  for (const t of times) {
    await page.evaluate((tt) => window.__pov.renderAt(tt), t);
    const img = (await page.screenshot({ type: 'jpeg', quality: 82 })).toString('base64');
    const line = S.LINES.find((l) => t >= l.t0 && t < l.t1);
    frames.push({ t, img, line });
  }
  shots.push({ i, shot, plan, frames });
  console.log(`Szene ${i + 1}: ${frames.length} Bilder`);
}

const cell = Math.round(W * 0.62);
const css = `
  body { margin: 0; background: #14161c; color: #e9ecf3; font: 14px Inter, system-ui, sans-serif; }
  h1 { margin: 0; padding: 22px 26px 6px; font-size: 26px; }
  .sub { padding: 0 26px 14px; color: #9aa3b5; }
  .shot { padding: 14px 26px 22px; border-top: 1px solid #2a2e38; }
  .shot h2 { margin: 0 0 10px; font-size: 18px; }
  .shot h2 span { color: #9aa3b5; font-weight: 500; }
  .row { display: flex; flex-wrap: wrap; gap: 10px; }
  .card { width: ${cell}px; }
  .card img { width: ${cell}px; height: ${Math.round((cell * 16) / 9)}px; display: block; border-radius: 6px; }
  .card.plan img { outline: 2px solid #ff2d55; }
  .cap { margin-top: 5px; font-size: 12px; line-height: 1.35; }
  .t { font-weight: 800; }
  .who { font-weight: 700; }`;
function sheet(list) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
  <h1>Storyboard · ${esc(path.basename(sceneDir))}</h1>
  <div class="sub">Rot umrandet = Kameraplan von oben (roter Weg/Pfeile = Kamera, blau = Figuren). Danach Standbilder mit Zeit und Dialog.</div>
  ${list.map(({ i, shot, plan, frames }) => `
  <div class="shot"><h2>Szene ${i + 1}: ${esc(shot.name || '')} <span>${fmt(shot.t0)} – ${fmt(shot.t1)}${shot.seated ? ' · sitzend' : ''}</span></h2>
    <div class="row">
      <div class="card plan"><img src="data:image/jpeg;base64,${plan}"><div class="cap"><span class="t">Kameraplan</span></div></div>
      ${frames.map((f) => `<div class="card"><img src="data:image/jpeg;base64,${f.img}"><div class="cap"><span class="t">${fmt(f.t)}</span>${f.line ? ` · <span class="who">${esc(f.line.who)}:</span> ${esc(f.line.text)}` : ''}</div></div>`).join('')}
    </div></div>`).join('')}
  </body></html>`;
}

const outDir = path.join(root, sceneDir, 'storyboard');
fs.mkdirSync(outDir, { recursive: true });
const view = await browser.newPage({ viewport: { width: 1800, height: 900 } });
await view.setContent(sheet(shots));
await view.screenshot({ path: path.join(outDir, 'storyboard.png'), fullPage: true });
for (const s of shots) {
  await view.setContent(sheet([s]));
  await view.screenshot({ path: path.join(outDir, `shot-${s.i + 1}.png`), fullPage: true });
}
console.log('fertig:', path.relative(root, path.join(outDir, 'storyboard.png')));
await browser.close();
server.close();
