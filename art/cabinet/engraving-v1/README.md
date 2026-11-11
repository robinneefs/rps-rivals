# Cabinet inscriptions

Live text on the control-panel front lip: G Genie at the left, v + VERSION at the right. VERSION is injected from apps/game/package.json, so future version bumps automatically update the engraving.

Rock Salt by Sideshow, self-hosted with Apache2.0 license retained. Styling in apps/game/src/cabinet/engraving.css: dark groove, small lit lower edge, slight uneven angles. Text lives in cabinet coordinates, scales/shakes with the cabinet, and ignores pointer input. No changes to the cabinet artwork or controls.

Capture desktop/phone and verify the version, font load, and pointer pass-through with node tools/art/capture-cabinet-engraving.mjs (local production preview on5181).
