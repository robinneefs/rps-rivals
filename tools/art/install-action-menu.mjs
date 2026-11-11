// Copy the reviewed native kit, without modifying its original sources or variants.
import { copyFileSync, mkdirSync } from 'node:fs';
const root = new URL('../../', import.meta.url);
const source = new URL('art/menus/action-v2/', root);
const target = new URL('apps/game/public/assets/menus/action/', root);
mkdirSync(target, { recursive: true });
for (const file of [
  'background-sheet.png',
  'background-sheet.json',
  'riot-sheet.png',
  'riot-sheet.json',
  'logo.png',
  'paint-streak.png',
  'labels.png',
  'labels.json',
  'arrow.png',
  'labels-spleen.png',
  'labels-spleen16.png',
  'labels-tamzen-bold.png',
  'labels-tamzen.png',
  'labels-m6x11.png',
  'menu-font.png',
  'menu-font.fnt',
])
  copyFileSync(new URL(`native/${file}`, source), new URL(file, target));
copyFileSync(new URL('manifest.json', source), new URL('manifest.json', target));
copyFileSync(new URL('art/fonts/pixelify-sans/OFL.txt', root), new URL('font-OFL.txt', target));
for (const [source, name] of [
  ['spleen/LICENSE', 'font-spleen-LICENSE.txt'],
  ['tamzen/LICENSE', 'font-tamzen-LICENSE.txt'],
  ['m6x11/ATTRIBUTION.txt', 'font-m6x11-ATTRIBUTION.txt'],
])
  copyFileSync(new URL(`art/fonts/${source}`, root), new URL(name, target));
