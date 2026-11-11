// Install the approved original Pressure Point master in browser-compatible formats.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const source = fileURLToPath(
  new URL('../../art/audio/foundry-pressure-point-v1/pressure-point.wav', import.meta.url),
);
for (const [ext, codec] of [
  ['ogg', ['-c:a', 'libvorbis', '-q:a', '5']],
  ['mp3', ['-c:a', 'libmp3lame', '-b:a', '160k']],
]) {
  const target = fileURLToPath(
    new URL(`../../apps/game/public/assets/audio/music/stage-pressure-point.${ext}`, import.meta.url),
  );
  execFileSync(process.env.RPS_FFMPEG || 'ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-i',
    source,
    ...codec,
    '-metadata',
    'title=Pressure Point',
    '-metadata',
    'artist=RPS Rivals',
    target,
  ]);
}
console.log('Installed Pressure Point (OGG/MP3).');
