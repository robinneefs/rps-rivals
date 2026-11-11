// A separate original rock composition, not a faster remix of Ready to Rival.
// node tools/audio/make-menu-rock.mjs — preview only, never installs game assets.
import { mkdirSync, writeFileSync } from 'node:fs';
import { Buffer32, hz, playLine, steps, voice } from './synth.mjs';
import { stereoMix } from './music-mix.mjs';

const out = new URL('../../art/audio/menu-rock-v1/', import.meta.url);
mkdirSync(out, { recursive: true });
const bpm = 176,
  sr = 44100,
  bars = 32;
const step = 60 / bpm / 4;
const duration = bars * 16 * step;
const tracks = Object.fromEntries(
  ['guitarL', 'guitarR', 'bass', 'lead', 'harmony', 'drums'].map((name) => [
    name,
    new Buffer32(sr, duration + 2),
  ]),
);
const progression = [
  'E',
  'E',
  'C',
  'D',
  'E',
  'G',
  'A',
  'B',
  'E',
  'G',
  'D',
  'A',
  'C',
  'G',
  'D',
  'B',
  'E',
  'E',
  'C',
  'D',
  'A',
  'C',
  'D',
  'B',
  'E',
  'G',
  'D',
  'A',
  'C',
  'D',
  'E',
  'B',
];

function guitar(buffer, at, f, length, open, side) {
  // Tight, asymmetric pulse + saw/fifth: saturate as a separate guitar bus below.
  const dur = step * length;
  const patch = {
    dur,
    attack: 0.0015,
    decay: open ? 0.1 : 0.028,
    sustain: open ? 0.35 : 0.03,
    release: 0.012,
    highpass: 100,
    lowpass: 3100,
  };
  const detune = side ? 1.0025 : 0.998;
  voice(buffer, at + (side ? 0.004 : 0), {
    ...patch,
    wave: 'saw',
    f0: f * detune * 0.98,
    f1: f * detune,
    sweep: 0.012,
    vol: 0.2,
  });
  voice(buffer, at + 0.002, {
    ...patch,
    wave: 'square',
    duty: 0.5,
    f0: f * 1.5 * detune,
    vol: open ? 0.12 : 0.075,
  });
  voice(buffer, at, { ...patch, wave: 'square', duty: 0.25, f0: f * 2 * detune, vol: 0.035 });
  voice(buffer, at, {
    wave: 'noise',
    f0: 7500,
    dur: 0.012,
    decay: 0.003,
    highpass: 1600,
    vol: open ? 0.025 : 0.013,
    seed: Math.round(at * 1000) + side + 1,
  });
}

const riffPatterns = [
  [
    [0, 0, 1],
    [2, 0, 0.7],
    [3, 0, 0.7],
    [5, 3, 1],
    [7, 5, 1],
    [8, 0, 1],
    [10, 0, 0.7],
    [11, 0, 0.7],
    [13, 7, 1],
    [15, 5, 0.7],
  ],
  [
    [0, 0, 1],
    [2, 0, 0.7],
    [3, 0, 0.7],
    [5, 7, 1],
    [7, 5, 1],
    [8, 3, 1],
    [10, 0, 1],
    [12, 0, 0.7],
    [13, 3, 0.7],
    [14, 2, 1.5],
  ],
];
const chorus = [
  'B4 - E5 - G5 - F#5 E5 B4 - D5 - E5 - . .',
  'D5 - G5 - A5 - G5 F#5 D5 - B4 - G4 - . .',
  'A4 - D5 - F#5 - E5 D5 A4 - C5 - D5 - . .',
  'C#5 - E5 - A5 - G5 E5 C#5 - B4 - A4 - . .',
  'E5 - G5 - B5 - A5 G5 E5 - D5 - C5 - . .',
  'D5 - G5 - B5 - A5 G5 D5 - B4 - G4 - . .',
  'F#5 - E5 D5 A4 - D5 - E5 F#5 A5 - F#5 E5 D5 -',
  'F#5 - D#5 - B4 - A4 - F#4 - B4 D#5 F#5 - . .',
].map(steps);
const solo = [
  'E5 G5 A5 B5 D6 B5 A5 G5 E5 - G5 A5 B5 - D6 -',
  'E6 - D6 B5 A5 G5 E5 D5 E5 G5 A5 G5 E5 - B4 -',
  'G5 - E5 G5 B5 - A5 G5 E5 D5 C5 D5 E5 G5 A5 B5',
  'A5 - F#5 D5 E5 F#5 A5 B5 A5 F#5 E5 D5 F#5 - A5 -',
  'A5 - E5 G5 A5 - B5 A5 G5 E5 D5 C5 E5 - G5 -',
  'G5 E5 C5 E5 G5 B5 C6 - B5 G5 E5 G5 A5 G5 E5 -',
  'F#5 A5 D6 - C6 A5 F#5 E5 D5 E5 F#5 A5 D6 - C6 -',
  'B5 - F#5 D#5 B4 D#5 F#5 A5 B5 A5 F#5 D#5 B4 - . .',
].map(steps);
for (const line of [...chorus, ...solo]) if (line.length !== 16) throw new Error('Bad lead bar');

for (let bar = 0; bar < bars; bar++) {
  const at = bar * 16 * step;
  const root = hz(`${progression[bar]}3`);
  const verse = bar < 8 || (bar >= 16 && bar < 20);
  const halfTime = bar === 16 || bar === 17;
  const fill = bar % 4 === 3;
  const pattern = verse
    ? riffPatterns[bar % 2]
    : [
        [0, 0, 2.5],
        [3, 0, 0.7],
        [4, 0, 1.5],
        [6, 0, 1],
        [8, 0, 2.5],
        [11, 0, 0.7],
        [12, 7, 1.5],
        [14, 0, 1.5],
      ];
  for (const [pos, semis, len] of pattern) {
    const open = !verse || semis !== 0;
    const f = root * 2 ** (semis / 12);
    guitar(tracks.guitarL, at + pos * step, f, len, open, 0);
    guitar(tracks.guitarR, at + pos * step, f, len, open, 1);
    voice(tracks.bass, at + pos * step, {
      wave: 'tri',
      f0: f / 2,
      dur: step * Math.max(0.65, len * 0.9),
      vol: 0.34,
      attack: 0.001,
      decay: 0.085,
      sustain: 0.48,
      release: 0.012,
    });
    voice(tracks.bass, at + pos * step, {
      wave: 'square',
      duty: 0.5,
      f0: f / 2,
      dur: step * Math.min(len, 1),
      vol: 0.025,
      decay: 0.035,
      lowpass: 900,
    });
  }
  const leadPatch = {
    wave: 'square',
    duty: 0.25,
    vol: 0.105,
    attack: 0.003,
    decay: 0.13,
    sustain: 0.55,
    release: 0.025,
    lowpass: 4400,
    vib: 0.007,
    vibRate: 5.5,
  };
  if (bar >= 8 && bar < 16) playLine(tracks.lead, chorus[bar - 8], step, at, leadPatch);
  if (bar >= 16 && bar < 24) playLine(tracks.lead, solo[bar - 16], step, at, { ...leadPatch, vol: 0.12 });
  if (bar >= 24) {
    playLine(tracks.lead, chorus[bar - 24], step, at, { ...leadPatch, vol: 0.12 });
    // An octave support line keeps the last hook big, without a constant bright arpeggio.
    playLine(
      tracks.harmony,
      chorus[bar - 24].map((n) => (n === '-' || n === '.' ? n : `${n.slice(0, -1)}${Number(n.at(-1)) - 1}`)),
      step,
      at,
      { ...leadPatch, duty: 0.5, vol: 0.045 },
    );
  }
  // Short riff answers leave the opening eight bars to the guitars.
  if (bar < 8 && bar % 2 === 1)
    playLine(tracks.lead, steps('. . . . . . . . B4 - A4 G4 E4 - . .'), step, at, {
      ...leadPatch,
      vol: 0.075,
    });

  // A rock backbeat, kick doubles and crash/ride. No four-on-the-floor dance pulse.
  const kicks = halfTime ? [0, 3, 6, 10] : verse ? [0, 3, 6, 8, 10] : [0, 2, 6, 8, 10, 14];
  kicks.forEach((pos) => {
    voice(tracks.drums, at + pos * step, {
      wave: 'sine',
      f0: 155,
      f1: 43,
      sweep: 0.055,
      dur: 0.17,
      decay: 0.06,
      vol: 0.47,
    });
    voice(tracks.drums, at + pos * step, {
      wave: 'noise',
      f0: 3800,
      dur: 0.013,
      decay: 0.004,
      vol: 0.09,
      seed: bar * 16 + pos + 1,
    });
  });
  const snares = halfTime ? [8] : [4, 12];
  if (fill) snares.push(...(bar % 8 === 7 ? [10, 13, 14, 15] : [15]));
  snares.forEach((pos, i) => {
    voice(tracks.drums, at + pos * step, {
      wave: 'noise',
      f0: 12500,
      dur: 0.17,
      decay: 0.048,
      highpass: 1100,
      vol: i < 2 ? 0.27 : 0.19,
      seed: bar * 31 + pos + 70,
    });
    voice(tracks.drums, at + pos * step, {
      wave: 'tri',
      f0: 220,
      f1: 130,
      sweep: 0.045,
      dur: 0.095,
      decay: 0.03,
      vol: 0.18,
    });
  });
  for (let pos = 0; pos < 16; pos += 2) {
    voice(tracks.drums, at + pos * step, {
      wave: 'noise',
      f0: 21000,
      dur: verse ? 0.042 : 0.09,
      decay: verse ? 0.014 : 0.032,
      highpass: 6000,
      vol: pos % 4 === 0 ? 0.075 : 0.055,
      seed: bar * 19 + pos + 4,
    });
  }
  if (bar % 4 === 0)
    voice(tracks.drums, at, {
      wave: 'noise',
      f0: 20000,
      dur: 0.55,
      decay: 0.18,
      highpass: 4100,
      vol: 0.13,
      seed: bar + 800,
    });
  if (fill)
    [13, 14, 15].forEach((pos, i) =>
      voice(tracks.drums, at + pos * step, {
        wave: 'sine',
        f0: 210 - i * 35,
        f1: 90 - i * 18,
        sweep: 0.045,
        dur: 0.12,
        decay: 0.045,
        vol: 0.2,
      }),
    );
}

// Guitar-bus drive, not master distortion: drums and bass keep their punch and separation.
for (const name of ['guitarL', 'guitarR']) {
  const track = tracks[name];
  let low = 0;
  const alpha = 1 - Math.exp((-2 * Math.PI * 3800) / sr);
  for (let i = 0; i < track.data.length; i++) {
    const driven = Math.tanh(track.data[i] * 3) * 0.27;
    track.data[i] = low += alpha * (driven - low);
  }
}
const { pcm, metrics } = stereoMix(
  tracks,
  { guitarL: -0.7, guitarR: 0.7, bass: 0, lead: -0.08, harmony: 0.28, drums: 0 },
  duration,
  [{ source: 'lead', seconds: step * 3, gain: 0.12, pan: 0.5 }],
);
writeFileSync(new URL('menu-rock-v1.wav', out), pcm);
const report = {
  title: 'Full Throttle',
  bpm,
  key: 'E minor / power-chord rock',
  bars,
  ...metrics,
  sections: [
    { at: 0, label: 'Guitar riff' },
    { at: 8 * 16 * step, label: 'Anthem hook' },
    { at: 16 * 16 * step, label: 'Lead break' },
    { at: 24 * 16 * step, label: 'Full-band return' },
  ],
  originalComposition: true,
  externalSamples: false,
  installedInGame: false,
  sources: ['tools/audio/make-menu-rock.mjs', 'tools/audio/synth.mjs', 'tools/audio/music-mix.mjs'],
};
writeFileSync(new URL('track.json', out), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
