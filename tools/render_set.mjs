// Rendert Vorschaubilder aller Kamera-Presets und exportiert das Set als GLB.
//
//   node tools/render_set.mjs [scene-dir] [--w 1920 --h 1080] [--no-glb] [--placeholders 0|1]
//                             [--pixel 0|1] [--lowres 270]
//
// Ausgabe: <scene-dir>/previews/*.png und <scene-dir>/export/<name>.glb
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const sceneDir = args.find((a) => !a.startsWith('--') && !/^\d+$/.test(a)) || 'scenes/cafe-ocean-drive';
const W = +opt('--w', 1080), H = +opt('--h', 1920);
const placeholders = opt('--placeholders', '1');
const pixel = opt('--pixel', '1');
const lowres = opt('--lowres', '300');

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('console', (m) => m.type() === 'error' && console.error('[page]', m.text()));
page.on('pageerror', (e) => console.error('[page error]', e.message));
await page.goto(`http://localhost:${port}/${sceneDir}/index.html?hud=0&t=2&w=${W}&h=${H}&placeholders=${placeholders}&pixel=${pixel}&lowres=${lowres}`);
await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });

const camNames = await page.evaluate(async () => Object.keys(innerWidth < innerHeight ? (await import('./scene.js')).CAMERAS : (await import('./scene.js')).CAMERAS_WIDE));

const outDir = path.join(root, sceneDir, 'previews');
fs.mkdirSync(outDir, { recursive: true });
for (const name of camNames) {
  await page.evaluate((n) => window.__set.renderAt(2, n), name);
  const file = path.join(outDir, `${name}.png`);
  await page.locator('canvas').screenshot({ path: file });
  console.log('render', path.relative(root, file));
}

if (!args.includes('--no-glb')) {
  await page.evaluate(() => window.__set.showPlaceholders(false));
  const bytes = await page.evaluate(() => window.__set.exportGLB());
  const exportDir = path.join(root, sceneDir, 'export');
  fs.mkdirSync(exportDir, { recursive: true });
  const file = path.join(exportDir, `${path.basename(sceneDir).replace(/-/g, '_')}.glb`);
  fs.writeFileSync(file, Buffer.from(bytes));
  console.log('glb', path.relative(root, file), (bytes.length / 1e6).toFixed(1), 'MB');
}

await browser.close();
server.close();
