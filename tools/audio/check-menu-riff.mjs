import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:5183/art/audio/menu-riff-v1/preview.html');
  await page.waitForFunction(() => document.querySelector('#new').readyState >= 3);
  const decoded = await page.evaluate(async () => {
    const context = new AudioContext({ sampleRate: 44100 });
    const data = await context.decodeAudioData(await (await fetch('menu-riff-v1.wav')).arrayBuffer());
    const result = { channels: data.numberOfChannels, duration: data.duration, rate: data.sampleRate };
    await context.close();
    return result;
  });
  if (decoded.channels !== 2 || decoded.duration !== 48 || decoded.rate !== 44100)
    throw new Error(`Unexpected audio: ${JSON.stringify(decoded)}`);
  await page.getByRole('button', { name: '0:24 Arpeggio bridge' }).click();
  await page.waitForFunction(() => {
    const song = document.querySelector('#new');
    return !song.paused && song.currentTime > 24;
  });
  await page.evaluate(() => document.querySelector('#original').play());
  if (!(await page.locator('#new').evaluate((el) => el.paused))) throw new Error('Comparison overlaps');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(
    'WAV decoded: stereo 44.1kHz / 48s; section seek/play and original comparison work; no page errors.',
  );
} finally {
  await browser.close();
}
