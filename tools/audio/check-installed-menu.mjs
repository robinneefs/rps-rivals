import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const loaded = [];
  const errors = [];
  page.on('response', (r) => {
    if (r.ok() && r.url().includes('/audio/music/')) loaded.push(r.url());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:5181/?review=menu-theme');
  await page.waitForFunction(() => window.__rps?.scenes().includes('Home'));
  await page.keyboard.press('ArrowUp'); // user gesture unlocks audio; remain on the menu
  await page.waitForFunction(() => window.__rps.music() === 'menu');
  if (!loaded.some((url) => url.endsWith('/menu-one-more-round.ogg'))) throw new Error('New menu not loaded');
  const durations = await page.evaluate(async () => {
    const context = new AudioContext({ sampleRate: 44100 });
    const results = [];
    for (const ext of ['ogg', 'mp3']) {
      const bytes = await (await fetch(`assets/audio/music/menu-one-more-round.${ext}`)).arrayBuffer();
      const buffer = await context.decodeAudioData(bytes);
      results.push({ ext, duration: buffer.duration, channels: buffer.numberOfChannels });
    }
    await context.close();
    return results;
  });
  if (durations.some((d) => Math.abs(d.duration - 45.7142857) > 0.03 || d.channels !== 2))
    throw new Error(JSON.stringify(durations));
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(
    'Production game loads/plays One More Round; both OGG and MP3 decode as stereo45.714s; no page errors.',
  );
} finally {
  await browser.close();
}
