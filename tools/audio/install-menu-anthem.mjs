// Encode the approved master as browser delivery files. Old music remains intact.
// RPS_FFMPEG=/path/to/ffmpeg node tools/audio/install-menu-anthem.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const source = new URL('../../art/audio/menu-anthem-v1/menu-anthem-v1.wav', import.meta.url);
const destination = new URL('../../apps/game/public/assets/audio/music/', import.meta.url);
mkdirSync(destination, { recursive: true });
const encoder = process.env.RPS_FFMPEG || 'ffmpeg';
for (const [ext, codec] of [
  ['ogg', ['-c:a', 'libvorbis', '-q:a', '5']],
  ['mp3', ['-c:a', 'libmp3lame', '-b:a', '160k']],
]) {
  execFileSync(encoder, [
    '-y',
    '-loglevel',
    'error',
    '-i',
    fileURLToPath(source),
    ...codec,
    '-metadata',
    'title=One More Round',
    '-metadata',
    'artist=RPS Rivals',
    fileURLToPath(new URL(`menu-one-more-round.${ext}`, destination)),
  ]);
}
writeFileSync(
  new URL('installed.json', new URL('../../art/audio/menu-anthem-v1/', import.meta.url)),
  JSON.stringify(
    {
      title: 'One More Round',
      key: 'music.menu',
      master: 'menu-anthem-v1.wav',
      files: ['menu-one-more-round.ogg', 'menu-one-more-round.mp3'],
      originalMenuPreserved: true,
    },
    null,
    2,
  ),
);
console.log('Installed One More Round as OGG/MP3; original menu and fight music preserved.');
