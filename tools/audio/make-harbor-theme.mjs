// Original preview-only composition. No production music files are touched.
import { mkdirSync, writeFileSync } from 'node:fs';
import { Buffer32, hz, playDrums, playLine, steps, voice } from './synth.mjs';
import { stereoMix } from './music-mix.mjs';

const out = new URL('../../art/audio/harbor-golden-hour-v1/', import.meta.url);
mkdirSync(out, { recursive: true });
const bpm = 144,
  bars = 32,
  sr = 44100;
const step = 60 / bpm / 4,
  duration = bars * 16 * step;
const tracks = Object.fromEntries(
  ['lead', 'answer', 'keys', 'bass', 'bells', 'drums'].map((name) => [name, new Buffer32(sr, duration + 3)]),
);
const chords = {
  Am7: ['A2', 'C4', 'E4', 'G4'],
  Dm7: ['D3', 'F4', 'A4', 'C5'],
  Fmaj7: ['F2', 'A3', 'C4', 'E4'],
  G6: ['G2', 'B3', 'D4', 'E4'],
  Cmaj7: ['C3', 'E4', 'G4', 'B4'],
  E7: ['E2', 'G#3', 'B3', 'D4'],
  Em7: ['E2', 'G3', 'B3', 'D4'],
  Bm7b5: ['B2', 'D4', 'F4', 'A4'],
};
const changes = [
  'Am7',
  'Dm7',
  'Fmaj7',
  'G6',
  'Am7',
  'Cmaj7',
  'Dm7',
  'E7',
  'Am7',
  'Dm7',
  'Fmaj7',
  'G6',
  'Am7',
  'Cmaj7',
  'Dm7',
  'E7',
  'Fmaj7',
  'G6',
  'Em7',
  'Am7',
  'Dm7',
  'Cmaj7',
  'Bm7b5',
  'E7',
  'Am7',
  'Dm7',
  'Fmaj7',
  'G6',
  'Am7',
  'Cmaj7',
  'Dm7',
  'E7',
];
// A short upbeat pickup answers a descending three-note phrase; leave space for the groove.
const hook = [
  '. E5 - . A5 - G5 E5 . C5 - D5 E5 - . .',
  '. F5 - . E5 D5 - . A4 - C5 D5 . E5 F5 -',
  '. E5 - . C5 - A4 C5 . E5 - G5 A5 - . .',
  'B5 - A5 G5 . E5 - D5 . B4 - D5 E5 - . .',
  '. E5 - G5 A5 - . E5 . C5 - D5 E5 - G5 -',
  'G5 - E5 . D5 E5 - . B4 - D5 E5 G5 - . .',
  'A5 - G5 F5 . E5 D5 - . C5 - A4 C5 D5 - .',
  'B4 - . D5 E5 - G#5 - . B5 - A5 G#5 E5 . .',
].map(steps);
const bridge = [
  'A4 - - - C5 - E5 - . G5 - E5 C5 - . .',
  'B4 - - - D5 - E5 - . G5 - A5 B5 - . .',
  'G5 - - E5 . D5 - B4 . G4 - B4 D5 - E5 -',
  'E5 - - - C5 - A4 - . C5 - E5 G5 - . .',
  'F5 - - - A5 - G5 F5 . E5 - D5 C5 - . .',
  'E5 - - - G5 - B5 - . A5 - G5 E5 - . .',
  'D5 - F5 - A5 - . F5 . D5 - B4 D5 - F5 -',
  'G#5 - B5 - . A5 G#5 E5 . D5 - B4 E5 - . .',
].map(steps);
for (const phrase of [...hook, ...bridge])
  if (phrase.length !== 16) throw Error(`Phrase has ${phrase.length} steps`);
const leadPatch = {
  wave: 'square',
  duty: 0.5,
  vol: 0.09,
  attack: 0.008,
  decay: 0.11,
  sustain: 0.3,
  release: 0.035,
  lowpass: 3200,
  vib: 0.0025,
  vibRate: 5,
};
for (let bar = 0; bar < bars; bar++) {
  const at = bar * 16 * step,
    middle = bar >= 16 && bar < 24,
    finale = bar >= 24;
  const tones = chords[changes[bar]].map(hz),
    root = tones[0];
  const melody = middle ? bridge[bar - 16] : hook[bar % 8];
  playLine(tracks.lead, melody, step, at, {
    ...leadPatch,
    vol: finale ? 0.105 : 0.09,
    lowpass: middle ? 2700 : 3200,
  });
  // Short opposite-side replies, leaving the main tune easy to follow.
  if (bar >= 8 && bar % 2 === 1) {
    const replies = middle ? ['C5', 'E5', 'G5'] : ['E5', 'D5', 'C5'];
    for (let i = 0; i < 3; i++)
      voice(tracks.answer, at + (10 + i * 2) * step, {
        wave: 'tri',
        f0: hz(changes[bar] === 'E7' ? ['B4', 'G#4', 'E4'][i] : replies[i]),
        dur: step * 1.4,
        vol: 0.055,
        attack: 0.006,
        decay: 0.1,
        sustain: 0.22,
        release: 0.04,
        lowpass: 3000,
      });
  }
  // Electric-piano-style chip voicings: rounded fundamentals, quiet bell-like harmonics.
  for (const pos of middle ? [0, 6, 11] : [0, 3, 6, 10, 14]) {
    const length = step * (middle ? 3.2 : pos === 0 ? 2.5 : 1.3);
    for (const [i, f] of tones.slice(1).entries()) {
      const timing = at + pos * step + i * 0.006 + (pos % 2 ? step * 0.07 : 0);
      voice(tracks.keys, timing, {
        wave: 'sine',
        f0: f,
        dur: length,
        vol: middle ? 0.075 : 0.064,
        attack: 0.003,
        decay: 0.18,
        sustain: 0.13,
        release: 0.05,
      });
      voice(tracks.keys, timing, {
        wave: 'sine',
        f0: f * 2.005,
        dur: length * 0.7,
        vol: 0.018,
        attack: 0.002,
        decay: 0.07,
        sustain: 0.02,
        release: 0.025,
      });
      voice(tracks.keys, timing, {
        wave: 'tri',
        f0: f,
        dur: length,
        vol: 0.023,
        attack: 0.005,
        decay: 0.16,
        sustain: 0.15,
        release: 0.04,
        lowpass: 2000,
      });
    }
  }
  // Syncopated root/octave/fifth groove, with a brief chromatic pickup into the next bar.
  for (const [pos, semis, length] of [
    [0, 0, 1.5],
    [3, 12, 0.7],
    [6, 7, 1.3],
    [8, 0, 1.6],
    [11, 12, 0.7],
    [14, 7, 0.8],
  ]) {
    const f = root * 2 ** (semis / 12);
    voice(tracks.bass, at + pos * step, {
      wave: 'tri',
      f0: f,
      dur: step * length,
      vol: 0.28,
      attack: 0.004,
      decay: 0.12,
      sustain: 0.42,
      release: 0.025,
    });
    voice(tracks.bass, at + pos * step, {
      wave: 'sine',
      f0: f,
      dur: step * length,
      vol: 0.075,
      attack: 0.004,
      decay: 0.14,
      sustain: 0.4,
      release: 0.025,
    });
  }
  if (bar % 2 === 1) {
    const next = chords[changes[(bar + 1) % bars]][0];
    voice(tracks.bass, at + 15 * step, {
      wave: 'tri',
      f0: hz(next) * 2 ** (-1 / 12),
      dur: step * 0.6,
      vol: 0.16,
      attack: 0.003,
      decay: 0.05,
      release: 0.015,
    });
  }
  // Tiny bright offbeat accents rather than a continuous high arpeggio.
  if (bar >= 8)
    for (const [i, pos] of [2, 7, 13].entries())
      voice(tracks.bells, at + pos * step, {
        wave: 'sine',
        f0: tones[1 + i] * 2,
        dur: step * 2,
        vol: middle ? 0.025 : 0.035,
        attack: 0.002,
        decay: 0.065,
        sustain: 0,
        release: 0.03,
      });
  playDrums(
    tracks.drums,
    steps(middle ? 'k . . . . . k . k . . . . . . .' : 'k . . k . . . . k . . k . . . .'),
    step,
    at,
    0.68,
  );
  playDrums(tracks.drums, steps('. . . . s . . . . . . . s . . .'), step, at + 0.008, middle ? 0.52 : 0.63);
  playDrums(tracks.drums, steps('h . h . h . h . h . h . h . o .'), step, at, 0.44);
  if (bar % 4 === 3) playDrums(tracks.drums, steps('. . . . . . . . . . . . . h s h'), step, at, 0.32);
}
const mix = stereoMix(
  tracks,
  { lead: -0.06, answer: 0.32, keys: -0.3, bass: 0, bells: 0.45, drums: 0 },
  duration,
  [
    { source: 'lead', seconds: step * 3, gain: 0.12, pan: 0.5 },
    { source: 'keys', seconds: step * 3, gain: 0.08, pan: 0.35 },
  ],
);
const report = {
  title: 'Golden Hour',
  previewOnly: true,
  bpm,
  bars,
  key: 'A minor / C major with seventh chords',
  ...mix.metrics,
  sections: [
    '0:00 Main hook and groove',
    '0:13 Replies and bell accents',
    '0:27 Warm contrasting middle',
    '0:40 Full hook reprise',
  ],
  originalComposition: true,
  externalSamples: false,
  source: 'tools/audio/make-harbor-theme.mjs',
};
if (report.peakDbFS > -1 || report.seamSampleDelta.some((value) => value > 0.005))
  throw Error(`Master/loop seam check failed: ${JSON.stringify(report)}`);
writeFileSync(new URL('golden-hour.wav', out), mix.pcm);
writeFileSync(new URL('track.json', out), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
