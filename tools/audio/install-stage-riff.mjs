// Encode the approved Ready to Rival master without overwriting earlier music.
// Set RPS_FFMPEG to an encoder executable if ffmpeg is not on PATH.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const source = new URL('../../art/audio/menu-riff-v1/menu-riff-v1.wav', import.meta.url);
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
    'title=Ready to Rival',
    '-metadata',
    'artist=RPS Rivals',
    fileURLToPath(new URL(`stage-ready-to-rival.${ext}`, destination)),
  ]);
}
console.log('Installed Ready to Rival as the stage theme (OGG/MP3).');
