// Capture real Phaser/cabinet/CRT views, including every provisional stat and fighter.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const folder = 'art/menus/character-select-v1';
mkdirSync(folder, { recursive: true });
const expected = {
  taiko: { rock: 15, paper: 10, scissors: 20, hp: 50 },
  riot: { rock: 10, paper: 20, scissors: 15, hp: 50 },
  anchor: { rock: 20, paper: 15, scissors: 10, hp: 55 },
};
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [],
  failures = [],
  checks = [];
const saveData = (file, data) =>
  writeFileSync(`${folder}/${file}`, Buffer.from(data.split(',')[1], 'base64'));
try {
  for (const phone of [false, true]) {
    for (const layout of ['lineup', 'hero', 'versus']) {
      const page = await browser.newPage({
        viewport: phone ? { width: 390, height: 664 } : { width: 600, height: 1000 },
        hasTouch: phone,
        isMobile: phone,
        reducedMotion: 'reduce',
      });
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('response', (r) => {
        if (r.status() >= 400) failures.push(r.url());
      });
      await page.addInitScript(() =>
        localStorage.setItem('rps-fighter.settings', JSON.stringify({ crt: true })),
      );
      await page.goto(`http://127.0.0.1:5184/?characterReview=${layout}&fighter=taiko`);
      await page.waitForFunction(() => Boolean(window.__characterMockup));
      await page.keyboard.press('Backquote');
      for (const [index, fighter] of ['taiko', 'riot', 'anchor'].entries()) {
        if (index) {
          if (phone) {
            const box = await page.locator('#game canvas').boundingBox();
            let x, y;
            if (layout === 'hero') {
              x = 39 + index * 56;
              y = 141;
            } else if (layout === 'versus') {
              x = 95;
              y = 64 + index * 28;
            } else {
              x = index === 1 ? 97 : 153;
              y = 95;
            }
            await page.touchscreen.tap(box.x + (box.width * x) / 192, box.y + (box.height * y) / 240);
          } else await page.keyboard.press('ArrowRight');
        }
        await page.waitForFunction((id) => window.__characterMockup.state().selected === id, fighter);
        await page.waitForTimeout(150);
        const state = await page.evaluate(() => window.__characterMockup.state());
        if (JSON.stringify(state.stats) !== JSON.stringify(expected[fighter]))
          throw Error(`Wrong stats for ${layout}/${fighter}`);
        if (!state.crt || !state.shader || JSON.stringify(state.nativeSize) !== '[192,240]')
          throw Error('Native CRT preview not active');
        for (const text of state.texts) {
          if (
            text.fontSize !== 16 ||
            text.scaleX !== 1 ||
            text.scaleY !== 1 ||
            !Number.isInteger(text.x) ||
            !Number.isInteger(text.y)
          )
            throw Error(`Non-native text ${JSON.stringify(text)}`);
          if (text.x < 6 || text.x + text.width > 184) throw Error(`Clipped text ${JSON.stringify(text)}`);
        }
        for (const label of ['ROCK', 'PAPER', 'SCISSORS', 'HP']) {
          const t = state.texts.find((t) => t.text === label),
            value = state.texts.find((v) => v.y === t?.y && /^\d+$/.test(v.text) && v.x > t.x);
          if (!t || !value || t.x + t.width > value.x - 2)
            throw Error(`Stats overlap: ${layout}/${fighter}/${label}`);
        }
        if (!phone) {
          const native = await page.evaluate(() => window.__characterMockup.captureNative());
          saveData(`${layout}-${fighter}-native.png`, native);
          const enlarged = await page.evaluate(async (data) => {
            const image = new Image();
            image.src = data;
            await image.decode();
            if (image.width !== 192 || image.height !== 240) throw Error('Wrong native capture size');
            const canvas = document.createElement('canvas');
            canvas.width = 768;
            canvas.height = 960;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(image, 0, 0, 768, 960);
            return canvas.toDataURL();
          }, native);
          saveData(`${layout}-${fighter}-4x.png`, enlarged);
        }
        await page.screenshot({ path: `${folder}/${layout}-${fighter}-${phone ? 'phone' : 'cabinet'}.png` });
        if (fighter === 'riot')
          await page.screenshot({ path: `${folder}/${layout}-${phone ? 'phone' : 'cabinet'}.png` });
        checks.push({
          layout,
          fighter,
          touch: phone,
          stats: state.stats,
          crt: state.crt,
          shader: state.shader,
        });
      }
      // Buttons give feedback only. No game session or fight may be created by this study.
      await page.keyboard.press('Enter');
      if (await page.evaluate(() => window.__rps.scenes().includes('Fight')))
        throw Error('Mockup started gameplay');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => window.__rps.scenes().includes('Home'));
      await page.close();
    }
  }
  if (errors.length || failures.length) throw Error(JSON.stringify({ errors, failures }));
  writeFileSync(
    `${folder}/checks.json`,
    JSON.stringify({ provisional: true, errors, failedAssets: failures, checks }, null, 2),
  );
  console.log(
    `Passed ${checks.length} layout/fighter/device checks: exact stats, no clipping/overlap, native type, current CRT, touch/keyboard selection, no gameplay.`,
  );
} finally {
  await browser.close();
}
