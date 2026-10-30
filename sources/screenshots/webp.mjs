// Saves Playwright screenshots as WebP. The painted cabinet makes PNGs about 2 MB each; Chromium's
// own WebP encoder (quality 90) keeps them around 300 KB with no visible difference.
import { writeFileSync } from 'node:fs';

/** An encoder on its own blank page, so it never runs on a game page's fake clock. */
export async function webpSaver(browser) {
  const encoder = await browser.newPage();
  return async (page, path) => {
    const png = await page.screenshot();
    const webp = await encoder.evaluate(async (base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = Object.assign(document.createElement('canvas'), { width: image.width, height: image.height });
      canvas.getContext('2d').drawImage(image, 0, 0);
      const blob = await new Promise((done) => canvas.toBlob(done, 'image/webp', 0.9));
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = '';
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return btoa(binary);
    }, png.toString('base64'));
    writeFileSync(path, Buffer.from(webp, 'base64'));
  };
}
