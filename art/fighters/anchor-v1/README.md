# Anchor: first combat sheet review

Generated with built-in image generation, using Anchor's existing close-up portrait, the central full-body character in `docs/mockups/v2/8-characters-taiko-anchor-riot.webp`, and the original Taiko/Riot production sheet sources as references. Original outputs remain intact under `source/`: `generated.png` is the first background-bearing attempt; `transparent.png` removes that background; `consistent.png` improves the victory pose. The design brief and both edit prompts are retained alongside them.

## Native preparation

Run `node tools/art/prepare-anchor-sheet.mjs` with sharp installed or `RPS_SHARP_PATH` pointing to it. The same connected-component separation, alpha threshold, nearest-neighbour conversion and named atlas contract as the Taiko/Riot preparation are used. Nine independent, complete components are required. Pixels below alpha128 are discarded; retained pixels are opaque. Frames are packed without trimming.

- Idle silhouette: **114 native pixels**, versus the other sheets'100, on the same floor. Anchor's extra size comes from the body and legs; the aim is a tall heavyweight rather than an enlarged head.
- **160×160 cells**, foot origin **80,156**. Existing Taiko/Riot remain128×128 with origin64,124. The larger transparent cell does not mean scaling the fighter down.
- A single source scale is set from idle. Victory receives1.12× and kick1.06× source-scale correction after comparing head/body proportions visually; this corrects remaining generator shrinkage rather than equalizing outer pose heights. These are hand-reviewed corrections, not a rigorous skeletal reconstruction. Pose/body proportions remain subject to visual approval.
- Idle/inhale/punch/block/shove/hurt/KO/win/kick native silhouette heights are114/113/113/112/111/103/29/134/103. The raised victory hand is correctly taller than idle; the horizontal KO is naturally shallow. Full placement/component bounds and scales are recorded in `native-192/alignment.json`.
- No pose may clip its160px cell. The kick's planted foot is30px behind the shared anchor. These geometry values must accompany any future gameplay integration.

Runtime review atlas: `apps/game/public/assets/experiments/anchor-v1.png` and `.json`. Unpacked frames and enlarged sheet: `native-192/`.

## In-game review

Development-only route **http://127.0.0.1:5184/?art=anchor-sheet** loads `AnchorSheetPreviewScene.ts`. Uses the real192×240 framebuffer, current rooftop/clouds/cabinet and unchanged CRT. Pose/loop controls and Taiko/Riot comparison are outside the monitor. Common world floor221; Anchor native114px against100px rivals. To display the entire leaning kick and horizontal KO within the monitor, those two review poses move13px/10px right respectively; production movement/spacing still needs to account for the wider body before gameplay integration.

`tools/art/capture-anchor-sheet.mjs` exercises all9 poses and both comparison fighters, checks native snapshot dimensions and asset/page failures, and saves desktop/phone/CRT captures under `review/`. All passed. `poses-in-game-2x.png` is a grid of actual game snapshots enlarged with nearest sampling.

**Review artwork only. Anchor is still COMING SOON in the playable lineup.** No substituted fighter sheet, new balance/traits, protocol, fight rules or existing character geometry changes. Approve this visual direction before completing her gameplay integration. Sources and existing art remain preserved; no commit/push/deployment/package-version change.
