# Rooftop menu revision

2026-10-25. User chose the middle Rooftop Crew concept. Revised with built-in imagegen, original in generated.png, exact prompt in prompt.txt. Only menu choices: PLAY VERSUS CPU, PLAY ONLINE, OPTIONS. No HOW TO PLAY or control hint.

True native review export: native-192x240.png. Exact nearest 4x enlargement: review-4x.png. Rebuild with `node tools/art/prepare-menu-mockup.mjs` (sharp or RPS_SHARP_PATH). Generated source is enlarged pixel-like art, not source-aligned native pixels; nearest downsampling establishes the real 192x240 grid but loses fine facial/letter detail. Production should use separate background artwork and runtime bitmap menu labels. Mockup only; game files unchanged.
