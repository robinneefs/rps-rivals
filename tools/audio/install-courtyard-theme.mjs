// Install the approved original Lantern Rush master in browser-compatible formats.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const source = fileURLToPath(
  new URL('../../art/audio/courtyard-lantern-rush-v1/lantern-rush.wav', import.meta.url),
);
for (const [ext, codec] of [
  ['ogg', ['-c:a', 'libvorbis', '-q:a', '5']],
  ['mp3', ['-c:a', 'libmp3lame', '-b:a', '160k']],
]) {
  const target = fileURLToPath(
    new URL(`../../apps/game/public/assets/audio/music/stage-lantern-rush.${ext}`, import.meta.url),
  );
  execFileSync(process.env.RPS_FFMPEG || 'ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-i',
    source,
    ...codec,
    '-metadata',
    'title=Lantern Rush',
    '-metadata',
    'artist=RPS Rivals',
    target,
  ]);
}
console.log('Installed Lantern Rush (OGG/MP3).');
