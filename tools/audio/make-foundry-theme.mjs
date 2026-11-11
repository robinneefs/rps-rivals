// Original industrial chip-metal composition. Preview only; production music stays untouched.
import { mkdirSync, writeFileSync } from 'node:fs';
import { Buffer32, hz, playDrums, playLine, steps, voice } from './synth.mjs';
import { stereoMix } from './music-mix.mjs';

const out = new URL('../../art/audio/foundry-pressure-point-v1/', import.meta.url);
mkdirSync(out, { recursive: true });
const bpm = 156,
  bars = 32,
  sr = 44100,
  step = 60 / bpm / 4,
  duration = bars * 16 * step;
const tracks = Object.fromEntries(
  ['lead', 'grindL', 'grindR', 'bass', 'machine', 'drums', 'alarm'].map((name) => [
    name,
    new Buffer32(sr, duration + 3),
  ]),
);
const roots = [
  'E2',
  'E2',
  'F2',
  'E2',
  'E2',
  'G2',
  'F2',
  'B1',
  'E2',
  'E2',
  'F2',
  'E2',
  'E2',
  'G2',
  'Bb1',
  'B1',
  'E2',
  'E2',
  'F2',
  'E2',
  'G2',
  'F2',
  'Bb1',
  'B1',
  'E2',
  'E2',
  'F2',
  'E2',
  'E2',
  'G2',
  'Bb1',
  'B1',
];
const hook = [
  'E4 E4 . E4 G4 - F4 E4 . B4 - Bb4 G4 - E4 .',
  '. E4 E4 . B4 - G4 E4 F4 - E4 . G4 F4 E4 -',
  'F4 F4 . F4 A4 - G4 F4 . C5 - B4 A4 - F4 .',
  'E4 - G4 F4 E4 . E4 . B4 Bb4 G4 - F4 E4 . .',
  'E5 - B4 . G4 E4 . E4 G4 - F4 E4 . B4 Bb4 -',
  'G4 G4 . Bb4 B4 - D5 B4 . G4 - F4 E4 - G4 -',
  'F4 - E4 F4 G4 - Bb4 - B4 Bb4 G4 F4 E4 - . .',
  'B4 - Bb4 G4 F4 E4 . E4 . B3 - D4 F4 - E4 -',
].map(steps);
const breakdown = [
  'E4 - - - . . E4 . G4 - - - F4 - E4 -',
  '. . B3 - E4 - - - . . G4 - F4 E4 . .',
  'F4 - - - . . F4 . A4 - - - G4 - F4 -',
  'E4 - - - B3 - E4 - G4 - F4 - E4 - . .',
  'G4 - - - Bb4 - - - B4 - - - G4 - F4 -',
  'F4 - - - E4 - F4 - G4 - - - F4 E4 . .',
  'Bb3 - - - F4 - - - E4 - F4 - Bb4 - - -',
  'B3 - B3 . D4 - F4 - B4 - Bb4 G4 F4 E4 . .',
].map(steps);
for (const line of [...hook, ...breakdown]) if (line.length !== 16) throw Error('Invalid phrase length');
const kickTimes = [];
for (let bar = 0; bar < bars; bar++) {
  const at = bar * 16 * step,
    half = bar >= 16 && bar < 24,
    finale = bar >= 24;
  const root = hz(roots[bar]),
    line = half ? breakdown[bar - 16] : hook[bar % 8];
  playLine(tracks.lead, line, step, at, {
    wave: 'square',
    duty: 0.125,
    vol: half ? 0.065 : finale ? 0.105 : 0.09,
    attack: 0.002,
    decay: 0.085,
    sustain: 0.28,
    release: 0.018,
    lowpass: 3100,
    vib: 0.002,
    vibRate: 6.2,
  });
  // Short hard-gated power dyads, stereo detuned for a grinding machine/guitar texture.
  const hits = half
    ? [
        [0, 2.4],
        [6, 0.8],
        [8, 2.4],
        [14, 0.7],
      ]
    : [
        [0, 0.7],
        [2, 0.65],
        [3, 0.65],
        [6, 1.2],
        [8, 0.7],
        [10, 0.65],
        [11, 0.65],
        [14, 1.2],
      ];
  for (const [pos, length] of hits) {
    const accent = pos === 0 || pos === 8;
    for (const [name, detune, delay] of [
      ['grindL', 0.994, 0],
      ['grindR', 1.006, 0.005],
    ]) {
      const patch = {
        wave: 'saw',
        dur: step * length,
        vol: accent ? 0.085 : 0.065,
        attack: 0.0015,
        decay: 0.045,
        sustain: 0.14,
        release: 0.009,
        lowpass: 2100,
      };
      voice(tracks[name], at + pos * step + delay, {
        ...patch,
        f0: root * detune * 1.02,
        f1: root * detune,
        sweep: 0.018,
      });
      voice(tracks[name], at + pos * step + delay, {
        ...patch,
        wave: 'square',
        duty: 0.25,
        f0: root * 1.5 * detune,
        vol: 0.035,
      });
    }
    voice(tracks.bass, at + pos * step, {
      wave: 'tri',
      f0: root / 2,
      dur: step * (length + 0.25),
      vol: 0.26,
      attack: 0.002,
      decay: 0.1,
      sustain: 0.5,
      release: 0.012,
    });
    voice(tracks.bass, at + pos * step, {
      wave: 'saw',
      f0: root / 2,
      dur: step * length,
      vol: 0.035,
      attack: 0.002,
      decay: 0.06,
      sustain: 0.2,
      release: 0.009,
      lowpass: 900,
    });
  }
  // Inharmonic struck metal, with a short-loop chip-noise attack. All synthesized.
  for (const [i, pos] of (half ? [2, 10] : [1, 5, 9, 13]).entries()) {
    const when = at + pos * step;
    voice(tracks.machine, when, {
      wave: 'metal',
      f0: 2300 + i * 271,
      dur: 0.09,
      vol: half ? 0.035 : 0.045,
      attack: 0.001,
      decay: 0.021,
      sustain: 0,
      release: 0.015,
      lowpass: 3900,
    });
    voice(tracks.machine, when, {
      wave: 'sine',
      f0: root * 4.17,
      dur: 0.16,
      vol: 0.045,
      attack: 0.001,
      decay: 0.04,
      sustain: 0,
      release: 0.025,
    });
    voice(tracks.machine, when, {
      wave: 'sine',
      f0: root * 6.83,
      dur: 0.1,
      vol: 0.018,
      attack: 0.001,
      decay: 0.025,
      sustain: 0,
      release: 0.02,
    });
  }
  const kicks = steps(half ? 'k . . . . . k . k . . . . . k .' : 'k . . k . . k . k . k . . . k .');
  kicks.forEach((hit, i) => {
    if (hit === 'k') kickTimes.push(at + i * step);
  });
  playDrums(tracks.drums, kicks, step, at, 0.95);
  playDrums(
    tracks.drums,
    steps(half ? '. . . . . . . . s . . . . . . .' : '. . . . s . . . . . . . s . . .'),
    step,
    at,
    0.86,
  );
  playDrums(
    tracks.drums,
    steps(half ? 'h . . . h . h . h . . . h . o .' : 'h . h h h . h . h . h h h . o h'),
    step,
    at,
    half ? 0.35 : 0.45,
  );
  for (const pos of half ? [8] : [4, 12]) {
    voice(tracks.drums, at + pos * step, {
      wave: 'metal',
      f0: 5600,
      dur: 0.13,
      vol: 0.08,
      attack: 0.001,
      decay: 0.04,
      sustain: 0,
      release: 0.025,
      lowpass: 3800,
    });
    voice(tracks.drums, at + pos * step, {
      wave: 'sine',
      f0: 180,
      f1: 105,
      dur: 0.1,
      sweep: 0.04,
      vol: 0.15,
      attack: 0.001,
      decay: 0.03,
      release: 0.018,
    });
  }
  if (bar % 4 === 3)
    for (const [i, pos] of [13, 14, 15].entries())
      voice(tracks.drums, at + pos * step, {
        wave: 'tri',
        f0: 210 - i * 40,
        f1: 65 - i * 8,
        sweep: 0.065,
        dur: 0.13,
        vol: 0.19,
        attack: 0.001,
        decay: 0.04,
        release: 0.02,
      });
  // Brief mechanical warning accents punctuate sections, not a continuous siren.
  if (bar === 0 || bar === 8 || bar === 24) {
    for (const [i, pos] of [0, 2, 6].entries())
      voice(tracks.alarm, at + pos * step, {
        wave: 'square',
        duty: 0.5,
        f0: hz(i === 1 ? 'F5' : 'E5'),
        dur: step * 1.2,
        vol: 0.04,
        attack: 0.004,
        decay: 0.05,
        sustain: 0.3,
        release: 0.025,
        lowpass: 2300,
      });
    voice(tracks.drums, at, {
      wave: 'noise',
      f0: 16000,
      dur: 0.3,
      vol: 0.065,
      decay: 0.085,
      highpass: 4000,
      release: 0.05,
      seed: bar + 310,
    });
  }
}
// Saturate the riff buses, then duck them briefly around kicks so the drums stay punchy.
for (let i = 0; i < tracks.drums.data.length; i++)
  tracks.drums.data[i] = Math.tanh(tracks.drums.data[i] * 2) * 0.6;
for (const name of ['grindL', 'grindR'])
  for (let i = 0; i < tracks[name].data.length; i++)
    tracks[name].data[i] = Math.tanh(tracks[name].data[i] * 3.5) * 0.52;
for (const when of kickTimes)
  for (let i = 0; i < sr * 0.075; i++) {
    const at = Math.round(when * sr) + i,
      duck = 0.65 + (0.35 * i) / (sr * 0.075);
    for (const name of ['grindL', 'grindR', 'bass'])
      if (at < tracks[name].data.length) tracks[name].data[at] *= duck;
  }
const mix = stereoMix(
  tracks,
  { lead: 0, grindL: -0.6, grindR: 0.6, bass: 0, machine: 0.35, drums: 0, alarm: -0.25 },
  duration,
  [
    { source: 'lead', seconds: step * 3, gain: 0.1, pan: -0.45 },
    { source: 'machine', seconds: step * 2, gain: 0.08, pan: -0.5 },
  ],
);
const report = {
  title: 'Pressure Point',
  previewOnly: true,
  bpm,
  bars,
  key: 'E Phrygian with chromatic/tritone accents',
  ...mix.metrics,
  originalComposition: true,
  externalSamples: false,
  sections: [
    '0:00 Machine riff / main hook',
    '0:12 Second pass / rising pressure',
    '0:25 Half-time press breakdown',
    '0:37 Full-force reprise',
  ],
  source: 'tools/audio/make-foundry-theme.mjs',
};
if (report.peakDbFS > -1 || report.seamSampleDelta.some((v) => v > 0.005))
  throw Error(`Master/loop seam needs adjustment: ${JSON.stringify(report)}`);
writeFileSync(new URL('pressure-point.wav', out), mix.pcm);
writeFileSync(new URL('track.json', out), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
