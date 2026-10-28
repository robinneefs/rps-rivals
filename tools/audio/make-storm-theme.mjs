// Original Storm Field theme, sharing the established chip-rock composition/voice engine.
import { mkdirSync, writeFileSync } from 'node:fs';
import { Buffer32, chord, playDrums, playLine, steps, voice } from './synth.mjs';
import { stereoMix } from './music-mix.mjs';
const out = new URL('../../art/audio/storm-theme-v1/', import.meta.url);
mkdirSync(out, { recursive: true });
const bpm = 148,
  bars = 32,
  sr = 44100;
const step = 60 / bpm / 4;
const duration = bars * 16 * step;
const tracks = Object.fromEntries(
  ['lead', 'harmony', 'guitar', 'bass', 'arp', 'pads', 'drums'].map((n) => [
    n,
    new Buffer32(sr, duration + 3),
  ]),
);
const changes = [
  'Em',
  'C',
  'Am',
  'B7',
  'Em',
  'C',
  'Am',
  'B7',
  'Em',
  'C',
  'Am',
  'B7',
  'Em',
  'C',
  'Am',
  'B7',
  'Am',
  'Em',
  'C',
  'B7',
  'Am',
  'C',
  'D',
  'B7',
  'Em',
  'C',
  'Am',
  'B7',
  'Em',
  'C',
  'Am',
  'B7',
];
const hook = [
  'B4 - E5 - G5 - F#5 E5 B4 - D5 - E5 - . .',
  'G5 - E5 - D5 - E5 - G5 - B5 - G5 - . .',
  'A5 - E5 - C5 - E5 - G5 - E5 D5 C5 - . .',
  'F#5 - D#5 - B4 - D#5 - F#5 - A5 - F#5 - . .',
  'B4 - E5 - G5 A5 B5 - A5 - G5 - F#5 E5 - .',
  'G5 - B5 - E6 - D6 B5 G5 - E5 - D5 E5 G5 -',
  'A5 - G5 E5 C5 - E5 - G5 - A5 - G5 E5 C5 -',
  'F#5 - A5 - B5 - A5 F#5 D#5 - F#5 - B4 - . .',
].map(steps);
const bridge = [
  'E5 - - - A5 - G5 - E5 - C5 - E5 - . .',
  'B4 - - - E5 - G5 - F#5 - E5 - B4 - . .',
  'G5 - E5 - B5 - G5 - E5 - D5 - E5 - . .',
  'F#5 - D#5 - A5 - F#5 - B5 - A5 F#5 D#5 - . .',
  'A5 - E5 - C6 - B5 A5 G5 - E5 - C5 E5 A5 -',
  'G5 - B5 - E6 - D6 B5 G5 - E5 - G5 - . .',
  'F#5 - A5 - D6 - C6 A5 F#5 - E5 - D5 - . .',
  'D#5 - F#5 A5 B5 - A5 F#5 D#5 - F#5 - B4 - . .',
].map(steps);
for (const notes of [...hook, ...bridge])
  if (notes.length !== 16) throw Error(`Invalid phrase: ${notes.length} steps`);
const patch = {
  wave: 'square',
  duty: 0.25,
  vol: 0.14,
  attack: 0.004,
  decay: 0.15,
  sustain: 0.43,
  release: 0.035,
  vib: 0.004,
  vibRate: 5.6,
  lowpass: 4300,
};
for (let bar = 0; bar < bars; bar++) {
  const at = bar * 16 * step;
  const isBridge = bar >= 16 && bar < 24;
  const finale = bar >= 24;
  const tones = chord(changes[bar], 3);
  const root = tones[0];
  const line = isBridge ? bridge[bar - 16] : hook[bar % 8];
  playLine(tracks.lead, line, step, at, {
    ...patch,
    duty: isBridge ? 0.125 : 0.25,
    vol: finale ? 0.155 : 0.14,
  });
  // Harmony enters in the answering phrases, then lifts the closing reprise.
  if ((bar >= 8 && bar < 16 && bar % 2 === 1) || finale) {
    const answer = line.map((note) =>
      /^[A-G]/.test(note) ? note.slice(0, -1) + (Number(note.at(-1)) - 1) : note,
    );
    playLine(tracks.harmony, answer, step, at, { ...patch, duty: 0.5, vol: 0.048, lowpass: 2900 });
  }
  // Same syncopated picked riff language as Ready to Rival; minor harmony and a darker tone.
  for (const pos of isBridge ? [0, 3, 6, 8, 11, 14] : [0, 2, 3, 6, 8, 10, 11, 14]) {
    const open = pos === 6 || pos === 14;
    const dur = step * (open ? 1.7 : 0.68);
    const guitar = {
      wave: 'square',
      duty: 0.25,
      dur,
      attack: 0.002,
      decay: 0.055,
      sustain: open ? 0.22 : 0.06,
      release: 0.016,
      lowpass: 2600,
    };
    voice(tracks.guitar, at + pos * step, {
      ...guitar,
      f0: root * 0.987,
      f1: root,
      sweep: 0.014,
      vol: isBridge ? 0.065 : 0.09,
    });
    voice(tracks.guitar, at + pos * step + 0.003, { ...guitar, f0: root * 1.5, vol: open ? 0.048 : 0.025 });
  }
  for (const [pos, semis, length] of [
    [0, 0, 1.6],
    [3, 0, 0.8],
    [6, 7, 1.2],
    [8, 12, 1.5],
    [11, 7, 0.8],
    [14, 0, 1],
  ])
    voice(tracks.bass, at + pos * step, {
      wave: 'tri',
      f0: (root / 2) * 2 ** (semis / 12),
      dur: step * length,
      vol: 0.31,
      attack: 0.003,
      decay: 0.13,
      sustain: 0.48,
      release: 0.02,
    });
  // Low, spacious chord bed; upper arpeggios flicker over the backbeat.
  for (const [i, f] of tones.entries()) {
    voice(tracks.pads, at + i * 0.007, {
      wave: 'tri',
      f0: f,
      dur: 16 * step,
      vol: 0.029,
      attack: 0.1,
      decay: 0.8,
      sustain: 0.55,
      release: 0.16,
      lowpass: 1800,
    });
    voice(tracks.pads, at + i * 0.007, {
      wave: 'sine',
      f0: f * 1.003,
      dur: 16 * step,
      vol: 0.012,
      attack: 0.12,
      release: 0.16,
    });
  }
  for (let pos = 1; pos < 16; pos += isBridge ? 1 : 2) {
    const order = [0, 2, 1, 2, 0, 1, 2, 1];
    voice(tracks.arp, at + pos * step, {
      wave: 'square',
      f0: tones[order[pos % 8]] * 4,
      duty: 0.125,
      dur: step * 0.65,
      vol: isBridge ? 0.023 : 0.017,
      decay: 0.035,
      release: 0.018,
      lowpass: 3900,
    });
  }
  playDrums(
    tracks.drums,
    steps(isBridge ? 'k . . . . . k . k . . . . . k .' : 'k . . k . . . . k . k . . . . .'),
    step,
    at,
    0.78,
  );
  playDrums(tracks.drums, steps('. . . . s . . . . . . . s . . .'), step, at, isBridge ? 0.58 : 0.76);
  playDrums(
    tracks.drums,
    steps(bar % 4 === 3 ? 'h . h . h . h . h . h . . h o h' : 'h . h . h . h . h . h . h . o .'),
    step,
    at,
    isBridge ? 0.35 : 0.48,
  );
  if (bar % 4 === 3)
    for (const [i, pos] of [12, 14, 15].entries())
      voice(tracks.drums, at + pos * step, {
        wave: 'tri',
        f0: 230 - i * 40,
        f1: 85 - i * 12,
        sweep: 0.07,
        dur: 0.12,
        decay: 0.04,
        vol: 0.19,
      });
  if (bar % 8 === 0)
    voice(tracks.drums, at, {
      wave: 'noise',
      f0: 16000,
      dur: 0.45,
      decay: 0.14,
      highpass: 4500,
      vol: 0.075,
      seed: bar + 417,
    });
}
const mix = stereoMix(
  tracks,
  { lead: 0.03, harmony: -0.3, guitar: -0.34, bass: 0, arp: 0.45, pads: 0.24, drums: 0 },
  duration,
  [
    { source: 'lead', seconds: step * 3, gain: 0.18, pan: -0.6 },
    { source: 'lead', seconds: step * 6, gain: 0.1, pan: 0.65 },
    { source: 'arp', seconds: step * 3, gain: 0.14, pan: -0.45 },
  ],
);
writeFileSync(new URL('under-the-storm.wav', out), mix.pcm);
const report = {
  title: 'Under the Storm',
  bpm,
  key: 'E minor',
  bars,
  ...mix.metrics,
  sections: [
    '0:00 Minor-key riff / hook',
    '0:13 Answering harmonies',
    '0:26 Atmospheric bridge',
    '0:39 Full-band reprise',
  ],
  originalComposition: true,
  externalSamples: false,
  sources: ['tools/audio/make-storm-theme.mjs', 'tools/audio/synth.mjs', 'tools/audio/music-mix.mjs'],
};
writeFileSync(new URL('track.json', out), JSON.stringify(report, null, 2) + '\n');
if (report.peakDbFS > -1 || report.seamSampleDelta.some((x) => x > 0.005))
  throw Error('Master peak/loop seam needs adjustment');
console.log(JSON.stringify(report, null, 2));
