import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const out = 'art/fighters/taiko-alternate-cleanup';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5190/');
  const result = await page.evaluate(async () => {
    const { swapClothingPalette } = await import('/src/assets/alternatePalettes.ts');
    const image = new Image();
    image.src = '/assets/taiko.png';
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, image.width, image.height);
    swapClothingPalette(data.data, 'taiko', image.width);
    ctx.putImageData(data, 0, 0);
    const big = document.createElement('canvas');
    big.width = image.width * 3;
    big.height = image.height * 3;
    const bc = big.getContext('2d');
    bc.imageSmoothingEnabled = false;
    bc.fillStyle = '#626776';
    bc.fillRect(0, 0, big.width, big.height);
    bc.drawImage(canvas, 0, 0, big.width, big.height);
    return { native: canvas.toDataURL(), enlarged: big.toDataURL() };
  });
  const label = process.argv.includes('--before') ? 'before' : 'after';
  for (const [name, value] of Object.entries(result))
    writeFileSync(`${out}/${label}-${name}.png`, Buffer.from(value.split(',')[1], 'base64'));
} finally {
  await browser.close();
}
