import { isRoomCode, randomRoomCode, ROOM_CODE_LENGTH, ROOM_CODE_LETTERS, type JoinError } from '@rps/core';
import Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MONITOR } from '../config/layout';
import { palette } from '../config/palette';
import { tuning } from '../config/tuning';
import type { Action } from '../input/InputRouter';
import { lobbyMenu } from '../menus/lobbyMenu';
import { connectOnline } from '../session/createSession';
import type { OnlineSession } from '../session/OnlineSession';
import { frameRect } from '../util/gfx';
import { MenuView } from '../views/MenuView';
import { PixelText } from '../views/PixelText';
import { addMenuBackdrop } from '../views/MenuBackdrop';
import { getContext } from './context';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';

type Mode = 'menu' | 'create' | 'join';

interface LobbyData {
  mode?: Mode;
}

/** What a refused or dropped connection means, in two short lines for the monitor. */
const PROBLEM: Record<JoinError | 'offline', [string, string]> = {
  noRoom: ['NO ROOM WITH', 'THAT CODE'],
  full: ['THAT ROOM', 'IS FULL'],
  taken: ['ROOM CODE TAKEN', 'TRY AGAIN'],
  version: ['YOUR RIVAL HAS', 'ANOTHER VERSION'],
  protocol: ['RELOAD THE PAGE', 'FOR THE NEW VERSION'],
  bad: ['SOMETHING WENT', 'WRONG'],
  offline: ['CANNOT REACH', 'THE SERVER'],
};

const CREATE_TRIES = 5;

/**
 * Online lobby: CREATE ROOM shows a fresh code and waits for a rival; JOIN ROOM lets you enter a
 * friend's code (type it, or stick up/down picks letters and left/right moves). When both players
 * are in, the connected session goes to the fight. Each mode is a restart of this scene.
 */
export class LobbyScene extends Phaser.Scene {
  private mode: Mode = 'menu';
  private session: OnlineSession | null = null;
  private handedOff = false;

  constructor() {
    super(SceneKey.lobby);
  }

  init(data: LobbyData): void {
    this.mode = data.mode ?? 'menu';
    this.session = null;
    this.handedOff = false;
  }

  create(): void {
    useMonitorCamera(this);
    addMenuBackdrop(this);
    this.add.tileSprite(0, 0, MONITOR.width, MONITOR.height, Tex.dither).setOrigin(0);
    this.events.once('shutdown', () => {
      if (!this.handedOff) this.session?.dispose();
      this.session = null;
    });
    if (this.mode === 'menu') this.showMenu();
    else if (this.mode === 'create') this.showCreate();
    else this.showJoin();
  }

  private title(text: string): void {
    new PixelText(this, MONITOR.width / 2, 26, text, {
      size: 3,
      color: palette.cyan,
      align: 'center',
      outline: palette.ink,
      shadow: palette.shadow,
    });
  }

  /** Two centred lines of status text, e.g. "WAITING FOR" / "YOUR RIVAL". */
  private statusLines(y: number): (lines: [string, string], color?: number) => void {
    const cx = MONITOR.width / 2;
    // a dark band so the text stays readable over the stage art
    this.add.rectangle(0, y - 5, MONITOR.width, 27, palette.panel).setOrigin(0);
    const rows = [0, 1].map(
      (i) =>
        new PixelText(this, cx, y + i * 10, '', {
          color: palette.lilac,
          align: 'center',
          shadow: palette.ink,
        }),
    );
    return (lines, color = palette.lilac) =>
      lines.forEach((line, i) => rows[i]?.setText(line).setColor(color));
  }

  private hint(lines: string[]): void {
    const y = MONITOR.height - 18 - (lines.length - 1) * 10;
    this.add.rectangle(0, y - 5, MONITOR.width, lines.length * 10 + 7, palette.panel).setOrigin(0);
    lines.forEach(
      (line, i) =>
        new PixelText(this, MONITOR.width / 2, y + i * 10, line, {
          color: palette.lilac,
          align: 'center',
          shadow: palette.ink,
        }),
    );
  }

  /**
   * A tappable button on the monitor. Phones have no Esc key, so the create and join screens need
   * one to get back to the lobby menu.
   */
  private tapButton(y: number, label: string, onTap: () => void): void {
    const w = 80;
    const h = 17;
    const x = Math.round((MONITOR.width - w) / 2);
    const gfx = this.add.graphics();
    const paint = (down: boolean) => {
      gfx.clear();
      gfx.fillStyle(palette.ink).fillRect(x - 1, y - 1, w + 2, h + 2);
      gfx.fillStyle(down ? palette.select : palette.panel).fillRect(x, y, w, h);
      frameRect(gfx, x, y, w, h, down ? palette.pink : palette.panelEdge);
    };
    paint(false);
    new PixelText(this, MONITOR.width / 2, y + 5, label, { color: palette.text, align: 'center' });
    this.add
      .zone(x, y, w, h)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => paint(true))
      .on('pointerout', () => paint(false))
      .on('pointerup', () => {
        paint(false);
        onTap();
      });
  }

  /** Back / Esc returns home from the menu, or to the lobby menu from create and join. */
  private listen(fn: (a: Action) => void): void {
    const { input } = getContext(this);
    const off = input.on('action', (a) => {
      if (this.scene.isActive()) fn(a);
    });
    this.events.once('shutdown', off);
  }

  private toMode(mode: Mode): void {
    if (mode === 'menu') getContext(this).audio.play('menuBack');
    this.scene.restart({ mode } satisfies LobbyData);
  }

  private toFight(session: OnlineSession): void {
    this.handedOff = true;
    getContext(this).flow.toFight({ mode: 'online', roomCode: session.roomCode }, session);
  }

  private showMenu(): void {
    const { flow, input, audio } = getContext(this);
    this.title('ONLINE');
    let leaving = false;
    const home = () => {
      if (leaving) return;
      leaving = true;
      menu.lock();
      flow.toHome();
    };
    const menu = new MenuView(
      this,
      lobbyMenu({ create: () => this.toMode('create'), join: () => this.toMode('join'), back: home }),
      72,
      input,
      audio,
    );
    this.hint(['PLAY A FRIEND ON ANOTHER DEVICE:', 'ONE CREATES A ROOM, THE', 'OTHER JOINS WITH ITS CODE']);
    this.listen((a) => {
      if (a.type !== 'back' || leaving) return;
      audio.play('menuBack');
      home();
    });
  }

  private showCreate(): void {
    const cx = MONITOR.width / 2;
    this.title('NEW ROOM');
    new PixelText(this, cx, 70, 'ROOM CODE', { color: palette.gold, align: 'center', shadow: palette.ink });
    const code = new PixelText(this, cx, 86, '', {
      size: 4,
      color: palette.text,
      align: 'center',
      outline: palette.ink,
      shadow: palette.shadow,
    });
    const status = this.statusLines(132);
    this.hint(['TELL YOUR RIVAL THE CODE']);
    this.tapButton(160, 'CANCEL', () => this.toMode('menu'));

    let tries = 0;
    const open = () => {
      tries++;
      const roomCode = randomRoomCode(Math.random);
      code.setText(roomCode);
      status(['CONNECTING...', '']);
      const session = connectOnline(roomCode, 'create');
      this.session = session;
      session.on('opponentJoined', () => this.toFight(session));
      session.on('refused', ({ error }) => {
        if (error === 'taken' && tries < CREATE_TRIES) open();
        else fail(PROBLEM[error]);
      });
      session.on('disconnected', () => fail(PROBLEM.offline));
      // the hello goes out when the socket opens; until the rival arrives, just wait
      this.time.delayedCall(300, () => {
        if (this.session === session && !failed) status(['WAITING FOR', 'YOUR RIVAL']);
      });
    };
    let failed = false;
    const fail = (lines: [string, string]) => {
      failed = true;
      code.setText('----');
      status(lines, palette.pink);
    };
    open();
    // nothing else to do here, so any cabinet button, Enter or Esc cancels
    this.listen((a) => {
      if (a.type === 'back' || a.type === 'confirm' || a.type === 'pick') this.toMode('menu');
    });
  }

  private showJoin(): void {
    const cx = MONITOR.width / 2;
    this.title('JOIN ROOM');
    new PixelText(this, cx, 70, 'ENTER THE CODE', {
      color: palette.gold,
      align: 'center',
      shadow: palette.ink,
    });
    const status = this.statusLines(132);
    this.hint(['TAP THE BOXES TO TYPE', 'OR PICK LETTERS WITH THE STICK']);
    this.tapButton(160, 'BACK', () => this.toMode('menu'));

    // four letter boxes; -1 = empty
    const slots: number[] = Array.from({ length: ROOM_CODE_LENGTH }, () => -1);
    const box = { w: 30, h: 34, gap: 6, y: 86 };
    const left = Math.round(
      (MONITOR.width - (ROOM_CODE_LENGTH * box.w + (ROOM_CODE_LENGTH - 1) * box.gap)) / 2,
    );
    const gfx = this.add.graphics();
    const letters = slots.map(
      (_, i) =>
        new PixelText(this, left + i * (box.w + box.gap) + box.w / 2, box.y + 7, '', {
          size: 3,
          color: palette.text,
          align: 'center',
          shadow: palette.shadow,
        }),
    );
    let cursor = 0;
    let joining = false;
    let blinkOn = true;

    const code = () => slots.map((i) => ROOM_CODE_LETTERS[i] ?? '').join('');
    const draw = () => {
      gfx.clear();
      slots.forEach((letter, i) => {
        const x = left + i * (box.w + box.gap);
        const on = i === cursor && !joining;
        gfx.fillStyle(palette.ink).fillRect(x - 1, box.y - 1, box.w + 2, box.h + 2);
        gfx.fillStyle(on ? palette.select : palette.panel).fillRect(x, box.y, box.w, box.h);
        frameRect(gfx, x, box.y, box.w, box.h, on ? palette.pink : palette.panelEdge);
        if (on && blinkOn) gfx.fillStyle(palette.gold).fillRect(x + 6, box.y + box.h - 5, box.w - 12, 2);
        letters[i]?.setText(ROOM_CODE_LETTERS[letter] ?? '');
      });
    };
    const blink = this.time.addEvent({
      delay: tuning.menu.cursorBlinkMs,
      loop: true,
      callback: () => {
        blinkOn = !blinkOn;
        draw();
      },
    });
    this.events.once('shutdown', () => blink.remove());

    const n = ROOM_CODE_LETTERS.length;
    const setLetter = (i: number) => {
      slots[cursor] = i;
      status(['', '']);
    };
    const join = () => {
      const roomCode = code();
      if (!isRoomCode(roomCode)) return status(['FILL IN ALL', 'FOUR LETTERS'], palette.pink);
      joining = true;
      status(['JOINING...', '']);
      const session = connectOnline(roomCode, 'join');
      this.session = session;
      const fail = (lines: [string, string]) => {
        joining = false;
        this.session = null;
        status(lines, palette.pink);
        syncField();
        draw();
      };
      session.on('opponentJoined', () => this.toFight(session));
      session.on('refused', ({ error }) => fail(PROBLEM[error]));
      session.on('disconnected', () => fail(PROBLEM.offline));
      syncField();
      draw();
    };

    // A see-through text field over the boxes: tapping them opens the phone's keyboard, and typing
    // goes through the keyboard's own layout. The boxes stay the visible part.
    const field = this.codeField(
      left,
      box.y,
      ROOM_CODE_LENGTH * box.w + (ROOM_CODE_LENGTH - 1) * box.gap,
      box.h,
    );
    const syncField = () => {
      field.value = code();
      field.disabled = joining;
      if (joining) field.blur();
    };
    field.addEventListener('input', () => {
      const typed = [...field.value.toUpperCase()]
        .map((ch) => ROOM_CODE_LETTERS.indexOf(ch))
        .filter((i) => i >= 0)
        .slice(0, ROOM_CODE_LENGTH);
      slots.fill(-1);
      typed.forEach((letter, i) => (slots[i] = letter));
      cursor = Math.min(typed.length, ROOM_CODE_LENGTH - 1);
      status(['', '']);
      syncField();
      blinkOn = true;
      draw();
    });

    this.listen((a) => {
      if (joining) {
        if (a.type === 'back') {
          this.session?.dispose();
          this.session = null;
          joining = false;
          status(['', '']);
          draw();
        }
        return;
      }
      const cur = slots[cursor] ?? -1;
      if (a.type === 'nav' || a.type === 'char') getContext(this).audio.play('menuMove');
      if (a.type === 'nav' && a.dir === 'up') setLetter(cur < 0 ? 0 : (cur + 1) % n);
      else if (a.type === 'nav' && a.dir === 'down') setLetter(cur < 0 ? n - 1 : (cur - 1 + n) % n);
      else if (a.type === 'nav' && a.dir === 'left') cursor = Math.max(0, cursor - 1);
      else if (a.type === 'nav' && a.dir === 'right') cursor = Math.min(ROOM_CODE_LENGTH - 1, cursor + 1);
      else if (a.type === 'char') {
        const i = ROOM_CODE_LETTERS.indexOf(a.char);
        if (i < 0) return;
        setLetter(i);
        cursor = Math.min(ROOM_CODE_LENGTH - 1, cursor + 1);
      } else if (a.type === 'confirm' || a.type === 'pick') {
        getContext(this).audio.play('menuSelect');
        join();
      } else if (a.type === 'back') {
        if (cur >= 0) slots[cursor] = -1;
        else if (cursor > 0) slots[--cursor] = -1;
        else return this.toMode('menu');
      }
      blinkOn = true;
      syncField();
      draw();
    });
    draw();
  }

  /**
   * A transparent HTML text field laid over a rectangle of the monitor (in monitor pixels). It
   * follows window resizes and is removed with the scene.
   */
  private codeField(x: number, y: number, w: number, h: number): HTMLInputElement {
    const { cabinet } = getContext(this);
    const field = document.createElement('input');
    Object.assign(field, {
      type: 'text',
      maxLength: ROOM_CODE_LENGTH,
      spellcheck: false,
      autocomplete: 'off',
      enterKeyHint: 'go',
      inputMode: 'text',
      ariaLabel: 'Room code',
    });
    field.setAttribute('autocapitalize', 'characters');
    field.setAttribute('autocorrect', 'off');
    Object.assign(field.style, {
      position: 'absolute',
      margin: '0',
      padding: '0',
      border: 'none',
      outline: 'none',
      background: 'transparent',
      color: 'transparent',
      caretColor: 'transparent',
      // 16px or more, or iOS zooms the page in when the field gets focus
      fontSize: '16px',
      userSelect: 'text',
      webkitUserSelect: 'text',
      touchAction: 'manipulation',
      cursor: 'pointer',
    } satisfies Partial<CSSStyleDeclaration>);
    const place = () => {
      const at = cabinet.monitorToPage(x, y);
      const k = cabinet.monitorScale;
      field.style.left = `${at.x}px`;
      field.style.top = `${at.y}px`;
      field.style.width = `${w * k}px`;
      field.style.height = `${h * k}px`;
    };
    place();
    document.body.appendChild(field);
    const off = cabinet.onResize(place);
    // on a desktop the keys type straight away; a phone opens its keyboard when the boxes are tapped
    if (window.matchMedia('(pointer: fine)').matches) field.focus({ preventScroll: true });
    this.events.once('shutdown', () => {
      off();
      field.remove();
    });
    return field;
  }
}
