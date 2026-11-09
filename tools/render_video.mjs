// Rendert eine POV-Szene Bild für Bild (inkl. Overlays/Untertitel) und baut daraus eine MP4.
//
//   node tools/render_video.mjs scenes/pov-serverraum [--w 720 --h 1280] [--fps 30]
//        [--out <datei.mp4>] [--from 0 --to <sek>] [--upscale 1080] [--voice <audio.wav>]
//   node tools/render_video.mjs scenes/pov-serverraum --stills 3,10,14   # nur Standbilder (PNG)
//
// Geräusche (Piepen, Alarm, Raumbrummen …) werden aus dem SFX-Array der Szene per ffmpeg erzeugt.
// --voice mischt eine fertige Sprachspur (z. B. aus ElevenLabs) dazu.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const sceneDir = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))) || 'scenes/pov-serverraum';
const W = +opt('--w', 720), H = +opt('--h', 1280), FPS = +opt('--fps', 30);
const upscale = +opt('--upscale', 1080);
const name = path.basename(sceneDir);
const out = path.resolve(opt('--out', path.join(root, sceneDir, 'out', `${name.replace(/-/g, '_')}.mp4`)));
const stills = opt('--stills', null);
const voice = opt('--voice', null);

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
await page.goto(`http://localhost:${port}/${sceneDir}/index.html?w=${W}&h=${H}&t=0`);
await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
const { duration, sfx } = await page.evaluate(() => ({ duration: window.__pov.duration, sfx: window.__pov.sfx }));

if (stills) {
  const dir = path.join(root, sceneDir, 'previews');
  fs.mkdirSync(dir, { recursive: true });
  for (const s of stills.split(',').map(Number)) {
    await page.evaluate((t) => window.__pov.renderAt(t), s);
    const file = path.join(dir, `t${String(s).replace('.', '_')}.png`);
    await page.screenshot({ path: file });
    console.log('still', path.relative(root, file));
  }
  await browser.close();
  server.close();
  process.exit(0);
}

const from = +opt('--from', 0), to = +opt('--to', duration);
const frames = Math.round((to - from) * FPS);

// ---- Geräusche als ffmpeg-Ausdruck
const parts = [];
for (const s of sfx) {
  const T = (s.t - from).toFixed(3);
  if (s.type === 'beep') parts.push(`0.22*sin(2*PI*1000*t)*between(t,${T},${T}+0.13)`);
  if (s.type === 'launch') parts.push(`0.28*sin(2*PI*1480*t)*between(t,${T},${T}+0.9)*exp(-(t-${T})*2.5)`);
  if (s.type === 'alarm') parts.push(`0.11*sin(2*PI*if(lt(mod(t,0.5),0.25),820,560)*t)*between(t,${T},${(s.until - from).toFixed(3)})`);
  if (s.type === 'buzz') parts.push(`0.22*sin(2*PI*170*t)*between(t,${T},${T}+0.55)*gt(sin(2*PI*11*t),0)`);
  if (s.type === 'ping') parts.push(`0.16*(sin(2*PI*1320*t)+0.6*sin(2*PI*1980*t))*between(t,${T},${T}+0.35)*exp(-(t-${T})*11)`);
  if (s.type === 'typing') parts.push(`0.35*(random(0)-0.5)*lt(mod(t*13+0.4*sin(t*5.3),1),0.07)*between(t,${T},${(s.until - from).toFixed(3)})`);
  if (s.type === 'tap') parts.push(`0.22*(random(0)-0.5)*lt(mod(t*5.5+0.3*sin(t*3.1),1),0.05)*between(t,${T},${(s.until - from).toFixed(3)})`);
  if (s.type === 'chime') for (const [i, f] of [523, 659, 784, 1047].entries()) parts.push(`0.13*sin(2*PI*${f}*t)*between(t,${T}+${i * 0.09},${T}+1.4)*exp(-(t-${T}-${i * 0.09})*2.2)`);
}
const sfxExpr = parts.length ? parts.join('+') : '0';
const whoosh = sfx.filter((s) => s.type === 'whoosh').map((s) => (s.t - from).toFixed(3));
const whooshVol = whoosh.length ? whoosh.map((T) => `between(t,${T},${T}+0.35)*sin(PI*(t-${T})/0.35)`).join('+') : '0';

fs.mkdirSync(path.dirname(out), { recursive: true });
const ff = [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-f', 'lavfi', '-i', `anoisesrc=color=brown:amplitude=0.6:sample_rate=48000:duration=${to - from}`,
  '-f', 'lavfi', '-i', `anoisesrc=color=pink:amplitude=0.3:sample_rate=48000:duration=${to - from}`,
  '-f', 'lavfi', '-i', `aevalsrc='${sfxExpr}':s=48000:d=${to - from}`,
  '-f', 'lavfi', '-i', `anoisesrc=color=white:amplitude=0.5:sample_rate=48000:duration=${to - from}`,
];
if (voice) ff.push('-i', voice);
const mix = [
  '[1]lowpass=f=160,volume=0.55[hum]',
  '[2]highpass=f=400,lowpass=f=2500,volume=0.05[fan]',
  '[3]volume=1[fx]',
  `[4]bandpass=f=900:width_type=o:w=2,volume='${whooshVol}':eval=frame,volume=0.6[wh]`,
];
const inputs = voice ? '[hum][fan][fx][wh][5]' : '[hum][fan][fx][wh]';
mix.push(`${inputs}amix=inputs=${voice ? 5 : 4}:normalize=0,afade=t=out:st=${to - from - 1.2}:d=1.2,alimiter=limit=0.9[a]`);
const vf = upscale && upscale !== W ? `scale=${upscale}:-2:flags=lanczos,format=yuv420p` : 'format=yuv420p';
ff.push('-filter_complex', `[0:v]${vf}[v];` + mix.join(';'), '-map', '[v]', '-map', '[a]',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-maxrate', '4M', '-bufsize', '8M', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '160k', '-shortest', out);

const proc = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((res, rej) => proc.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));
const t0 = Date.now();
for (let f = 0; f < frames; f++) {
  const t = from + f / FPS;
  await page.evaluate((tt) => window.__pov.renderAt(tt), t);
  const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
  if (!proc.stdin.write(buf)) await new Promise((r) => proc.stdin.once('drain', r));
  if (f % 30 === 0) {
    const el = (Date.now() - t0) / 1000;
    console.log(`frame ${f}/${frames}  ${(f / Math.max(el, 0.001)).toFixed(1)} fps  ~${Math.round(((frames - f) * el) / Math.max(f, 1))} s Rest`);
  }
}
proc.stdin.end();
await done;
await browser.close();
server.close();
console.log('fertig:', path.relative(root, out));
