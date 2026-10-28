# Foundry Floor v2 — still review

Built-in imagegen used approved rooftop-v2 as the medium-detail style/pixel-density reference and foundry-v1 as subject/composition guide. Exact prompt saved in generation-prompt.txt; original generation preserved. Refined pipe sections, chunky gear teeth, broad steel highlights and localized orange furnace light.

Native export192×240, nearest-neighbor, indexed PNG capped at40colors, no dithering. Gameplay/cabinet/phone captures use actual Riot/Taiko, HUD, CRT and stance shadows. No page/asset errors in review-checks.json. Reproduce with `node tools/art/preview-three-stage-concepts.mjs --foundry-v2` and RPS_SHARP_PATH if needed.

Static local preview at `?menuReview=stage&stage=foundry-floor`, excluded from normal match/rematch rotation and production stage registration. The generator placed upper side pipes near row50 despite the prompt's requested row74 start; persistent HUD rows0–47 remain clear. Assess before final layer extraction. Gear/furnace/sparks remain unanimated. Planned next layers: clean machinery background, isolated complete gear behind pipe occluders, furnace fire/glow, occasional distant sparks, fixed rail/floor.
