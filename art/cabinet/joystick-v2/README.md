# Joystick polish

Generated with the built-in image tool. Prompts and untouched generations are in source/. The first generated nine-pose sheet exaggerated the down poses. Production uses the subsequently generated component kit, prepared reproducibly by tools/art/prepare-joystick.py.

The same generated base and circular ball are used for all nine frames. A rigid chrome shaft is projected at an equal12-degree physical tilt for all eight directions, with reduced forward/down travel and no image mirroring. Ball diameter128px; same fixed lighting. Perspective depth projection0.55 and height projection0.78 keep the ball above the plate. preparation.json records geometry, source crops, and a pixel comparison of the visible fixed base (zero differences).

Frame registration remains560x560, base width245, base center x280/bottom y430; approved cabinet placement unchanged. Native sheet, individual lossless WebP frames, shared parts, and atlas are exported. Old sprites retained in legacy/. The legacy cabinet builder delegates to this preparation step instead of mirroring left frames.

tools/art/capture-joystick.mjs checks all eight directions and return-to-center at desktop and phone sizes. It also verifies a24px drag stays neutral after the dead zone increase18→28 CSS pixels. Runtime captures and rotation.gif are in runtime/.
