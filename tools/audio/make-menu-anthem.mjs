// A hook-first chip-rock alternative: one four-bar refrain, no solo or busy riff section.
// node tools/audio/make-menu-anthem.mjs — leaves every previous preview/game asset untouched.
import { mkdirSync, writeFileSync } from 'node:fs';
import { Buffer32, hz, playLine, steps, voice } from './synth.mjs';
import { stereoMix } from './music-mix.mjs';

const out = new URL('../../art/audio/menu-anthem-v1/', import.meta.url);
mkdirSync(out, { recursive: true });
const bpm = 168,
  bars = 32,
  sr = 44100;
const step = 60 / bpm / 4;
const duration = bars * 16 * step;
const tracks = Object.fromEntries(
  ['guitarL', 'guitarR', 'bass', 'lead', 'octave', 'drums'].map((name) => [
    name,
    new Buffer32(sr, duration + 2),
  ]),
);
const roots = ['E', 'C', 'G', 'D'];
// Identical rhythmic call/answer each time: leave room to remember and hum the melody.
const hook = [
  'B4 - E5 - G5 - - - F#5 - E5 - - - . .',
  'G5 - E5 - D5 - - - E5 - - - . . . .',
  'D5 - G5 - A5 - - - G5 - D5 - - - . .',
  'F#5 - E5 - D5 - - - E5 - F#5 - - - . .',
].map(steps);
for (const line of hook) if (line.length !== 16) throw new Error('Hook bar must have 16 steps');

function strum(buffer, at, root, len, gain, side) {
  const patch = {
    dur: len * step,
    attack: 0.002,
    decay: 0.09,
    sustain: 0.3,
    release: 0.016,
    lowpass: 2700,
    highpass: 90,
  };
  const detune = side ? 1.002 : 0.998;
  voice(buffer, at + side * 0.005, { ...patch, wave: 'saw', f0: root * detune, vol: gain });
  voice(buffer, at + 0.003, {
    ...patch,
    wave: 'square',
    duty: 0.5,
    f0: root * 1.5 * detune,
    vol: gain * 0.58,
  });
  voice(buffer, at + 0.005, {
    ...patch,
    wave: 'square',
    duty: 0.25,
    f0: root * 2 * detune,
    vol: gain * 0.14,
  });
}

for (let bar = 0; bar < bars; bar++) {
  const at = bar * 16 * step;
  const root = hz(`${roots[bar % 4]}3`);
  const lighter = bar >= 16 && bar < 20;
  const big = bar >= 24;
  const lead = {
    wave: 'square',
    duty: 0.25,
    vol: lighter ? 0.125 : 0.155,
    attack: 0.004,
    decay: 0.15,
    sustain: 0.58,
    release: 0.03,
    vib: 0.004,
    vibRate: 5.5,
    vibDelay: 0.17,
    lowpass: 4000,
  };
  playLine(tracks.lead, hook[bar % 4], step, at, lead);
  if ((bar >= 8 && bar < 16) || big) {
    playLine(
      tracks.octave,
      hook[bar % 4].map((note) =>
        note === '.' || note === '-' ? note : `${note.slice(0, -1)}${Number(note.at(-1)) - 1}`,
      ),
      step,
      at,
      { ...lead, duty: 0.5, vol: big ? 0.05 : 0.032, lowpass: 2800 },
    );
  }

  // Straight eighth-note downstrokes, four power chords, no extra passing/chug notes.
  for (const pos of lighter ? [0, 4, 8, 12] : [0, 2, 4, 6, 8, 10, 12, 14]) {
    const accent = pos === 0 || pos === 8;
    const len = lighter ? 3.5 : accent ? 1.8 : 1.35;
    const level = (accent ? 0.18 : 0.145) * (lighter ? 0.75 : 1);
    strum(tracks.guitarL, at + pos * step, root, len, level, 0);
    strum(tracks.guitarR, at + pos * step, root, len, level, 1);
    voice(tracks.bass, at + pos * step, {
      wave: 'tri',
      f0: root / 2,
      dur: step * (lighter ? 3.1 : 1.5),
      vol: accent ? 0.32 : 0.27,
      attack: 0.002,
      decay: 0.12,
      sustain: 0.6,
      release: 0.012,
    });
  }

  // Backbeat stays steady; only the end of each eight-bar phrase gets a short fill.
  for (const pos of lighter ? [0, 8] : [0, 6, 8, 10]) {
    voice(tracks.drums, at + pos * step, {
      wave: 'sine',
      f0: 150,
      f1: 44,
      sweep: 0.055,
      dur: 0.17,
      decay: 0.065,
      vol: 0.46,
    });
    voice(tracks.drums, at + pos * step, {
      wave: 'noise',
      f0: 3800,
      dur: 0.012,
      decay: 0.004,
      vol: 0.07,
      seed: bar * 17 + pos + 1,
    });
  }
  const snares = bar % 8 === 7 ? [4, 12, 14, 15] : [4, 12];
  snares.forEach((pos, index) => {
    voice(tracks.drums, at + pos * step, {
      wave: 'noise',
      f0: 12000,
      dur: 0.15,
      decay: 0.045,
      vol: index < 2 ? 0.255 : 0.16,
      highpass: 1100,
      seed: bar * 31 + pos + 101,
    });
    voice(tracks.drums, at + pos * step, {
      wave: 'tri',
      f0: 215,
      f1: 140,
      dur: 0.08,
      decay: 0.025,
      vol: index < 2 ? 0.17 : 0.11,
    });
  });
  for (let pos = 0; pos < 16; pos += lighter ? 4 : 2) {
    voice(tracks.drums, at + pos * step, {
      wave: 'noise',
      f0: 20000,
      dur: big ? 0.07 : 0.04,
      decay: big ? 0.026 : 0.013,
      highpass: 6000,
      vol: pos % 4 === 0 ? 0.068 : 0.045,
      seed: bar * 23 + pos + 5,
    });
  }
  if (bar % 8 === 0)
    voice(tracks.drums, at, {
      wave: 'noise',
      f0: 19000,
      dur: 0.48,
      decay: 0.15,
      highpass: 4300,
      vol: 0.105,
      seed: bar + 700,
    });
}

for (const name of ['guitarL', 'guitarR']) {
  const track = tracks[name];
  let low = 0;
  const a = 1 - Math.exp((-2 * Math.PI * 3400) / sr);
  for (let i = 0; i < track.data.length; i++) {
    const driven = Math.tanh(track.data[i] * 2.8) * 0.24;
    track.data[i] = low += a * (driven - low);
  }
}
const { pcm, metrics } = stereoMix(
  tracks,
  { guitarL: -0.65, guitarR: 0.65, bass: 0, lead: 0, octave: 0.25, drums: 0 },
  duration,
  [{ source: 'lead', seconds: step * 2, gain: 0.075, pan: -0.4 }],
);
writeFileSync(new URL('menu-anthem-v1.wav', out), pcm);
const report = {
  title: 'One More Round',
  bpm,
  bars,
  key: 'E minor',
  ...metrics,
  sections: [
    { at: 0, label: 'Main hook' },
    { at: 8 * 16 * step, label: 'Hook doubled' },
    { at: 16 * 16 * step, label: 'Lighter return' },
    { at: 24 * 16 * step, label: 'Final hook' },
  ],
  originalComposition: true,
  externalSamples: false,
  approvedMenuTheme: true,
  sources: ['tools/audio/make-menu-anthem.mjs', 'tools/audio/synth.mjs', 'tools/audio/music-mix.mjs'],
};
writeFileSync(new URL('track.json', out), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
