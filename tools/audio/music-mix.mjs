// Shared, dependency-free stereo mastering/export for soundtrack experiments.
import { foldLoop } from './synth.mjs';

export function stereoMix(tracks, pans, duration, echoes = []) {
  for (const track of Object.values(tracks)) foldLoop(track, duration);
  const sr = Object.values(tracks)[0].sr;
  const n = Object.values(tracks)[0].data.length;
  const left = new Float32Array(n),
    right = new Float32Array(n);
  for (const [name, track] of Object.entries(tracks)) {
    const angle = (((pans[name] ?? 0) + 1) * Math.PI) / 4;
    for (let i = 0; i < n; i++) {
      left[i] += track.data[i] * Math.cos(angle);
      right[i] += track.data[i] * Math.sin(angle);
    }
  }
  for (const { source, seconds, gain, pan } of echoes) {
    const delay = Math.round(seconds * sr);
    const angle = ((pan + 1) * Math.PI) / 4;
    for (let i = 0; i < n; i++) {
      left[(i + delay) % n] += tracks[source].data[i] * gain * Math.cos(angle);
      right[(i + delay) % n] += tracks[source].data[i] * gain * Math.sin(angle);
    }
  }
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
  let squares = 0,
    finalPeak = 0;
  for (const channel of [left, right])
    for (let i = 0; i < n; i++) {
      channel[i] = (Math.tanh(channel[i] * gain) * 0.88) / Math.tanh(0.88);
      if (!Number.isFinite(channel[i])) throw new Error('Invalid sample');
      squares += channel[i] ** 2;
      finalPeak = Math.max(finalPeak, Math.abs(channel[i]));
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
  return {
    pcm,
    metrics: {
      sampleRate: sr,
      channels: 2,
      durationSeconds: n / sr,
      peakDbFS: 20 * Math.log10(finalPeak),
      rmsDbFS: 20 * Math.log10(Math.sqrt(squares / (2 * n))),
      seamSampleDelta: [Math.abs(left[0] - left[n - 1]), Math.abs(right[0] - right[n - 1])],
    },
  };
}
