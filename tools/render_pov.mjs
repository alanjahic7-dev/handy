// Rendert eine POV-Episode als TikTok-Video (1080x1920, 30 fps, mit Geräuschen) oder Standbilder.
//
//   node tools/render_pov.mjs [scene-dir] [--ep episode] [--out datei.mp4] [--fps 30]
//                             [--w 1080 --h 1920] [--from 0 --to 70] [--look comic|pixel]
//                             [--stills 0,10,25]   # nur Standbilder -> <scene-dir>/previews/
//
// Braucht ffmpeg im PATH.
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const sceneDir = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))) || 'scenes/pov-release-day';
const epName = opt('--ep', 'episode');
const W = +opt('--w', 1080), H = +opt('--h', 1920), fps = +opt('--fps', 30);
const look = opt('--look', 'comic');
const stills = opt('--stills');

const { default: ep } = await import(pathToFileURL(path.join(root, sceneDir, `${epName}.js`)));
const { soundEvents } = await import(pathToFileURL(path.join(root, sceneDir, 'timeline.js')));
const from = +opt('--from', 0), to = +opt('--to', ep.duration);

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
await page.goto(`http://localhost:${port}/${sceneDir}/index.html?hud=0&t=${from}&w=${W}&h=${H}&ep=${epName}&look=${look}`);
await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
const stage = page.locator('#stage');

if (stills) {
  const outDir = path.join(root, sceneDir, 'previews');
  fs.mkdirSync(outDir, { recursive: true });
  for (const s of stills.split(',').map(Number)) {
    await page.evaluate((x) => window.__pov.renderAt(x), s - 0.1);
    await page.evaluate((x) => window.__pov.renderAt(x), s);
    const file = path.join(outDir, `t${String(s).replace('.', '_').padStart(2, '0')}.png`);
    await stage.screenshot({ path: file });
    console.log('still', path.relative(root, file));
  }
  await browser.close();
  server.close();
  process.exit(0);
}

// ---- Ton: Vibration, Chat-Pop, Senden, Schnitt-Wusch, Glocke, Abschluss-Sting + Raumton
function makeAudio(file, dur) {
  const sr = 44100, n = Math.ceil(dur * sr);
  const buf = new Float32Array(n);
  let seed = 1;
  const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  // Büro-Raumton (gefiltertes Rauschen)
  let lp = 0;
  for (let i = 0; i < n; i++) { lp += (noise() - lp) * 0.02; buf[i] += lp * 0.05; }
  const add = (t0, len, fn) => {
    const s0 = Math.floor((t0 - from) * sr);
    for (let i = 0; i < len * sr; i++) { const k = s0 + i; if (k >= 0 && k < n) buf[k] += fn(i / sr); }
  };
  const env = (x, a, d) => Math.min(1, x / a) * Math.exp(-x / d);
  for (const e of soundEvents(ep)) {
    if (e.t < from || e.t > to) continue;
    if (e.type === 'buzz') for (const o of [0, 0.22]) add(e.t + o, 0.16, (x) => Math.sin(2 * Math.PI * 165 * x) * Math.sign(Math.sin(2 * Math.PI * 35 * x)) * 0.35 * Math.min(1, x / 0.01, (0.16 - x) / 0.02));
    if (e.type === 'pop') add(e.t, 0.12, (x) => Math.sin(2 * Math.PI * (900 - 3000 * x) * x) * env(x, 0.003, 0.03) * 0.35);
    if (e.type === 'send') add(e.t, 0.18, (x) => Math.sin(2 * Math.PI * (500 + 2500 * x) * x) * env(x, 0.003, 0.05) * 0.3);
    if (e.type === 'cut') add(e.t - 0.1, 0.35, (x) => noise() * Math.sin(Math.PI * x / 0.35) * 0.18);
    if (e.type === 'bell') for (const [f, a] of [[880, 0.3], [1320, 0.15], [2200, 0.08]]) add(e.t, 2, (x) => Math.sin(2 * Math.PI * f * x) * env(x, 0.002, 0.6) * a);
    if (e.type === 'alarm') for (let k = 0; k < 6; k++) add(e.t + k * 0.28, 0.2, (x) => Math.sign(Math.sin(2 * Math.PI * (k % 2 ? 1320 : 1760) * x)) * 0.12 * Math.min(1, x / 0.005, (0.2 - x) / 0.02));
    if (e.type === 'boom') {
      add(e.t, 1.6, (x) => Math.sin(2 * Math.PI * (70 - 30 * x) * x) * env(x, 0.005, 0.5) * 0.7);
      for (const f of [220, 277.2, 329.6, 440]) add(e.t + 0.05, 2.5, (x) => Math.sin(2 * Math.PI * f * x) * env(x, 0.08, 1.2) * 0.12);
    }
    if (e.type === 'press') add(e.t, 0.05, (x) => noise() * env(x, 0.001, 0.008) * 0.5);
    if (e.type === 'sting') for (const f of [110, 164.8, 220, 277.2]) add(e.t, 2.4, (x) => Math.sin(2 * Math.PI * f * x + Math.sin(2 * Math.PI * 5 * x) * 0.3) * env(x, 0.05, 0.9) * 0.16);
  }
  const pcm = Buffer.alloc(44 + n * 2);
  pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + n * 2, 4); pcm.write('WAVEfmt ', 8);
  pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(sr, 24); pcm.writeUInt32LE(sr * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34);
  pcm.write('data', 36); pcm.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) pcm.writeInt16LE(Math.max(-1, Math.min(1, buf[i])) * 32767, 44 + i * 2);
  fs.writeFileSync(file, pcm);
}

const outFile = path.resolve(root, opt('--out', path.join(sceneDir, 'export', `${ep.id}.mp4`)));
fs.mkdirSync(path.dirname(outFile), { recursive: true });
const wav = outFile.replace(/\.mp4$/, '.wav');
makeAudio(wav, to - from);

const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-i', wav,
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', outFile],
{ stdio: ['pipe', 'inherit', 'inherit'] });

const frames = Math.round((to - from) * fps);
const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  const t = from + i / fps;
  await page.evaluate((x) => window.__pov.renderAt(x), t);
  const jpg = await stage.screenshot({ type: 'jpeg', quality: 92 });
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % fps === 0) {
    const el = (Date.now() - t0) / 1000;
    process.stdout.write(`\rFrame ${i}/${frames}  ${(el / (i + 1) * (frames - i) / 60).toFixed(1)} min übrig   `);
  }
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
fs.unlinkSync(wav);
console.log('\nvideo', path.relative(root, outFile));
await browser.close();
server.close();
