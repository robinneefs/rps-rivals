# Golden Hour — harbor listening preview v1

Original 144 BPM, 32-bar chiptune-funk composition for Sunset Harbor. 53.333 seconds, 44.1 kHz stereo 16-bit WAV. Rounded syncopated triangle/sine bass, electric-piano-style synthesized chord stabs, pulse lead hook, short answering phrases, sparse bell accents and crisp backbeat. A-minor/C-major color with sevenths and E7 turnarounds. All sounds synthesized with the project's original engine; no external samples.

Sections: 0:00 hook/groove; 0:13 answers/bells; 0:27 contrasting middle; 0:40 fuller hook reprise. Delay tails are folded into the loop. track.json records measured peak/RMS and seam deltas; master peak is below -1dBFS and no invalid samples are accepted. These are numerical audio checks, not a claim of a listening review.

Listen to golden-hour.wav. Generate with `node tools/audio/make-harbor-theme.mjs`. Uses tools/audio/synth.mjs and music-mix.mjs. User approved this version and requested installation. `tools/audio/install-harbor-theme.mjs` encodes the approved master as stage-golden-hour.ogg/.mp3; Sunset Harbor selects music.harbor. Rooftop and Storm Field retain their own themes. Same project license as existing synthesized tracks. `node tools/audio/check-harbor-theme.mjs` verifies actual stage selection and stereo decoding of both formats; results are in browser-checks.json.
