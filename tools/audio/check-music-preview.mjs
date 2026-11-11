import { chromium } from '@playwright/test';
const folder = process.argv[2] ?? 'menu-rock-v1';
if (!/^menu-[a-z]+-v\d+$/.test(folder)) throw new Error('Unknown preview folder');
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:5183/art/audio/${folder}/preview.html`);
  const result = await page.evaluate(async () => {
    const report = await (await fetch('track.json')).json();
    const song = document.querySelector('#new');
    const bytes = await (await fetch(song.src)).arrayBuffer();
    const context = new AudioContext({ sampleRate: 44100 });
    const data = await context.decodeAudioData(bytes);
    await context.close();
    return { seconds: data.duration, channels: data.numberOfChannels, report };
  });
  if (Math.abs(result.seconds - result.report.durationSeconds) > 0.001 || result.channels !== 2)
    throw new Error('Audio does not match report');
  if (result.report.peakDbFS > -1 || result.report.seamSampleDelta.some((x) => x > 0.005))
    throw new Error('Peak/seam check failed');
  await page.locator('[data-time]').nth(2).click();
  await page.waitForFunction(() => {
    const audio = document.querySelector('#new');
    return !audio.paused && audio.currentTime > 22;
  });
  await page.evaluate(() => document.querySelector('#original').play());
  if (!(await page.locator('#new').evaluate((el) => el.paused))) throw new Error('Comparison overlaps');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(
    `${result.report.title}: decoded stereo, seek/play/comparison passed, peak/seam passed; no page errors.`,
  );
} finally {
  await browser.close();
}
