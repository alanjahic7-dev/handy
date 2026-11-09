// Lädt die benötigten Figuren und Bewegungen aus der Microsoft-Rocketbox-Bibliothek (MIT-Lizenz)
// nach scenes/shared/assets/rocketbox/ und wandelt die TGA-Texturen in PNG (max. 1024 px) um.
//
//   node tools/fetch_rocketbox.mjs
//
// Benötigt curl und ffmpeg. Bereits vorhandene Dateien werden übersprungen.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'scenes/shared/assets/rocketbox');
const RAW = 'https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/master';

// Figur -> Texturen-Präfix (aus dem Rocketbox-Repo)
export const AVATARS = {
  Male_Adult_18: 'm023', // Tobi (Hoodie)
  Female_Adult_15: 'f018', // Mia (Producerin)
  Male_Adult_08: 'm014', // Chef (Hemd)
  Male_Adult_04: 'm006', // Kollege
  Male_Adult_16: 'm019', // Kollege
  Female_Adult_08: 'f008', // Kollegin
};

export const CLIPS = {
  static: [
    'm_idle_neutral_01', 'm_idle_look_around_01', 'm_gestic_talk_neutral_01', 'm_gestic_talk_excited_01',
    'm_gestic_talk_nervous_01', 'm_gestic_listen_angry_01', 'm_gestic_listen_deny_01', 'm_cheer_01', 'm_cheer_03',
    'm_cell_phone_textmessage', 'm_idle_yawn_01', 'm_drink_drinking', 'm_drink_idle',
    'm_sit_table_idle_neutral_01', 'm_sit_table_idle_look_around', 'm_sit_table_idle_yawn', 'm_sit_table_idle_scratch_head',
    'm_sit_table_idle_roll_head', 'm_work_table',
    'f_idle_neutral_01', 'f_gestic_talk_neutral_01', 'f_gestic_talk_self-assured_01', 'f_gestic_talk_excited_01',
    'f_sit_table_idle_neutral_01', 'f_cheer_01', 'f_work_table', 'f_documents_idle',
  ],
  xy: ['m_walk_neutral_01', 'm_walk_fast_01', 'f_walk_neutral_01'],
};

const get = (url, file) => {
  if (fs.existsSync(file) && fs.statSync(file).size > 0) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  execFileSync('curl', ['-sSfL', '--retry', '3', '-o', file, url]);
  return true;
};

for (const [name, pre] of Object.entries(AVATARS)) {
  const dir = path.join(out, 'avatars', name);
  get(`${RAW}/Assets/Avatars/Adults/${name}/Export/${name}.fbx`, path.join(dir, `${name}.fbx`));
  for (const tex of ['body_color', 'head_color', 'opacity_color']) {
    const png = path.join(dir, `${pre}_${tex}.png`);
    if (fs.existsSync(png)) continue;
    const tga = path.join(dir, `${pre}_${tex}.tga`);
    try {
      get(`${RAW}/Assets/Avatars/Adults/${name}/Textures/${pre}_${tex}.tga`, tga);
    } catch {
      continue; // nicht jede Figur hat eine Opacity-Textur
    }
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', tga, '-vf', "scale='min(1024,iw)':-1", png]);
    fs.rmSync(tga);
  }
  console.log('Figur', name);
}
for (const [folder, list] of Object.entries(CLIPS)) {
  for (const c of list) {
    get(`${RAW}/Assets/Animations/all_animations_max_motextr_${folder}/${c}.max.fbx`, path.join(out, 'clips', `${c}.fbx`));
  }
}
fs.copyFileSync(path.join(root, 'scenes/shared/assets/rocketbox-LICENSE.md'), path.join(out, 'LICENSE.md'));
console.log('fertig:', path.relative(root, out));
