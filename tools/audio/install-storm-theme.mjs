// Encode the original Storm Field master, preserving all existing music.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const source = new URL('../../art/audio/storm-theme-v2/under-the-storm.wav', import.meta.url);
const destination = new URL('../../apps/game/public/assets/audio/music/', import.meta.url);
mkdirSync(destination, { recursive: true });
for (const [ext, codec] of [
  ['ogg', ['-c:a', 'libvorbis', '-q:a', '5']],
  ['mp3', ['-c:a', 'libmp3lame', '-b:a', '160k']],
]) {
  execFileSync(process.env.RPS_FFMPEG || 'ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-i',
    fileURLToPath(source),
    ...codec,
    '-metadata',
    'title=Under the Storm',
    '-metadata',
    'artist=RPS Rivals',
    fileURLToPath(new URL(`stage-under-the-storm.${ext}`, destination)),
  ]);
}
console.log('Installed Under the Storm (OGG/MP3).');
