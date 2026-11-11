// Original fast pentatonic courtyard theme; listening preview only.
import { mkdirSync, writeFileSync } from 'node:fs';
import { Buffer32, hz, playLine, playDrums, steps, voice } from './synth.mjs';
import { stereoMix } from './music-mix.mjs';
const out = new URL('../../art/audio/courtyard-lantern-rush-v1/', import.meta.url);
mkdirSync(out, { recursive: true });
const bpm = 168,
  bars = 32,
  sr = 44100,
  step = 60 / bpm / 4,
  duration = bars * 16 * step;
const tracks = Object.fromEntries(
  ['pluck', 'flute', 'strings', 'bass', 'bells', 'drums'].map((n) => [n, new Buffer32(sr, duration + 3)]),
);
// D minor pentatonic: D F G A C. A contrasting F-major-pentatonic bridge lifts the reprise.
const hook = [
  'D5 - A5 - C6 A5 G5 - F5 - G5 A5 . F5 D5 -',
  'F5 - G5 A5 C6 - A5 G5 F5 - D5 - . A4 C5 -',
  'G5 - C6 - D6 C6 A5 - G5 - F5 G5 A5 - C6 -',
  'A5 - G5 F5 D5 - F5 - G5 A5 - G5 F5 - D5 -',
  'D5 F5 A5 - C6 - D6 C6 A5 - G5 - F5 G5 A5 -',
  'C6 - A5 G5 F5 - G5 - A5 C6 - A5 G5 F5 D5 -',
  'G5 A5 C6 - D6 - C6 A5 G5 - F5 - G5 A5 C6 -',
  'A5 - G5 - F5 G5 A5 - C6 A5 G5 F5 D5 - . .',
].map(steps);
const bridge = [
  'F5 - - A5 C6 - D6 - C6 - A5 - G5 - F5 -',
  'G5 - - C6 D6 - C6 - A5 - G5 - E5 G5 - -',
  'A5 - - C6 D6 - E6 - D6 C6 A5 - G5 A5 C6 -',
  'D6 - C6 A5 G5 - F5 - D5 F5 A5 - C6 - . .',
  'F5 A5 C6 - D6 - C6 A5 G5 - A5 C6 D6 - C6 -',
  'G5 - C6 - E6 D6 C6 - A5 - G5 - E5 G5 C6 -',
  'A5 C6 D6 - C6 A5 G5 - F5 G5 A5 - C6 A5 G5 -',
  'A5 - G5 F5 D5 - F5 G5 A5 - C6 A5 G5 F5 D5 -',
].map(steps);
for (const line of [...hook, ...bridge]) if (line.length !== 16) throw Error('Invalid phrase length');
const harmonies = {
  Dm: ['D2', 'A3', 'D4', 'F4'],
  Bb: ['Bb1', 'F3', 'Bb3', 'D4'],
  Gm: ['G2', 'D4', 'G4', 'Bb4'],
  Csus: ['C2', 'G3', 'C4', 'D4'],
  F: ['F2', 'C4', 'F4', 'A4'],
  Am: ['A1', 'E4', 'A4', 'C5'],
};
const changes = [
  ...Array(2).fill(['Dm', 'Bb', 'Gm', 'Csus', 'Dm', 'Bb', 'Gm', 'Am']).flat(),
  'F',
  'Csus',
  'Am',
  'Dm',
  'Bb',
  'Csus',
  'Gm',
  'Am',
  'Dm',
  'Bb',
  'Gm',
  'Csus',
  'Dm',
  'Bb',
  'Gm',
  'Am',
];
for (let bar = 0; bar < bars; bar++) {
  const at = bar * 16 * step,
    middle = bar >= 16 && bar < 24,
    finale = bar >= 24,
    notes = middle ? bridge[bar - 16] : hook[bar % 8],
    tones = harmonies[changes[bar]].map(hz);
  // Bright plucked-string-like chip voice: quick attack, woody fundamental and bell harmonic.
  for (let pos = 0; pos < 16; pos++)
    if (/^[A-G]/.test(notes[pos])) {
      let length = 1;
      while (notes[pos + length] === '-') length++;
      const f = hz(notes[pos]),
        time = at + pos * step;
      voice(tracks.pluck, time, {
        wave: 'tri',
        f0: f,
        dur: step * (length + 0.8),
        vol: middle ? 0.105 : 0.14,
        attack: 0.0015,
        decay: 0.075,
        sustain: 0.06,
        release: 0.025,
      });
      voice(tracks.pluck, time, {
        wave: 'square',
        duty: 0.25,
        f0: f,
        dur: step * (length + 0.25),
        vol: 0.032,
        attack: 0.001,
        decay: 0.045,
        sustain: 0.02,
        release: 0.018,
        lowpass: 4200,
      });
      voice(tracks.pluck, time, {
        wave: 'sine',
        f0: f * 2.01,
        dur: 0.12,
        vol: 0.028,
        attack: 0.001,
        decay: 0.035,
        sustain: 0,
        release: 0.015,
      });
    }
  // Breathier answer enters on the second pass; the bridge gives it longer phrases.
  if (bar >= 8) {
    const answer = middle ? notes : notes.map((n, i) => (i < 8 ? '.' : n));
    playLine(tracks.flute, answer, step, at, {
      wave: 'sine',
      vol: middle ? 0.11 : finale ? 0.08 : 0.06,
      attack: 0.017,
      decay: 0.16,
      sustain: 0.55,
      release: 0.035,
      vib: 0.004,
      vibRate: 5.5,
    });
    playLine(tracks.flute, answer, step, at + 0.004, {
      wave: 'tri',
      vol: 0.018,
      attack: 0.02,
      decay: 0.12,
      sustain: 0.4,
      release: 0.04,
      lowpass: 2400,
    });
  }
  for (const [i, f] of tones.slice(1).entries())
    voice(tracks.strings, at + i * 0.008, {
      wave: 'tri',
      f0: f,
      dur: step * 14,
      vol: middle ? 0.035 : 0.022,
      attack: 0.07,
      decay: 0.3,
      sustain: 0.35,
      release: 0.1,
      lowpass: 1600,
    });
  for (const [pos, octave] of [
    [0, 1],
    [3, 2],
    [6, 1.5],
    [8, 1],
    [11, 2],
    [14, 1.5],
  ])
    voice(tracks.bass, at + pos * step, {
      wave: 'tri',
      f0: tones[0] * octave,
      dur: step * 1.5,
      vol: 0.28,
      attack: 0.003,
      decay: 0.1,
      sustain: 0.4,
      release: 0.02,
    });
  if (bar % 4 === 0)
    voice(tracks.bells, at, {
      wave: 'sine',
      f0: tones[2] * 4,
      dur: 0.55,
      vol: 0.045,
      attack: 0.001,
      decay: 0.12,
      sustain: 0,
      release: 0.1,
    });
  playDrums(tracks.drums, steps('k . . k . . . . k . . k . . . .'), step, at, 0.64);
  playDrums(tracks.drums, steps('. . . . s . . . . . . . s . . .'), step, at, 0.5);
  playDrums(tracks.drums, steps('h . h . h . h . h . h . h . o .'), step, at, 0.32);
  // Deep struck drum accents provide a festival-like drive, made entirely from oscillators.
  for (const [i, pos] of (bar % 4 === 3 ? [0, 6, 10, 12, 14, 15] : [0, 6, 10]).entries()) {
    voice(tracks.drums, at + pos * step, {
      wave: 'sine',
      f0: 150 - i * 5,
      f1: 65,
      sweep: 0.09,
      dur: 0.23,
      vol: 0.16,
      attack: 0.001,
      decay: 0.07,
      sustain: 0,
      release: 0.045,
    });
    voice(tracks.drums, at + pos * step, {
      wave: 'noise',
      f0: 2800,
      dur: 0.022,
      vol: 0.035,
      attack: 0.001,
      decay: 0.006,
      release: 0.006,
      seed: bar * 16 + i + 32,
    });
  }
}
const mix = stereoMix(
  tracks,
  { pluck: -0.22, flute: 0.22, strings: -0.1, bass: 0, bells: 0.5, drums: 0 },
  duration,
  [
    { source: 'pluck', seconds: step * 3, gain: 0.14, pan: 0.45 },
    { source: 'flute', seconds: step * 4, gain: 0.1, pan: -0.4 },
  ],
);
const report = {
  title: 'Lantern Rush',
  previewOnly: true,
  bpm,
  bars,
  key: 'D minor pentatonic; F major pentatonic bridge',
  ...mix.metrics,
  originalComposition: true,
  externalSamples: false,
  sections: [
    '0:00 Plucked pentatonic hook',
    '0:11 Breathy answering melody',
    '0:23 Brighter bridge',
    '0:34 Full reprise',
  ],
  source: 'tools/audio/make-courtyard-theme.mjs',
};
if (report.peakDbFS > -1 || report.seamSampleDelta.some((v) => v > 0.005))
  throw Error('Audio peak/seam check failed');
writeFileSync(new URL('lantern-rush.wav', out), mix.pcm);
writeFileSync(new URL('track.json', out), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
