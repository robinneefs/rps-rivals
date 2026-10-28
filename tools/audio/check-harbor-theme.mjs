import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [],
  results = [];
try {
  for (const [stage, expected] of [
    ['sunset-harbor', 'harbor'],
    ['storm-field', 'storm'],
    ['rooftop', 'fight'],
  ]) {
    const page = await browser.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => {
      if (r.status() >= 400) errors.push(r.url());
    });
    await page.goto(`http://127.0.0.1:5190/?menuReview=stage&stage=${stage}`);
    await page.waitForFunction(() => window.__rps?.scenes().includes('Fight'));
    await page.keyboard.press('Digit2');
    await page.waitForFunction((key) => window.__rps.music() === key, expected);
    results.push({ stage, music: await page.evaluate(() => window.__rps.music()) });
    if (expected === 'harbor') {
      const decoded = await page.evaluate(async () => {
        const context = new AudioContext();
        const result = [];
        for (const ext of ['ogg', 'mp3']) {
          const data = await context.decodeAudioData(
            await (await fetch(`assets/audio/music/stage-golden-hour.${ext}`)).arrayBuffer(),
          );
          result.push({ ext, duration: data.duration, channels: data.numberOfChannels });
        }
        await context.close();
        return result;
      });
      for (const file of decoded) {
        assert.equal(file.channels, 2);
        assert(Math.abs(file.duration - 53.3333) < 0.1);
      }
      results.push({ decoded });
    }
    await page.close();
  }
  assert.deepEqual(errors, []);
  writeFileSync(
    'art/audio/harbor-golden-hour-v1/browser-checks.json',
    JSON.stringify({ errors, results }, null, 2),
  );
  console.log(
    'Harbor/storm/rooftop theme selection and stereo OGG/MP3 decoding passed; no page or asset errors.',
  );
} finally {
  await browser.close();
}
