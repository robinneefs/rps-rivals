// Makes the README's PLAY button (docs/readme/play-button.png) in the game's pixel font.
//
//   node tools/make-icons.mjs        (from the repository root; starts the Vite dev server)
//
// The browser icons, the link-share image, the Android launcher icons and splash screens and the
// Play Store icon and feature graphic are made by tools/art/prepare-brand-icons.py instead.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'docs/readme/play-button.png');
const port = 5176;

// Vite's own script, run with node: works on Windows (no npx shim) and kill() really stops it.
const vite = resolve(root, 'node_modules/vite/bin/vite.js');
const server = spawn(
  process.execPath,
  [vite, '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  {
    cwd: resolve(root, 'apps/game'),
    stdio: 'pipe',
  },
);
await new Promise((ok) => server.stdout.on('data', (d) => String(d).includes('Local') && ok()));

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/`);
  const url = await page.evaluate(async () => {
    const { palette } = await import('/src/config/palette.ts');
    const { PixelBuffer } = await import('/src/assets/placeholders/PixelBuffer.ts');
    // a pink arcade-style plate with PLAY NOW in the pixel font
    const label = 'PLAY NOW';
    const lw = new PixelBuffer(1, 1).textWidth(label);
    const pw = lw + 26;
    const ph = 19;
    const plate = new PixelBuffer(pw, ph + 4);
    plate.rect(1, 3, pw - 2, ph, palette.ink); // shadow under the plate
    plate.rect(0, 0, pw, ph, palette.ink);
    plate.rect(1, 1, pw - 2, ph - 2, 0xb01846);
    plate.rect(1, 1, pw - 2, ph - 5, palette.pink);
    plate.rect(2, 2, pw - 4, 1, 0xff8ad8);
    // a play triangle, then the label
    for (let i = 0; i < 4; i++) plate.rect(7 + i, 5 + i, 1, 7 - i * 2, palette.white);
    plate.text(label, 15, 5, palette.white, { shadow: palette.shadow });
    const pc = document.createElement('canvas');
    pc.width = plate.width;
    pc.height = plate.height;
    pc.getContext('2d').putImageData(new ImageData(plate.data, plate.width, plate.height), 0, 0);
    // scaled up by a whole number so the pixels stay sharp
    const play = document.createElement('canvas');
    play.width = plate.width * 4;
    play.height = plate.height * 4;
    const g = play.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(pc, 0, 0, play.width, play.height);
    return play.toDataURL('image/png');
  });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log(`wrote ${out.slice(root.length + 1)}`);
} finally {
  await browser.close();
  server.kill();
  process.exit(0);
}
