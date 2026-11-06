# Set: Café am Ocean Drive

Prozedurale 3D-Landschaft (Three.js) im Vice-Files-Stil: Nacht, Lila/Indigo,
Neon, Low-Poly, verpixelt, Hochformat 9:16. Die beiden Charaktere (die Blonde
und der Detektiv) sitzen als Blockfiguren an einem kleinen Bistrotisch mit
Kaffee und Tischlaterne auf der Terrasse eines Art-Deco-Cafés am Ocean Drive –
gegenüber Palmenpark, Strand und Meer mit Mond.

## Inhalt

| Bereich | Details |
|---|---|
| Häuserzeile | 7 Art-Deco-Gebäude in Pastell (Rosa, Mint, Lavendel, Zitrone …), Eyebrows, Bullaugen, Leuchtschilder |
| Café | „Ocean Café“-Neonschild, gestreifte Markise, beleuchtetes Interieur mit Theke & Regalen |
| Terrasse | Hero-Tisch (Marmor) mit 2 Rattan-Bistrostühlen, 2 Cappuccino mit Latte-Art + Dampf, Blumenvase, Menükarte, Zuckerhalter, Wasserglas; weitere Tische, Sonnenschirme, Pflanzkübel, Kordel, Kreidetafel |
| Straße | Ocean Drive mit doppelter Mittellinie, Parkbuchten, Retro-Cabrios, Art-Deco-Laternen |
| Park & Strand | Palmenreihe, geschwungener Weg, Korallenstein-Mauer, Strandschirme & Liegen, 2 Lifeguard-Türme |
| Meer | animierte Wellen, Schaumkante, Segelboot |
| Licht | Mondlicht, Sternenhimmel, Neon-Leuchtschilder mit Glow, Straßenlaternen, Lichterkette, flackernde Tischlaterne |
| Figuren | `characters.js`: A = Blonde (Haarreif, Jacke, Sneaker), B = Detektiv (Fedora, Trenchcoat) – sitzend, Mund-Varianten für Lip-Sync (`userData.setMouth(0/1/2)`), Kopf/Arme als Gruppen |
| LEDs | Neon-Leisten an jeder Etage, Dachkante und Gebäudekanten, leuchtende Turm-Finnen, Autos mit LED-Unterboden, Schein- und Rücklichtern; Bloom-Effekt (`?bloom=0` aus) |
| Menschen | `makeNPC()` in `characters.js`: Gäste an allen Nachbartischen (mit Tischlaternen), Leute an/in den Autos, 8 Passanten auf dem Gehweg (laufen animiert), Leute im Park & am Strand |
| Animation | Wellen, Kaffeedampf, Palmen im Wind, Fahne – alles über `update(t)` deterministisch |

## Ansehen

```bash
npm install
npm run serve
# -> http://localhost:8080/scenes/cafe-ocean-drive/
```

Oben links: Kamera-Presets, Platzhalter-Figuren ein/aus, GLB-Export.
URL-Parameter: `?cam=twoShot&hud=0&placeholders=0&t=3&w=1920&h=1080`

## Pixel-Look (unser Stil)

Standardmäßig an: Die Szene wird mit ~300 Pixelzeilen gerendert und scharf
(nearest neighbour) hochskaliert, mit dezenten Konturen und leicht
reduzierter Farbpalette.

- `?pixel=0` – aus (glatter Look)
- `?lowres=300` – Pixelauflösung; kleiner = gröber (z. B. `220`), größer = feiner (z. B. `400`)
- `?vignette=0.55` – dunkle Bildränder (0 = aus)
- `?levels=24` – Farbstufen pro Kanal; kleiner = stärker posterisiert

Beim Render-Skript: `--pixel 0|1`, `--lowres 300`.

## Kamera-Presets

- `CAMERAS` (Hochformat 9:16, Standard): `establishing`, `streetLife`, `aerial`, `terrace`,
  `twoShot`, `otsA`, `otsB`, `closeA`, `closeB`, `tableInsert`, `oceanView`
- `CAMERAS_WIDE` (16:9) – wird automatisch genutzt, wenn das Bild breiter als hoch ist

Vorschaubilder (1080×1920) in `previews/`.

## Charakter-Anker

A (Blonde) sitzt links, B (Detektiv) rechts. (`ANCHORS` in `scene.js`)

- **Figur A** (Platzhalter blau): Sitz `(-0.58, 0.47, -3.2)`, schaut nach +x
- **Figur B** (Platzhalter rot): Sitz `(0.58, 0.47, -3.2)`, schaut nach −x
- Tischplatte auf Höhe `0.75`, Tassen bei `cupA` / `cupB`, Augenhöhe `eyeA` / `eyeB`

Figuren ein-/ausblenden: `?placeholders=0` bzw. Button im Viewer.

## Rendern / Export

```bash
npm run render:cafe            # alle Previews (1080x1920) + export/cafe_ocean_drive.glb
node tools/render_set.mjs scenes/cafe-ocean-drive --w 1920 --h 1080 --no-glb   # Querformat
```

Die GLB-Datei (ohne Figuren, ohne Pixel-Effekt) lässt sich in Blender, Unity, Unreal usw. importieren.
