import { defaultRules, isPlayableCharacter, PLAYABLE_CHARACTERS, type CharacterSelection } from '@rps/core';
import Phaser from 'phaser';
import { CHARACTERS, characterPresentation } from '../config/characters';
import { getContext } from './context';
import type { CharacterSelectData } from './flow';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';
import { menuBackdrop, menuPanel, menuTitle, MenuText, menuColors as C } from '../views/MenuStyle';

/** Portrait lineup. Cosmetics only: displayed numbers come from the actual shared match rules. */
export class CharacterSelectScene extends Phaser.Scene {
  private selectionData!: CharacterSelectData;
  private selected = 0;
  private confirmed = false;
  private pendingConfirmation = false;
  private starting = false;
  private leaving = false;
  private ended = false;
  private status = '';
  private startTimer?: Phaser.Time.TimerEvent;
  constructor() {
    super(SceneKey.characterSelect);
  }
  init(data: CharacterSelectData): void {
    this.selectionData = data;
    this.selected = 0;
    this.confirmed = this.pendingConfirmation = this.starting = this.leaving = this.ended = false;
    this.status = '';
    this.startTimer = undefined;
  }
  create(): void {
    useMonitorCamera(this);
    const { input, flow } = getContext(this);
    this.selected = Math.max(
      0,
      CHARACTERS.findIndex((c) => c.id === flow.selectedCharacter),
    );
    const session = this.selectionData.session;
    const offs = [
      input.on('action', (action) => {
        if (!this.scene.isActive() || flow.transitioning || this.leaving) return;
        if (action.type === 'back') this.back();
        else if (this.starting) return;
        else if (action.type === 'confirm' || action.type === 'pick') this.confirm();
        else if (action.type === 'nav' && !this.confirmed && !this.ended) {
          const step = action.dir === 'left' || action.dir === 'up' ? -1 : 1;
          this.browse((this.selected + step + CHARACTERS.length) % CHARACTERS.length);
        }
      }),
    ];
    if (session) {
      offs.push(
        session.on('selection', (selection) => this.syncSelection(selection)),
        session.on('opponentLeft', () => this.end('RIVAL LEFT')),
        session.on('disconnected', () => this.end('OFFLINE')),
      );
      const initialId = CHARACTERS[this.selected]!.id;
      if (isPlayableCharacter(initialId)) session.selectCharacter(initialId, false);
      if (session.endedReason) this.end(session.endedReason === 'opponentLeft' ? 'RIVAL LEFT' : 'OFFLINE');
    }
    this.draw();
    this.events.once('shutdown', () => {
      offs.forEach((off) => off());
      this.startTimer?.remove();
    });
  }
  get state() {
    const rules = this.selectionData.session?.rules ?? defaultRules;
    return {
      selected: CHARACTERS[this.selected]!.id,
      confirmed: this.confirmed,
      starting: this.starting,
      transitioning: getContext(this).flow.transitioning,
      available: isPlayableCharacter(CHARACTERS[this.selected]!.id),
      status: this.status,
      stats: {
        rock: rules.damage.rock,
        paper: rules.damage.paper,
        scissors: rules.damage.scissors,
        hp: rules.startHealth,
      },
    };
  }
  private browse(index: number): void {
    const { flow, audio } = getContext(this);
    if (
      this.confirmed ||
      this.starting ||
      this.leaving ||
      this.ended ||
      flow.transitioning ||
      index === this.selected
    )
      return;
    this.selected = index;
    const id = CHARACTERS[index]!.id;
    if (isPlayableCharacter(id)) this.selectionData.session?.selectCharacter(id, false);
    audio.play('menuMove');
    this.draw();
  }
  private confirm(): void {
    const { flow, audio } = getContext(this);
    if (flow.transitioning || this.starting || this.leaving) return;
    if (this.ended) return this.leave();
    const id = CHARACTERS[this.selected]!.id;
    if (!isPlayableCharacter(id) || this.confirmed) return;
    this.confirmed = true;
    flow.selectedCharacter = id;
    audio.play('menuSelect');
    if (this.selectionData.session) {
      this.pendingConfirmation = true;
      this.selectionData.session.selectCharacter(id, true);
    } else this.scheduleStart();
    this.draw();
  }
  private back(): void {
    if (this.starting && this.selectionData.session) return;
    if (this.confirmed && !this.ended) {
      this.startTimer?.remove();
      this.startTimer = undefined;
      this.confirmed = this.pendingConfirmation = this.starting = false;
      const id = CHARACTERS[this.selected]!.id;
      if (isPlayableCharacter(id)) this.selectionData.session?.selectCharacter(id, false);
      getContext(this).audio.play('menuBack');
      this.draw();
    } else this.leave();
  }
  private leave(): void {
    if (this.leaving || getContext(this).flow.transitioning) return;
    this.leaving = true;
    this.startTimer?.remove();
    getContext(this).audio.play('menuBack');
    getContext(this).flow.toHome();
  }
  private syncSelection(selection: CharacterSelection): void {
    if (this.ended || this.leaving) return;
    const me = this.selectionData.session!.me;
    if (selection.confirmed[me]) this.pendingConfirmation = false;
    this.confirmed = selection.confirmed[me] || this.pendingConfirmation;
    if (selection.confirmed.p1 && selection.confirmed.p2) this.scheduleStart();
    this.draw();
  }
  private scheduleStart(): void {
    if (this.startTimer || this.leaving || this.ended) return;
    // The room's both-confirmed state is final; peers must transition together before ready().
    this.starting = true;
    this.startTimer = this.time.delayedCall(650, () => {
      if (this.leaving || this.ended || !this.confirmed) return;
      const { flow } = getContext(this);
      const setup = this.selectionData.setup;
      if (setup.mode === 'cpu') {
        const id = CHARACTERS[this.selected]!.id;
        if (!isPlayableCharacter(id)) return;
        const cpu = PLAYABLE_CHARACTERS[Math.floor(Math.random() * PLAYABLE_CHARACTERS.length)]!;
        flow.toFight({ ...setup, fighters: { p1: id, p2: cpu } });
      } else flow.toFight(setup, this.selectionData.session);
    });
  }
  private end(message: string): void {
    if (this.leaving || this.ended) return;
    this.ended = true;
    this.starting = this.confirmed = false;
    this.startTimer?.remove();
    this.startTimer = undefined;
    this.status = message;
    this.draw();
  }
  private draw(): void {
    this.children.removeAll(true);
    menuBackdrop(this);
    menuPanel(this, 47, 187);
    menuTitle(this, this.confirmed ? 'FIGHTER READY' : 'CHOOSE FIGHTER');
    let x = 14;
    CHARACTERS.forEach((character, i) => {
      const c = characterPresentation(character.id),
        on = i === this.selected;
      const box = { x, y: on ? 51 : 63, w: on ? 62 : 46, h: on ? 88 : 76 };
      const g = this.add.graphics();
      const color = on ? (this.confirmed ? C.cyan : C.gold) : C.edge;
      g.fillStyle(C.ink).fillRect(x + 1, box.y + 2, box.w, box.h);
      g.fillStyle(color).fillRect(x, box.y, box.w, box.h);
      g.fillStyle(on ? 0xa14045 : 0x253e78).fillRect(x + 2, box.y + 2, box.w - 4, box.h - 4);
      const crop = { x: c.faceX - Math.floor((box.w - 4) / 2), y: on ? 46 : 58, w: box.w - 4, h: box.h - 4 };
      const texture = this.textures.get(c.portrait),
        rest = texture.get('rest');
      const frame = `lineup-${crop.x}-${crop.y}-${crop.w}-${crop.h}`;
      if (!texture.has(frame))
        texture.add(frame, rest.sourceIndex, rest.cutX + crop.x, rest.cutY + crop.y, crop.w, crop.h);
      this.add.image(x + 2, box.y + 2, texture.key, frame).setOrigin(0);
      if (on) {
        g.fillStyle(color).fillTriangle(x + box.w / 2 - 4, 47, x + box.w / 2 + 4, 47, x + box.w / 2, 50);
      }
      if (on && this.confirmed) {
        const ready = this.add.graphics();
        ready.fillStyle(C.cyan).fillRect(x + 2, box.y + box.h - 15, box.w - 4, 13);
        new MenuText(this, x + box.w / 2, box.y + box.h - 14, 'READY', C.ink);
      }
      new MenuText(this, x + Math.floor(box.w / 2), 144, c.name, on ? color : C.cream);
      const zone = this.add.zone(x, 49, box.w, 106).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', (p: Phaser.Input.Pointer) => {
        if (!p.wasTouch) this.browse(i);
      });
      zone.on('pointerdown', () => this.browse(i));
      x += box.w + 4;
    });
    const current = characterPresentation(CHARACTERS[this.selected]!.id);
    // Preserve the approved breathing room; reserve this line for actionable state only.
    const status = this.ended
      ? this.status
      : !current.available
        ? 'COMING SOON'
        : this.confirmed && !this.starting
          ? 'WAITING FOR RIVAL'
          : '';
    new MenuText(this, 95, 160, status, this.ended ? C.pink : C.cyan);
    const rules = this.selectionData.session?.rules ?? defaultRules;
    const stats = [
      ['ROCK', rules.damage.rock, C.pink],
      ['PAPER', rules.damage.paper, C.gold],
      ['SCISSORS', rules.damage.scissors, C.cyan],
      ['HP', rules.startHealth, C.cream],
    ] as const;
    stats.forEach(([label, value, color], i) => {
      const x = i % 2 ? 103 : 14,
        w = i % 2 ? 73 : 85,
        y = i < 2 ? 176 : 194;
      this.add.graphics().fillStyle(0x201b49).fillRect(x, y, w, 16).fillStyle(C.edge).fillRect(x, y, w, 1);
      new MenuText(this, x + 4, y + 3, label, color, 'left');
      new MenuText(this, x + w - 5, y + 3, String(value), C.cream, 'right');
    });
    this.button(14, 46, 'BACK', false, () => this.back());
    const label = this.ended
      ? 'MAIN MENU'
      : !current.available
        ? 'COMING SOON'
        : this.starting
          ? 'STARTING'
          : this.confirmed
            ? 'WAITING'
            : 'CONFIRM';
    this.button(64, 112, label, current.available && !this.confirmed && !this.ended, () => this.confirm());
  }
  private button(x: number, w: number, label: string, active: boolean, onTap: () => void): void {
    const g = this.add.graphics();
    g.fillStyle(C.ink).fillRect(x + 1, 216, w, 22);
    g.fillStyle(active ? 0xf18d3e : C.edge).fillRect(x, 214, w, 22);
    g.fillStyle(active ? C.gold : C.panel).fillRect(x, 214, w, 20);
    new MenuText(this, x + w / 2, 219, label, active ? C.ink : C.cream);
    this.add
      .zone(x, 214, w, 22)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (
          !getContext(this).flow.transitioning &&
          !this.leaving &&
          !(this.starting && this.selectionData.session)
        )
          onTap();
      });
  }
}
