# One More Round — menu experiment 03

User direction: focus on the previous track's anthem-hook feel; rock, straightforward, simple, catchy. Original composition, not a cover or an edit of a reference song.

- 168 BPM, E minor,32 bars/45.714 seconds,44.1kHz16-bit stereo WAV.
- One four-bar refrain repeated over E5/C5/G5/D5 power chords (chord names, not octaves). The melodic rhythm repeats with clear spaces between phrases.
- Steady eighth-note driven chip guitars, root-note bass, kick/snare rock backbeat, light hats. No guitar solo, fast lead runs, constant arpeggios or extra riff sections.
- Arrangement changes are small: octave support at11.43s, lighter strumming at22.86s, full hook at34.29s. Same tune throughout.

Approved and installed as the menu theme. Rebuild the master with `node tools/audio/make-menu-anthem.mjs`, then encode/install with `node tools/audio/install-menu-anthem.mjs` (ffmpeg on PATH or `RPS_FFMPEG` set). Uses the existing project synth and `music-mix.mjs`; original synthesized material, no samples. Production selects `menu-one-more-round.ogg` with MP3 fallback under the existing menu music key. Old `menu.*`, fight music and the previous experiments are preserved.

Player on5183/art/audio/menu-anthem-v1/preview.html compares with Full Throttle. `track.json` contains peak/RMS and loop seam measurements. Browser check: `node tools/audio/check-music-preview.mjs menu-anthem-v1`.
