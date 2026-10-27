# Ready to Rival — menu music experiment 01

Original composition for RPS Rivals. Preview only: existing game music, effects, and visuals remain unchanged.

- 160 BPM, D major, 4/4, 32 bars / 48 seconds.
- 0:00 hook and syncopated picked riff; 0:12 harmony variation; 0:24 arpeggio bridge; 0:36 full-band reprise.
- Seven arranged buses: pulse lead, harmony pulse, picked pulse/saw power-chord guitar, triangle bass, pulse arpeggios, offbeat chord stabs, and synthesized noise/triangle drums.
- Stereo positioning and dotted-eighth lead echoes; note releases and echo tails wrap across the loop boundary.
- 44.1kHz, 16-bit stereo WAV. `track.json` records measured peak/RMS and seam values. Original synthesized material, no samples or external songs.

Rebuild from the project root: `node tools/audio/make-menu-riff.mjs`. Uses the existing dependency-free `tools/audio/synth.mjs`; does not run the legacy asset generator or overwrite production tracks.

Open `preview.html` over a local HTTP server to hear/loop the track, jump to its sections, and compare the existing menu music. WAV is the lossless preview master; OGG/MP3 delivery exports can be made once the composition is approved (the existing production generator uses ffmpeg, currently unavailable on PATH).
