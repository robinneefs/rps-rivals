import type { CabinetView, ScreenSize } from '../cabinet/CabinetView';
import { MONITOR } from '../config/layout';
import { tuning } from '../config/tuning';

/**
 * The CRT's scanlines: a see-through layer over the monitor, at device resolution, with a fine dark
 * line under each monitor pixel row (the game canvas is too coarse for that), plus the soft dark
 * edge round the glass. It lives in the cabinet's screen opening, so it moves and scales with it.
 */
export class CrtOverlay {
  private readonly lines: HTMLCanvasElement;
  private readonly glass: HTMLDivElement;
  private on = false;

  constructor(private readonly cabinet: CabinetView) {
    this.lines = document.createElement('canvas');
    this.glass = document.createElement('div');
    for (const el of [this.lines, this.glass])
      Object.assign(el.style, {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: '1',
        display: 'none',
      } satisfies Partial<CSSStyleDeclaration>);
    cabinet.screen.append(this.lines, this.glass);
    cabinet.onResize((s) => this.draw(s));
  }

  setVisible(on: boolean): void {
    this.on = on;
    for (const el of [this.lines, this.glass]) el.style.display = on ? 'block' : 'none';
    if (on) this.draw(this.cabinet.screenSize);
  }

  private draw(size: ScreenSize): void {
    if (!this.on) return;
    const c = tuning.crt;
    const w = Math.max(1, Math.round(size.deviceWidth));
    const h = Math.max(1, Math.round(size.deviceHeight));
    // the glass is in cabinet units (the screen opening's own size), so the radius scales with it
    const radius = this.cabinet.screen.offsetWidth * c.cornerRadius * 0.6;
    Object.assign(this.glass.style, {
      borderRadius: `${radius}px`,
      boxShadow: `inset 0 0 ${radius * 0.8}px rgba(0, 0, 0, 0.35)`,
    } satisfies Partial<CSSStyleDeclaration>);

    const cv = this.lines;
    cv.width = w;
    cv.height = h;
    const g = cv.getContext('2d');
    if (!g) return;
    g.clearRect(0, 0, w, h);
    g.fillStyle = `rgba(0, 0, 0, ${c.scanlineAlpha})`;
    const rowH = h / MONITOR.height;
    const thick = Math.max(1, Math.round(rowH * c.scanlineThickness));
    for (let k = 0; k < MONITOR.height; k++) {
      const top = Math.round(k * rowH);
      const bottom = Math.round((k + 1) * rowH);
      // a row only a device pixel or two tall keeps at least one clear pixel
      const line = Math.min(thick, Math.max(1, bottom - top - 1));
      g.fillRect(0, bottom - line, w, line);
    }
  }
}
