// Every number that changes how the game *feels*. Changing these never changes who wins
// (rules and phase timings live in packages/core/src/config.ts). A magic number in a view is a bug.
export const tuning = {
  versus: {
    closeMs: 420,
    holdMs: 2800,
    openMs: 240,
    impactMs: 260,
    impactPx: 5,
    cabinetPx: 4,
    cabinetMs: 280,
    sparkCount: 36,
    sparkMs: 650,
    crtJoltMs: 120,
  },
  reveal: {
    /**
     * Move badges pop in beside the fighters (badgeOutPx out from them, at badgeY), wait, then fly
     * from flyAtMs to the middle and collide at impactAtMs. The winner slides to the centre; the
     * loser is knocked off screen in loserFlyMs, turning a quarter every loserSpinMs. A tie bounces
     * both back by tieBouncePx.
     */
    badgePopMs: 200,
    badgePopFromPx: 10,
    badgeOutPx: 24,
    badgeY: 102,
    clashY: 96,
    flyAtMs: 300,
    loserFlyMs: 480,
    loserSpinMs: 70,
    tieBouncePx: 14,
    tieBounceMs: 240,
    flashMs: 60,
    /**
     * The verdict: the rule ("ROCK BEATS SCISSORS") at ruleY, then after hitLineDelayMs who hit
     * ("YOU HIT!", "RIVAL HITS!") at verdictY, both in the winner's colour. A tie: "CLASH!" and
     * "NO DAMAGE". While the badges fly each carries its owner's name, ownerGapPx above it.
     */
    ruleY: 52,
    verdictY: 65,
    hitLineDelayMs: 140,
    ownerGapPx: 10,
    /** The damage number hops up damageHopPx, then falls damageFallPx over damageFallMs. */
    damageHopPx: 4,
    damageFallPx: 22,
    damageFallMs: 620,
    /** Fighters swing into their move at this point of the reveal... */
    strikeAtMs: 420,
    /** ...and the hit lands here (the badges collide here too). */
    impactAtMs: 620,
    /** Back to idle (the reveal phase itself is timed by the referee). */
    recoverAtMs: 1400,
    /** Badges, verdict and damage number are cleared away. */
    clearAtMs: 1550,
    /** Close the wider idle gap for contact, then step back on recovery. */
    lungePx: 14,
    guardStepPx: 12,
    recoilPx: 2,
  },
  hitPause: { byDamage: { 10: 50, 15: 70, 20: 90 } as Record<number, number> },
  shake: { byDamage: { 10: 2, 15: 3, 20: 4 } as Record<number, number>, durationMs: 280, koPx: 5 },
  /**
   * Phone vibration (Options > VIBRATION) on every screen shake, scaled to it: msPerPx of buzz per
   * pixel of shake, kept between minMs and maxMs so it is felt but never harsh. Shakes up to
   * lightUpToPx are a light buzz, up to mediumUpToPx medium, bigger heavy (strength only in the
   * Android app; browsers just buzz longer). A K.O. is koPattern (buzz, pause, buzz). A weaker buzz
   * within quietAfterMs of a stronger one is dropped.
   */
  haptics: {
    msPerPx: 8,
    minMs: 12,
    maxMs: 40,
    lightUpToPx: 1,
    mediumUpToPx: 3,
    quietAfterMs: 120,
    koPattern: [40, 70, 20],
  },
  flash: { frames: 2, frameMs: 33 },
  /** The K.O. hit freezes on a white frame for freezeMs, then plays at slowScale speed for slowMs (real time). */
  ko: { freezeMs: 110, flashAlpha: 0.85, slowScale: 0.3, slowMs: 650 },
  /** Hit sparks in the winning move's colours, more for bigger hits; dust kicks up behind a lunge. */
  sparks: {
    countByDamage: { 10: 8, 15: 11, 20: 14 } as Record<number, number>,
    speedMin: 50,
    speedMax: 120,
    spreadDeg: 110,
    gravity: 260,
    lifeMs: 380,
    sizePx: 3,
  },
  dust: { count: 5, speedMin: 12, speedMax: 30, gravity: -20, lifeMs: 360, sizePx: 3 },
  /** HUD health animation and fixed-size timer. Ticks start at timerWarnMs; red from timerRedMs. */
  hud: {
    drainMs: 600,
    trailDelayMs: 120,
    lowHealth: 15,
    /** At low health the bar pulses brighter and its frame flashes red, flipping every lowPulseMs. */
    lowPulseMs: 260,
    timerWarnMs: 3000,
    timerRedMs: 2000,
    timerSlamHoldMs: 450,
    /** The hurt fighter's bar flashes white hitFlashes times, hitFlashMs per flash and per gap. */
    hitFlashes: 3,
    hitFlashMs: 60,
  },
  /**
   * Cabinet buttons. releaseMs: how long a quick tap stays down. Lock-in: the chosen button flashes
   * white `lockFlashes` times (`lockFlashMs` per flash and gap) while a ring pops out round it,
   * one ring frame every `ringFrameMs`.
   */
  /** Buttons: press and lock-in timings; a glint sweeps them every shineGapMs (frames shineFrameMs apart). */
  buttons: {
    releaseMs: 80,
    lockFlashes: 2,
    lockFlashMs: 45,
    ringFrameMs: 45,
    shineGapMs: 6000,
    shineFrameMs: 50,
    shineStaggerMs: 110,
  },
  /**
   * Joystick: a drag must go dragDeadzonePx (CSS pixels) before it tilts at all; within
   * axisSnapDeg of straight up, down, left or right it stays on that axis (no accidental
   * diagonals). Let go, it springs back after springBackMs, flicks the other way for wobbleMs,
   * and settles.
   */
  joystick: { springBackMs: 90, dragDeadzonePx: 28, axisSnapDeg: 30, wobbleMs: 60 },
  idle: { breatheEveryMs: 420 },
  intro: { delayMs: 180, popMs: 650, holdMs: 1400, sheenDelayMs: 160, sheenMs: 900 },
  /** Screen changes: the CRT closes to a line (closeMs), the line shrinks to a dot (lineMs), it stays off (offMs), then back on; a frame every stepMs. */
  transitions: { closeMs: 120, lineMs: 80, offMs: 60, stepMs: 20 },
  /** Menus; the backdrop's diagonal stripes move one pixel every stripeStepMs. */
  menu: { cursorBlinkMs: 400, repeatDelayMs: 300, stripeStepMs: 90 },
  banner: { slamMs: 180, holdMs: 900 },
  /**
   * Who is who. Before round 1 a "YOU VS RIVAL" card holds for vsCardMs, then "ROUND 1" slams in.
   * A "YOU" / "RIVAL" tag with an arrow bobs over each fighter (by bobPx every bobMs) through the
   * first tagRounds rounds; at the start of the next round it blinks out (blinkTimes, blinkMs each).
   */
  identity: {
    vsCardMs: 850,
    vsSlideMs: 220,
    tagRounds: 0,
    bobPx: 1,
    bobMs: 320,
    blinkTimes: 3,
    blinkMs: 110,
  },
  /** "PICK YOUR MOVE" and, for the first arrowTurns picks of a match, "▼ PRESS A BUTTON ▼" under it. */
  prompt: { arrowTurns: 1 },
  /**
   * The whole cabinet rattles against the room: on a K.O., on a hit of bigHitDamage or more,
   * and once when the pick timer runs out. It moves to a new offset every shakeStepMs.
   */
  cabinet: {
    shakeStepMs: 40,
    koPx: 3,
    koMs: 480,
    bigHitDamage: 20,
    bigHitPx: 1,
    bigHitMs: 180,
    timeUpPx: 2,
    timeUpMs: 140,
  },
  /**
   * CRT screen (Options > CRT SCREEN): glow is how much bright colours bleed, vignette darkens the
   * edges, cornerRadius rounds the corners (fraction of the screen), roll is the slow bright band.
   * Display-resolution texture: scanlineAlpha darkens rows, scanlineThickness controls their
   * duty cycle, and texturePitch sets spacing in display pixels, above the game pixel raster.
   */
  crt: {
    glow: 1.63,
    /** Midtone lift after the scanline/mask loss; keeps black/white endpoints intact. */
    gamma: 1,
    vignette: 0.61,
    cornerRadius: 0.06,
    roll: 0.15,
    /** Small one-native-pixel channel fringe, separate from the strong K.O. split. */
    colorFringe: 0.14,
    texturePitch: 4,
    scanlineThickness: 0.35,
    scanlineAlpha: 0.2,
    phosphorMask: 0,
    /** Impact effects (on even with the CRT look off): colour split on a K.O., row warp on big hits. */
    koSplitPx: 3,
    koSplitMs: 900,
    bigHitWarpPx: 2,
    bigHitWarpMs: 260,
  },
  /**
   * The marquee light flickers every minGapMs to maxGapMs, on its own: dips darken the art to
   * dimAlpha, blackouts to blackoutAlpha, and it flashes surgeAlpha bright for surgeMs as it comes back.
   */
  marquee: {
    minGapMs: 1500,
    maxGapMs: 4500,
    dimAlpha: 0.45,
    blackoutAlpha: 0.7,
    surgeAlpha: 0.1,
    surgeMs: 50,
    /**
     * The art sits recessed in the cabinet (cabinet units, read once at start): a dark seam round
     * the edge, a shadow cast down by the top bezel, a softer one in from every side, and a
     * vignette that darkens the corners.
     */
    seamPx: 1.5,
    seamAlpha: 0.6,
    topShadowPx: 12,
    topShadowAlpha: 0.75,
    bottomShadowPx: 12,
    bottomShadowAlpha: 0.75,
    edgeShadowPx: 14,
    edgeShadowAlpha: 0.55,
    vignetteAlpha: 0.35,
  },
  result: { delayAfterMatchMs: 400 },
  /** Online: how long "RIVAL LEFT" and other ending messages stay up before going home; lobby text blink. */
  online: { endedHoldMs: 3500, waitBlinkMs: 500 },
} as const;
