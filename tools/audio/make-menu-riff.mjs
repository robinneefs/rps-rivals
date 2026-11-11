// Original menu composition: reuse the game's oscillator/envelope/drum engine.
// Preview only; never overwrites the installed menu/fight music or sound effects.
// node tools/audio/make-menu-riff.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { Buffer32, chord, foldLoop, playDrums, playLine, steps, voice } from './synth.mjs';

const out = new URL('../../art/audio/menu-riff-v1/', import.meta.url);
mkdirSync(out, { recursive: true });
const sr = 44100;
const bpm = 160;
const step = 60 / bpm / 4;
const bars = 32;
const duration = bars * 16 * step;
const tracks = Object.fromEntries(
  ['lead', 'harmony', 'guitar', 'bass', 'arp', 'chords', 'drums'].map((name) => [
    name,
    new Buffer32(sr, duration + 2),
  ]),
);
const chords = [
  'D',
  'Bm',
  'G',
  'A',
  'D',
  'Bm',
  'G',
  'A',
  'D',
  'Bm',
  'G',
  'A',
  'D',
  'Bm',
  'G',
  'A',
  'Em',
  'F#m',
  'G',
  'A',
  'Bm',
  'G',
  'Em',
  'A',
  'D',
  'Bm',
  'G',
  'A',
  'D',
  'G',
  'Em',
  'A',
];
const melody = [
  'F#5 - A5 - B5 A5 . F#5 E5 - F#5 - A5 - . .',
  'F#5 - D5 - F#5 A5 B5 - A5 - F#5 - D5 - . .',
  'G5 - B5 - D6 - B5 A5 G5 - F#5 - E5 - G5 -',
  'E5 - A5 - C#6 - B5 A5 E5 - F#5 G5 A5 - . .',
  'F#5 - A5 - D6 - C#6 B5 A5 - F#5 - E5 F#5 A5 -',
  'B5 - A5 F#5 D5 - F#5 - A5 - B5 - D6 - . .',
  'B5 - G5 - A5 B5 D6 - B5 - A5 - G5 F#5 E5 -',
  'E5 - F#5 G5 A5 - B5 C#6 E6 - C#6 - A5 - E5 -',
  'F#5 - A5 - B5 A5 . F#5 E5 F#5 A5 - D6 - . .',
  'B5 - A5 F#5 D5 - F#5 A5 B5 - D6 - C#6 B5 A5 -',
  'G5 - B5 - D6 - E6 D6 B5 - A5 - G5 - B5 -',
  'C#6 - B5 A5 E5 - A5 - B5 C#6 E6 - C#6 - . .',
  'D6 - A5 - F#5 A5 B5 - A5 - F#5 - E5 F#5 A5 -',
  'B5 - D6 - F#6 - E6 D6 B5 - A5 - F#5 - . .',
  'G5 - A5 B5 D6 - B5 - E6 - D6 - B5 A5 G5 -',
  'A5 - C#6 - E6 - D6 C#6 B5 A5 G5 F#5 E5 - . .',
  'E5 - - - G5 - B5 - D6 - B5 - G5 - . .',
  'F#5 - - - A5 - C#6 - E6 - C#6 - A5 - . .',
  'G5 - A5 B5 D6 - B5 - G5 - E5 - D5 - . .',
  'E5 - F#5 G5 A5 - C#6 - B5 - A5 - E5 - . .',
  'D6 - C#6 B5 F#5 - A5 - B5 - A5 F#5 D5 - . .',
  'B5 - A5 G5 D5 - G5 - A5 - B5 - D6 - . .',
  'E6 - D6 B5 G5 - E5 - G5 A5 B5 - D6 - B5 -',
  'C#6 - B5 A5 G5 F#5 E5 - A5 - B5 C#6 E6 - . .',
  'F#5 - A5 - D6 - C#6 B5 A5 - F#5 - E5 F#5 A5 -',
  'B5 - D6 - F#6 - E6 D6 B5 - A5 - F#5 - D5 -',
  'G5 - B5 - D6 - E6 D6 B5 - A5 - G5 A5 B5 -',
  'C#6 - E6 - F#6 E6 C#6 B5 A5 - E5 - C#6 - . .',
  'D6 - C#6 B5 A5 - F#5 A5 D6 - E6 - F#6 - . .',
  'G6 - F#6 E6 D6 - B5 - A5 - G5 - B5 - D6 -',
  'E6 - D6 B5 G5 - B5 - D6 - B5 A5 G5 F#5 E5 -',
  'A5 - B5 C#6 E6 - C#6 - A5 - E5 - C#5 - E5 -',
].map(steps);
for (const [i, notes] of melody.entries()) {
  if (notes.length !== 16) throw new Error(`Bar ${i + 1} has ${notes.length} steps`);
}

// Diatonic third below: answer the lead without turning every phrase into a block chord.
const scale = ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'];
function thirdBelow(note) {
  if (note === '.' || note === '-') return note;
  const pitch = note.slice(0, -1);
  let degree = scale.indexOf(pitch) - 2;
  let octave = Number(note.at(-1));
  if (degree < 0) {
    degree += 7;
    octave--;
  }
  return `${scale[degree]}${octave}`;
}

const leadPatch = {
  wave: 'square',
  duty: 0.25,
  vol: 0.17,
  attack: 0.003,
  decay: 0.12,
  sustain: 0.46,
  release: 0.022,
  vib: 0.004,
  vibRate: 6.4,
  lowpass: 6800,
};
for (let bar = 0; bar < bars; bar++) {
  const at = bar * 16 * step;
  const bridge = bar >= 16 && bar < 24;
  const name = chords[bar];
  const tones = chord(name, 3);
  const root = tones[0];
  const strong = bar >= 24;
  playLine(tracks.lead, melody[bar], step, at, { ...leadPatch, duty: bridge ? 0.125 : 0.25 });
  if ((bar >= 8 && bar < 16) || strong) {
    playLine(tracks.harmony, melody[bar].map(thirdBelow), step, at, {
      ...leadPatch,
      duty: 0.5,
      vol: strong ? 0.065 : 0.045,
      lowpass: 4700,
    });
  }

  // Picked chip-guitar: palm-muted root notes, open fifths, octave answers and tiny slides.
  const riff = bridge ? [0, 3, 6, 8, 11, 14] : [0, 2, 3, 6, 8, 10, 11, 14];
  for (const [pick, pos] of riff.entries()) {
    const open = pos === 6 || pos === 14;
    const f = root * (pick % 4 === 3 ? 2 : 1);
    const length = step * (open ? 1.6 : 0.66);
    const patch = {
      wave: 'square',
      duty: 0.25,
      dur: length,
      attack: 0.0015,
      decay: 0.055,
      sustain: open ? 0.25 : 0.05,
      release: 0.012,
      lowpass: 3400,
    };
    voice(tracks.guitar, at + pos * step, {
      ...patch,
      f0: f * 0.985,
      f1: f,
      sweep: 0.016,
      vol: bridge ? 0.075 : 0.095,
    });
    voice(tracks.guitar, at + pos * step + 0.003, { ...patch, f0: f * 1.5, vol: open ? 0.06 : 0.028 });
    if (open) voice(tracks.guitar, at + pos * step, { ...patch, wave: 'saw', f0: f * 2, vol: 0.023 });
  }

  // A separate bass player with syncopated fifth/octave motion and a bar-end approach note.
  const bassPattern = [
    [0, 0, 1.5],
    [3, 0, 0.8],
    [6, 7, 1.1],
    [8, 12, 1.5],
    [11, 7, 0.8],
    [14, 0, 0.8],
  ];
  for (const [pos, semis, len] of bassPattern) {
    voice(tracks.bass, at + pos * step, {
      wave: 'tri',
      f0: (root / 2) * 2 ** (semis / 12),
      dur: step * len,
      vol: 0.32,
      attack: 0.002,
      decay: 0.12,
      sustain: 0.5,
      release: 0.014,
    });
  }
  if (bar % 4 === 3)
    voice(tracks.bass, at + 15 * step, {
      wave: 'tri',
      f0: chord(chords[(bar + 1) % bars], 2)[0] * 2 ** (-1 / 12),
      dur: step * 0.8,
      vol: 0.23,
    });

  // Short offbeat chord stabs and a lighter, separately voiced 16th-note sparkle.
  for (const pos of bridge ? [4, 12] : [2, 6, 10, 14]) {
    tones.forEach((f, i) =>
      voice(tracks.chords, at + pos * step + i * 0.004, {
        f0: f * 2,
        duty: 0.125,
        dur: step * 1.1,
        vol: 0.027,
        decay: 0.045,
        sustain: 0.06,
        release: 0.012,
        lowpass: 4200,
      }),
    );
  }
  for (let pos = 0; pos < 16; pos++) {
    if (!bridge && pos % 2 === 0) continue;
    const order = [0, 2, 1, 2, 0, 1, 2, 1];
    voice(tracks.arp, at + pos * step, {
      f0: tones[order[pos % 8]] * 4,
      duty: 0.125,
      dur: step * 0.68,
      decay: 0.035,
      vol: bridge ? 0.028 : 0.021,
      lowpass: 6000,
    });
  }

  // Layered kit: hats can coincide with kick/snare; fills change every four/eight bars.
  playDrums(
    tracks.drums,
    steps(bridge ? 'k . . . . . k . k . . . . . . .' : 'k . . k . . . . k . k . . . . .'),
    step,
    at,
    0.82,
  );
  playDrums(tracks.drums, steps('. . . . s . . . . . . . s . . .'), step, at, 0.82);
  playDrums(
    tracks.drums,
    steps(bar % 4 === 3 ? '. . h . . . h . . . h . . . o h' : 'h . h . h . h . h . h . h . o .'),
    step,
    at,
    bridge ? 0.42 : 0.58,
  );
  if (bar % 4 === 3) {
    const fill = bar % 8 === 7 ? [10, 11, 13, 14, 15] : [14, 15];
    fill.forEach((pos, i) =>
      voice(tracks.drums, at + pos * step, {
        wave: 'tri',
        f0: 260 - i * 28,
        f1: 90 - i * 8,
        sweep: 0.06,
        dur: 0.11,
        decay: 0.035,
        vol: 0.22,
      }),
    );
  }
  if (bar % 8 === 0)
    voice(tracks.drums, at, {
      wave: 'noise',
      f0: 19000,
      dur: 0.42,
      decay: 0.13,
      vol: 0.105,
      highpass: 4200,
      seed: 200 + bar,
    });
}

// Fold release/echo tails across the seam. Stereo is a new mix, using the same mono synth voices.
for (const track of Object.values(tracks)) foldLoop(track, duration);
const n = tracks.lead.data.length;
const left = new Float32Array(n),
  right = new Float32Array(n);
const pans = { lead: 0.04, harmony: -0.36, guitar: -0.4, bass: 0, arp: 0.5, chords: 0.3, drums: 0 };
for (const [name, track] of Object.entries(tracks)) {
  const angle = ((pans[name] + 1) * Math.PI) / 4;
  for (let i = 0; i < n; i++) {
    left[i] += track.data[i] * Math.cos(angle);
    right[i] += track.data[i] * Math.sin(angle);
  }
}
// Dotted-eighth ping-pong echoes: restrained enough to leave the riff and percussion clear.
const delay = Math.round(step * 3 * sr);
for (let i = 0; i < n; i++) {
  left[(i + delay) % n] += tracks.lead.data[i] * 0.14;
  right[(i + delay * 2) % n] += tracks.lead.data[i] * 0.08;
}
// Periodic high-pass settles DC across the loop before mastering.
const a = 1 / (1 + (2 * Math.PI * 20) / sr);
for (const channel of [left, right]) {
  let prevIn = channel[n - 1],
    prevOut = 0;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < n; i++) {
      const value = channel[i];
      const filtered = a * (prevOut + value - prevIn);
      prevIn = value;
      prevOut = filtered;
      if (pass === 1) channel[i] = filtered;
    }
  }
}
let peak = 0;
for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
const gain = 0.88 / peak;
let sumSquares = 0,
  finalPeak = 0;
for (const channel of [left, right]) {
  for (let i = 0; i < n; i++) {
    channel[i] = (Math.tanh(channel[i] * gain) * 0.88) / Math.tanh(0.88);
    finalPeak = Math.max(finalPeak, Math.abs(channel[i]));
    sumSquares += channel[i] ** 2;
  }
}
const pcm = Buffer.alloc(44 + n * 4);
pcm.write('RIFF', 0);
pcm.writeUInt32LE(pcm.length - 8, 4);
pcm.write('WAVEfmt ', 8);
pcm.writeUInt32LE(16, 16);
pcm.writeUInt16LE(1, 20);
pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(sr, 24);
pcm.writeUInt32LE(sr * 4, 28);
pcm.writeUInt16LE(4, 32);
pcm.writeUInt16LE(16, 34);
pcm.write('data', 36);
pcm.writeUInt32LE(n * 4, 40);
for (let i = 0; i < n; i++) {
  pcm.writeInt16LE(Math.round(left[i] * 32767), 44 + i * 4);
  pcm.writeInt16LE(Math.round(right[i] * 32767), 46 + i * 4);
}
writeFileSync(new URL('menu-riff-v1.wav', out), pcm);
const report = {
  title: 'Ready to Rival',
  version: 1,
  bpm,
  key: 'D major',
  bars,
  durationSeconds: duration,
  sampleRate: sr,
  channels: 2,
  peakDbFS: 20 * Math.log10(finalPeak),
  rmsDbFS: 20 * Math.log10(Math.sqrt(sumSquares / (n * 2))),
  seamSampleDelta: [Math.abs(left[0] - left[n - 1]), Math.abs(right[0] - right[n - 1])],
  sections: [
    '0:00 Hook / picked riff',
    '0:12 Harmony variation',
    '0:24 Arpeggio bridge',
    '0:36 Full-band reprise',
  ],
  sources: ['tools/audio/synth.mjs', 'tools/audio/make-menu-riff.mjs'],
  originalComposition: true,
  externalSamples: false,
  installedInGame: false,
};
writeFileSync(new URL('track.json', out), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
