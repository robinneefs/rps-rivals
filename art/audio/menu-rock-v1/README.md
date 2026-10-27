# Full Throttle — menu music experiment 02

Original chip-rock composition at176 BPM,32 bars /43.636 seconds, stereo44.1kHz16-bit WAV. Not installed in the game. First idea Ready to Rival is preserved unchanged in `../menu-riff-v1/`.

Guitar-first arrangement: double-tracked pulse/saw power chords, palm-muted syncopated riffs, picked attacks, guitar-bus drive and filtering, triangle/pulse bass, noise/triangle/sine rock drums, a lower-register pulse lead and final octave harmony. No outside samples, no bright constant arpeggio bed.

- 0:00 riff-led opening
- 0:10.91 anthem hook
- 0:21.82 lead break, beginning over two half-time bars
- 0:32.73 full-band hook return

Rebuild: `node tools/audio/make-menu-rock.mjs`. Reuses `tools/audio/synth.mjs` and shared stereo mastering/export helper `tools/audio/music-mix.mjs`. Tails/lead delay wrap across the loop boundary. Measured levels and sample continuity are recorded in `track.json`.

Local comparison player: http://127.0.0.1:5183/art/audio/menu-rock-v1/preview.html. Check playback with `node tools/audio/check-music-preview.mjs menu-rock-v1` while serving the project root on5183. WAV preview master retained; production OGG/MP3 exports remain deferred until a track is chosen.
