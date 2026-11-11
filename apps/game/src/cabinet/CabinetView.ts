import { Emitter, type Move } from '@rps/core';
import { MONITOR } from '../config/layout';
import { tuning } from '../config/tuning';
import type { CabinetShake } from '../fx/cabinetShake';
import type { StickTilt } from '../input/InputRouter';
import { addCabinetEngravings } from './engraving';
import {
  BODY,
  BUTTON,
  fitCabinet,
  JOYSTICK,
  MARQUEE,
  MARQUEE_RAIL,
  PANEL,
  SCREEN,
  PIXEL_SCREEN,
  PIXEL_SCREEN_INSET,
  stickDirection,
  type CabinetFit,
} from './geometry';

const MOVES: readonly Move[] = ['rock', 'paper', 'scissors'];

/** Glow colour of each lit button (the caps' own colours). */
const GLOW: Record<Move, string> = { rock: '#ff2d6f', paper: '#ffd21f', scissors: '#25c9ff' };

const STICK_FRAME: Record<string, string> = {
  '-1,-1': 'ul',
  '0,-1': 'u',
  '1,-1': 'ur',
  '-1,0': 'l',
  '0,0': 'c',
  '1,0': 'r',
  '-1,1': 'dl',
  '0,1': 'd',
  '1,1': 'dr',
};

/**
 * Marquee flicker patterns, one picked at random each time: steps of a level and how many ms it
 * holds. Levels: d = dip (tuning.marquee.dimAlpha), h = half a dip, D = blackout, - = lit.
 */
const FLICKERS = [
  'd40 -60 d30 -140',
  'D70 -50',
  'd30 -40 d30 -40 D30 -260',
  'd25 -25 d25 -25 d25 -25 d25',
  'D90 h30 D60 -40 d30',
  'D320 d40 D50 -30 D40',
];

export interface CabinetHandlers {
  press: (move: Move) => void;
  release: (move: Move) => void;
  stick: (tilt: StickTilt) => void;
  stickClick: () => void;
}

/** Where the monitor is, for the game canvas: its size in CSS and device pixels. */
export interface ScreenSize {
  cssWidth: number;
  cssHeight: number;
  deviceWidth: number;
  deviceHeight: number;
}

/**
 * The arcade cabinet as a page layer (v2.0): the painted art (not pixel art) round the game canvas,
 * which sits in the screen opening. Fits itself to the visible part of the window, inside the
 * phone's safe area, and refits whenever that changes (the browser's bars sliding in and out
 * included). Owns the buttons, the joystick and the marquee light; the whole thing rattles with
 * the cabinet shake.
 */
export class CabinetView {
  /** The game canvas goes in here (Phaser's parent). */
  readonly screen: HTMLDivElement;
  private readonly root: HTMLDivElement;
  private readonly probe: HTMLDivElement;
  private readonly events = new Emitter<{ resize: ScreenSize }>();
  private fit: CabinetFit = { scale: 1, left: 0, top: 0 };
  private pixelPerfect = false;
  private readonly buttons: Record<
    Move,
    { el: HTMLDivElement; up: HTMLImageElement; down: HTMLImageElement }
  >;
  private readonly sticks = new Map<string, HTMLImageElement>();
  private readonly ring: HTMLDivElement;

  private readonly down = new Set<Move>();
  private selected: Move | null = null;
  private flashing = false;
  private hovered: Move | null = null;
  private readonly shining = new Set<Move>();
  private lockTimer: ReturnType<typeof setTimeout> | null = null;
  private stickDir: StickTilt = { x: 0, y: 0 };
  private wobbleTimers: ReturnType<typeof setTimeout>[] = [];

  constructor(
    private readonly handlers: CabinetHandlers,
    private readonly shake: CabinetShake,
  ) {
    const room = el('div', document.body, {
      position: 'fixed',
      inset: '-24px',
      background: `#0b0716 url(assets/cabinet/room.webp) center / cover no-repeat`,
      filter: 'blur(5px) brightness(0.55)',
    });
    room.id = 'room';
    // reads the phone's safe area (notch, home bar) through CSS
    this.probe = el('div', document.body, {
      position: 'fixed',
      inset: '0',
      visibility: 'hidden',
      pointerEvents: 'none',
      paddingTop: 'env(safe-area-inset-top)',
      paddingRight: 'env(safe-area-inset-right)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)',
    });

    this.root = el('div', document.body, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: `${BODY.width}px`,
      height: `${BODY.height}px`,
      transformOrigin: '0 0',
    });
    this.root.id = 'cabinet';

    this.screen = el('div', this.root, box(SCREEN.x, SCREEN.y, SCREEN.width, SCREEN.height));
    Object.assign(this.screen.style, { background: '#000', overflow: 'hidden' });
    this.screen.id = 'game';
    img(this.root, BODY.src, { ...box(0, 0, BODY.width, BODY.height), pointerEvents: 'none' });
    // Hide the hairline colour fringe baked into the cabinet's keyed screen opening.
    el('div', this.root, {
      ...box(SCREEN.x - 2, SCREEN.y - 2, SCREEN.width + 4, SCREEN.height + 4),
      boxShadow: 'inset 0 0 0 3px #000',
      pointerEvents: 'none',
      zIndex: '2',
    });
    img(
      this.root,
      MARQUEE_RAIL.src,
      box(MARQUEE_RAIL.x, MARQUEE_RAIL.y, MARQUEE_RAIL.width, MARQUEE_RAIL.height),
    );
    const marqueeWindow = el('div', this.root, {
      ...box(MARQUEE.x, MARQUEE.y, MARQUEE.width, MARQUEE.height),
      overflow: 'hidden',
      pointerEvents: 'none',
      background: '#10172d',
    });
    marqueeWindow.id = 'marquee';
    const marquee = img(marqueeWindow, MARQUEE.src, {
      // Slight overscan prevents a fractional CSS-scale seam inside the clipped opening.
      ...box(
        -MARQUEE.bleed,
        -MARQUEE.bleed,
        MARQUEE.width + MARQUEE.bleed * 2,
        MARQUEE.height + MARQUEE.bleed * 2,
      ),
      objectFit: 'cover',
      objectPosition: 'center',
    });
    this.flickerMarquee(marquee);
    // shade over the art, so it looks set into the cabinet rather than pasted on
    const m = tuning.marquee;
    el('div', marqueeWindow, {
      ...box(0, 0, MARQUEE.width, MARQUEE.height),
      pointerEvents: 'none',
      boxShadow: [
        `inset 0 0 0 ${m.seamPx}px rgba(0,0,0,${m.seamAlpha})`,
        `inset 0 ${m.topShadowPx}px ${m.topShadowPx}px -${m.topShadowPx / 2}px rgba(0,0,0,${m.topShadowAlpha})`,
        `inset 0 -${m.bottomShadowPx}px ${m.bottomShadowPx}px -${m.bottomShadowPx / 2}px rgba(0,0,0,${m.bottomShadowAlpha})`,
        `inset 0 0 ${m.edgeShadowPx}px rgba(0,0,0,${m.edgeShadowAlpha})`,
      ].join(', '),
      background: `radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,${m.vignetteAlpha}) 100%)`,
    });

    // the joystick: nine frames with the base in the same spot, one showing
    // drawn over everything else on the cabinet: the screen, the buttons and their glow
    const js = JOYSTICK.baseWidth / JOYSTICK.frame.baseWidth;
    const jx = JOYSTICK.x - JOYSTICK.frame.base.x * js;
    const jy = JOYSTICK.baseBottomY - JOYSTICK.frame.base.y * js;
    for (const name of Object.values(STICK_FRAME)) {
      const frame = img(this.root, `assets/cabinet/joystick-${name}.webp`, {
        ...box(jx, jy, JOYSTICK.frame.size * js, JOYSTICK.frame.size * js),
        zIndex: '10',
        visibility: name === 'c' ? 'visible' : 'hidden',
      });
      frame.dataset.joystickFrame = name;
      this.sticks.set(name, frame);
    }

    const scale = BUTTON.width / BUTTON.frame.buttonWidth;
    const fw = BUTTON.frame.width * scale;
    const fh = BUTTON.frame.height * scale;
    const top = BUTTON.ringBottomY + BUTTON.frame.bottomPad * scale - fh;
    this.buttons = {} as typeof this.buttons;
    for (const m of MOVES) {
      const holder = el('div', this.root, {
        ...box(BUTTON.x[m] - fw / 2, top, fw, fh),
        pointerEvents: 'none',
      });
      const up = img(holder, `assets/cabinet/button-${m}-up.webp`, box(0, 0, fw, fh));
      const down = img(holder, `assets/cabinet/button-${m}-down.webp`, {
        ...box(0, 0, fw, fh),
        visibility: 'hidden',
      });
      this.buttons[m] = { el: holder, up, down };
      const label = img(this.root, `assets/cabinet/label-${m}.webp`, {
        position: 'absolute',
        top: `${BUTTON.labelTopY}px`,
        left: `${BUTTON.x[m]}px`,
        transform: 'translateX(-50%)',
      });
      label.addEventListener(
        'load',
        () => (label.style.width = `${label.naturalWidth * BUTTON.labelScale}px`),
      );
    }
    this.ring = el('div', this.root, {
      position: 'absolute',
      borderRadius: '50%',
      border: '6px solid #fff',
      pointerEvents: 'none',
      opacity: '0',
    });

    addCabinetEngravings(this.root);
    this.tapZones();
    this.scheduleShine();

    const refit = () => this.layout();
    window.addEventListener('resize', refit);
    window.addEventListener('orientationchange', refit);
    window.visualViewport?.addEventListener('resize', refit);
    window.visualViewport?.addEventListener('scroll', refit);
    // Moving between displays or changing browser zoom can change DPR without changing CSS size.
    const watchDensity = () => {
      window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`).addEventListener(
        'change',
        () => {
          this.layout();
          watchDensity();
        },
        { once: true },
      );
    };
    watchDensity();
    shake.onMove(() => this.place());
    this.layout();
  }

  /** The monitor's size now (the game canvas follows it). */
  get screenSize(): ScreenSize {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = (this.pixelPerfect ? PIXEL_SCREEN.width : SCREEN.width) * this.fit.scale;
    const cssHeight = SCREEN.height * this.fit.scale;
    return { cssWidth, cssHeight, deviceWidth: cssWidth * dpr, deviceHeight: cssHeight * dpr };
  }
  get canvasZoom(): number {
    return (this.pixelPerfect ? PIXEL_SCREEN.width : SCREEN.width) / MONITOR.width;
  }
  get monitorInsetX(): number {
    return this.pixelPerfect ? PIXEL_SCREEN_INSET : 0;
  }
  setPixelPerfect(on: boolean): void {
    if (this.pixelPerfect === on) return;
    this.pixelPerfect = on;
    this.layout();
  }

  /**
   * Integer enlargement used by the art preview's grid verifier. Normal gameplay renders into
   * a native MONITOR-sized framebuffer and enlarges that canvas with nearest sampling.
   */
  get renderScale(): number {
    return Math.min(6, Math.max(1, Math.ceil(this.screenSize.deviceWidth / MONITOR.width - 0.05)));
  }

  /** CSS pixels per monitor pixel. */
  get monitorScale(): number {
    return this.canvasZoom * this.fit.scale;
  }

  /** A point on the monitor (monitor pixels) in page coordinates, e.g. for a text field over it. */
  monitorToPage(x: number, y: number): { x: number; y: number } {
    const r = this.screen.getBoundingClientRect();
    return {
      x: r.left + this.monitorInsetX * this.fit.scale + window.scrollX + x * this.monitorScale,
      y: r.top + window.scrollY + y * this.monitorScale,
    };
  }

  onResize(fn: (size: ScreenSize) => void): () => void {
    return this.events.on('resize', fn);
  }

  /** A cabinet button went down or up (keys and taps alike). */
  setDown(move: Move, down: boolean): void {
    if (down) this.down.add(move);
    else if (this.down.has(move)) {
      // stay down a moment so even a quick tap shows a press
      setTimeout(() => {
        this.down.delete(move);
        this.refresh();
      }, tuning.buttons.releaseMs);
      return;
    }
    this.refresh();
  }

  /** Light the player's chosen move and dim the others; null clears it. */
  setSelected(move: Move | null): void {
    this.selected = move;
    this.stopLockIn();
    if (move) this.playLockIn(move);
    this.refresh();
  }

  /** The joystick snaps to a direction; back to the centre it overshoots the other way once. */
  setTilt(t: StickTilt): void {
    if (t.x === this.stickDir.x && t.y === this.stickDir.y) return;
    const from = this.stickDir;
    this.stickDir = { x: t.x, y: t.y };
    this.handlers.stickClick();
    this.wobbleTimers.forEach(clearTimeout);
    this.wobbleTimers = [];
    if (t.x === 0 && t.y === 0) {
      const { springBackMs, wobbleMs } = tuning.joystick;
      this.wobbleTimers.push(
        setTimeout(() => this.showStick(-from.x, -from.y), springBackMs),
        setTimeout(() => this.showStick(0, 0), springBackMs + wobbleMs),
      );
    } else this.showStick(t.x, t.y);
  }

  private showStick(x: number, y: number): void {
    const name = STICK_FRAME[`${x},${y}`] ?? 'c';
    for (const [n, frame] of this.sticks) frame.style.visibility = n === name ? 'visible' : 'hidden';
  }

  /** Invisible zones over the whole control panel, so a thumb near a button still hits it. */
  private tapZones(): void {
    const h = PANEL.bottom - PANEL.top;
    for (const m of MOVES) {
      const z = PANEL.buttons[m];
      const zone = el('div', this.root, {
        ...box(z.left, PANEL.top, z.right - z.left, h),
        cursor: 'pointer',
      });
      zone.dataset.button = m;
      let held = false;
      const release = () => {
        if (!held) return;
        held = false;
        this.handlers.release(m);
      };
      zone.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        zone.setPointerCapture(e.pointerId);
        held = true;
        this.handlers.press(m);
      });
      zone.addEventListener('pointerup', release);
      zone.addEventListener('pointercancel', release);
      zone.addEventListener('lostpointercapture', release);
      zone.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        this.hovered = m;
        this.refresh();
      });
      zone.addEventListener('pointerleave', () => {
        if (this.hovered === m) this.hovered = null;
        this.refresh();
      });
    }

    const j = PANEL.joystick;
    const zone = el('div', this.root, { ...box(j.left, PANEL.top, j.right - j.left, h), cursor: 'grab' });
    zone.dataset.joystick = '';
    let start: { x: number; y: number } | null = null;
    const end = () => {
      start = null;
      this.handlers.stick({ x: 0, y: 0 });
    };
    zone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      zone.setPointerCapture(e.pointerId);
      start = { x: e.clientX, y: e.clientY };
    });
    zone.addEventListener('pointermove', (e) => {
      if (!start) return;
      this.handlers.stick(
        stickDirection(
          e.clientX - start.x,
          e.clientY - start.y,
          tuning.joystick.dragDeadzonePx,
          tuning.joystick.axisSnapDeg,
        ),
      );
    });
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    zone.addEventListener('lostpointercapture', () => start && end());
  }

  /** Measures the visible window and fits the cabinet into it. */
  private layout(): void {
    const vv = window.visualViewport;
    const p = getComputedStyle(this.probe);
    const inset = (side: string) => parseFloat(p.getPropertyValue(`padding-${side}`)) || 0;
    const width = vv?.width ?? window.innerWidth;
    const height = vv?.height ?? window.innerHeight;
    this.fit = fitCabinet(
      {
        x: (vv?.offsetLeft ?? 0) + inset('left'),
        y: (vv?.offsetTop ?? 0) + inset('top'),
        width: width - inset('left') - inset('right'),
        height: height - inset('top') - inset('bottom'),
      },
      this.pixelPerfect,
      window.devicePixelRatio || 1,
    );
    this.place();
    const next = this.screenSize;
    this.events.emit('resize', next);
  }

  private place(): void {
    const { scale, left, top } = this.fit;
    const o = this.shake.offset;
    // the shake is counted in monitor pixels
    const x = left + o.x * this.monitorScale;
    const y = top + o.y * this.monitorScale;
    this.root.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  }

  /** Every shineGapMs a glint sweeps the three buttons in turn, shineStaggerMs apart. */
  private scheduleShine(): void {
    const t = tuning.buttons;
    setTimeout(() => {
      MOVES.forEach((m, i) => {
        setTimeout(() => {
          this.shining.add(m);
          this.refresh();
        }, i * t.shineStaggerMs);
        setTimeout(
          () => {
            this.shining.delete(m);
            this.refresh();
          },
          i * t.shineStaggerMs + 3 * t.shineFrameMs,
        );
      });
      this.scheduleShine();
    }, t.shineGapMs);
  }

  /** Flash on, off, on... `lockFlashes` times, while a ring pops out round the button. */
  private playLockIn(move: Move): void {
    const t = tuning.buttons;
    const steps = Math.max(0, Math.round(t.lockFlashes)) * 2;
    let step = 0;
    const tick = () => {
      this.flashing = step < steps && step % 2 === 0;
      this.refresh();
      if (step++ >= steps) return this.stopLockIn();
      this.lockTimer = setTimeout(tick, Math.max(1, t.lockFlashMs));
    };
    tick();

    const w = BUTTON.width + 20;
    Object.assign(this.ring.style, {
      ...box(BUTTON.x[move] - w / 2, BUTTON.ringBottomY - w * 0.62, w, w * 0.66),
      borderColor: GLOW[move],
    });
    this.ring.animate(
      [
        { opacity: 1, transform: 'scale(0.9)' },
        { opacity: 0, transform: 'scale(1.35)' },
      ],
      { duration: t.ringFrameMs * 5, easing: 'ease-out' },
    );
  }

  private stopLockIn(): void {
    if (this.lockTimer) clearTimeout(this.lockTimer);
    this.lockTimer = null;
    this.flashing = false;
  }

  private refresh(): void {
    for (const m of MOVES) {
      const b = this.buttons[m];
      let filter = 'none';
      let pressed = this.down.has(m);
      if (this.selected === m) {
        pressed = true;
        filter = this.flashing
          ? 'brightness(2.2) saturate(0.6)'
          : `brightness(1.2) drop-shadow(0 0 14px ${GLOW[m]}) drop-shadow(0 0 4px ${GLOW[m]})`;
      } else if (pressed) filter = 'brightness(0.95)';
      else if (this.selected) filter = 'brightness(0.5) saturate(0.6)';
      else if (this.shining.has(m)) filter = 'brightness(1.3)';
      else if (this.hovered === m) filter = 'brightness(1.12)';
      b.up.style.visibility = pressed ? 'hidden' : 'visible';
      b.down.style.visibility = pressed ? 'visible' : 'hidden';
      b.el.style.filter = filter;
    }
  }

  /**
   * The marquee's backlight flickers every few seconds, like a worn tube, whatever the game is
   * doing: a dark veil over the art stutters through one of a few patterns (some only dip, some
   * black out), and a bright surge pops as the tube strikes back.
   */
  private flickerMarquee(art: HTMLImageElement): void {
    const m = tuning.marquee;
    const set = (dark: number) => (art.style.filter = dark > 0 ? `brightness(${1 - dark})` : 'none');
    const next = () => {
      const wait = m.minGapMs + Math.random() * (m.maxGapMs - m.minGapMs);
      setTimeout(() => {
        const dark = { '-': 0, h: m.dimAlpha / 2, d: m.dimAlpha, D: m.blackoutAlpha };
        const steps = FLICKERS[Math.floor(Math.random() * FLICKERS.length)]!.split(' ');
        let at = 0;
        for (const step of steps) {
          setTimeout(() => set(dark[step[0] as keyof typeof dark]), at);
          at += Number(step.slice(1));
        }
        setTimeout(() => {
          art.style.filter = `brightness(${1 + m.surgeAlpha * 3})`;
          setTimeout(() => set(0), m.surgeMs);
          next();
        }, at);
      }, wait);
    };
    next();
  }
}

function box(x: number, y: number, width: number, height: number): Partial<CSSStyleDeclaration> {
  return { position: 'absolute', left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` };
}

function el(tag: 'div', parent: HTMLElement, style: Partial<CSSStyleDeclaration>): HTMLDivElement {
  const node = document.createElement(tag);
  Object.assign(node.style, style);
  parent.append(node);
  return node;
}

function img(parent: HTMLElement, src: string, style: Partial<CSSStyleDeclaration>): HTMLImageElement {
  const node = document.createElement('img');
  node.src = src;
  node.alt = '';
  node.draggable = false;
  Object.assign(node.style, { pointerEvents: 'none', userSelect: 'none', ...style });
  parent.append(node);
  return node;
}
