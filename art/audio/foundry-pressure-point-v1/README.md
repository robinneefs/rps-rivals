# Pressure Point — foundry listening preview

Original156BPM industrial chip-metal track,32bars/49.231seconds. E-Phrygian riff with chromatic/tritone tension, gated stereo-detuned saw/pulse power dyads, driven bass, saturated kick/snare, synthesized struck-steel/short-loop metallic noise and brief mechanical warning accents. Half-time hydraulic-press-style breakdown from0:25 before a full-force reprise at0:37. No external samples or borrowed melody. All synthesis uses the project's synth.mjs and music-mix.mjs, under the repository LICENSE.

Listen to pressure-point.wav (44.1kHz stereo16-bit). Generate using `node tools/audio/make-foundry-theme.mjs`. Riff buses are saturated and briefly ducked around kick hits to preserve punch. Drum-bus saturation controls peaks; final measured RMS is about−14.24dBFS with peak below−1dBFS. Echo/release tails fold into the loop; track.json records finite-sample/peak/loop-seam checks. These numerical checks are not a claim of a listening review.

User approved this version and requested installation. tools/audio/install-foundry-theme.mjs encodes the approved WAV into stage-pressure-point.ogg/.mp3, selected by Foundry Floor's music.foundry key. Other stage music is unchanged. tools/audio/check-foundry-theme.mjs verifies actual selection across all five stages and stereo decoding of both new formats; results in browser-checks.json.
