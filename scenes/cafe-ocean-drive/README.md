# Set: Café am Ocean Drive

Prozedurale 3D-Landschaft (Three.js): Zwei Charaktere sitzen an einem kleinen
Bistrotisch mit Kaffee auf der Terrasse eines Art-Deco-Cafés am Ocean Drive –
gegenüber Palmenpark, Strand mit Rettungsschwimmer-Türmen und Atlantik.

## Inhalt

| Bereich | Details |
|---|---|
| Häuserzeile | 7 Art-Deco-Gebäude in Pastell (Rosa, Mint, Lavendel, Zitrone …), Eyebrows, Bullaugen, Leuchtschilder |
| Café | „Ocean Café“-Neonschild, gestreifte Markise, beleuchtetes Interieur mit Theke & Regalen |
| Terrasse | Hero-Tisch (Marmor) mit 2 Rattan-Bistrostühlen, 2 Cappuccino mit Latte-Art + Dampf, Blumenvase, Menükarte, Zuckerhalter, Wasserglas; weitere Tische, Sonnenschirme, Pflanzkübel, Kordel, Kreidetafel |
| Straße | Ocean Drive mit doppelter Mittellinie, Parkbuchten, Retro-Cabrios, Art-Deco-Laternen |
| Park & Strand | Palmenreihe, geschwungener Weg, Korallenstein-Mauer, Strandschirme & Liegen, 2 Lifeguard-Türme |
| Meer | animierte Wellen, Schaumkante, Segelboot |
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

Standardmäßig an: Die Szene wird mit ~270 Pixelzeilen gerendert und scharf
(nearest neighbour) hochskaliert, mit dezenten Konturen und leicht
reduzierter Farbpalette.

- `?pixel=0` – aus (glatter Look)
- `?lowres=270` – Pixelauflösung; kleiner = gröber (z. B. `200`), größer = feiner (z. B. `360`)
- `?levels=28` – Farbstufen pro Kanal; kleiner = stärker posterisiert

Beim Render-Skript: `--pixel 0|1`, `--lowres 270`.

## Kamera-Presets (`CAMERAS` in `scene.js`)

`aerial`, `establishing`, `street`, `terrace`, `twoShot`, `otsA`, `otsB`,
`closeA`, `closeB`, `tableInsert`, `oceanView` – Vorschaubilder in `previews/`.

## Charakter-Anker (`ANCHORS` in `scene.js`)

- **Figur A** (Platzhalter blau): Sitz `(-0.58, 0.47, -3.2)`, schaut nach +x
- **Figur B** (Platzhalter rot): Sitz `(0.58, 0.47, -3.2)`, schaut nach −x
- Tischplatte auf Höhe `0.75`, Tassen bei `cupA` / `cupB`, Augenhöhe `eyeA` / `eyeB`

Die Platzhalter-Figuren (`CharacterPlaceholders`) markieren nur Position,
Größe und Blickrichtung und werden durch die echten Charaktere ersetzt.

## Rendern / Export

```bash
npm run render:cafe            # alle Previews (1920x1080) + export/cafe_ocean_drive.glb
node tools/render_set.mjs scenes/cafe-ocean-drive --w 1280 --h 720 --no-glb
```

Die GLB-Datei (ohne Platzhalter) lässt sich in Blender, Unity, Unreal usw. importieren.
