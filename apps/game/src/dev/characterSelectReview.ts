import Phaser from 'phaser';
import { HOME_CHARACTERS } from '../assets/homeArt';
import { screenFx } from '../fx/crt';
import { getContext } from '../scenes/context';
import { SceneKey } from '../scenes/keys';
import { useMonitorCamera } from '../scenes/monitor';
import { menuBackdrop, menuPanel, menuTitle, MenuText, menuColors as C } from '../views/MenuStyle';

/** Layout fixtures only: not balanced, not approved, never imported by rules/session/server. */
export const MOCKUP_FIGHTERS = [
  { id: 'taiko', name: 'TAIKO', rock: 15, paper: 10, scissors: 20, hp: 50, faceX: 134, faceY: 89 },
  { id: 'riot', name: 'RIOT', rock: 10, paper: 20, scissors: 15, hp: 50, faceX: 137, faceY: 90 },
  { id: 'anchor', name: 'ANCHOR', rock: 20, paper: 15, scissors: 10, hp: 55, faceX: 140, faceY: 89 },
] as const;
type Layout = 'lineup' | 'hero' | 'versus';
type Box = { x: number; y: number; w: number; h: number };
const KEY = 'CharacterSelectMockup';

class CharacterSelectMockup extends Phaser.Scene {
  private layout: Layout = 'hero';
  private selected = 0;
  private labels: MenuText[] = [];
  constructor() {
    super(KEY);
  }
  init(data: { layout: Layout; fighter: number }): void {
    this.layout = data.layout;
    this.selected = data.fighter;
  }
  create(): void {
    useMonitorCamera(this);
    const previousCrt = screenFx.crt;
    screenFx.crt = true;
    const { input, audio, flow } = getContext(this);
    this.draw();
    const off = input.on('action', (action) => {
      if (!this.scene.isActive()) return;
      if (action.type === 'nav') {
        const step = action.dir === 'left' || action.dir === 'up' ? -1 : 1;
        this.select((this.selected + step + 3) % 3);
      } else if (action.type === 'confirm' || action.type === 'pick') {
        // Feedback only: a mockup never creates or changes a match/session.
        audio.play('menuSelect');
      } else if (action.type === 'back') {
        this.scene.stop();
        flow.toHome();
      }
    });
    const api = {
      state: () => ({
        layout: this.layout,
        selected: MOCKUP_FIGHTERS[this.selected]!.id,
        stats: this.stats(),
        provisional: true,
        nativeSize: [192, 240],
        crt: screenFx.crt,
        shader: this.cameras.main.postPipelines.length > 0,
        texts: this.labels.map((label) => {
          const t = label.image;
          return {
            text: t.text,
            x: t.x,
            y: t.y,
            width: t.width,
            fontSize: t.fontSize,
            scaleX: t.scaleX,
            scaleY: t.scaleY,
          };
        }),
      }),
      captureNative: () =>
        new Promise<string>((resolve) => {
          this.game.renderer.snapshot((image) => resolve((image as HTMLImageElement).src));
        }),
    };
    (window as unknown as { __characterMockup?: typeof api }).__characterMockup = api;
    this.events.once('shutdown', () => {
      screenFx.crt = previousCrt;
      off();
      delete (window as unknown as { __characterMockup?: typeof api }).__characterMockup;
    });
  }
  private stats(): { rock: number; paper: number; scissors: number; hp: number } {
    const f = MOCKUP_FIGHTERS[this.selected]!;
    return { rock: f.rock, paper: f.paper, scissors: f.scissors, hp: f.hp };
  }
  private select(i: number): void {
    if (i === this.selected) return;
    this.selected = i;
    getContext(this).audio.play('menuMove');
    this.draw();
  }
  private text(
    x: number,
    y: number,
    label: string,
    color: number = C.cream,
    align: 'left' | 'center' | 'right' = 'center',
  ): MenuText {
    const text = new MenuText(this, x, y, label, color, align);
    this.labels.push(text);
    return text;
  }
  private frame(box: Box, selected: boolean): void {
    const g = this.add.graphics();
    g.fillStyle(C.ink).fillRect(box.x + 1, box.y + 2, box.w, box.h);
    g.fillStyle(selected ? C.gold : C.edge).fillRect(box.x, box.y, box.w, box.h);
    g.fillStyle(selected ? 0xa14045 : 0x253e78).fillRect(box.x + 2, box.y + 2, box.w - 4, box.h - 4);
  }
  private cropPortrait(i: number, box: Box, crop: { x: number; y: number; w: number; h: number }): void {
    const f = MOCKUP_FIGHTERS[i]!;
    const texture = this.textures.get(HOME_CHARACTERS.find((c) => c.id === f.id)!.texture);
    const rest = texture.get('rest');
    const key = `select-${crop.x}-${crop.y}-${crop.w}-${crop.h}`;
    if (!texture.has(key))
      texture.add(key, rest.sourceIndex, rest.cutX + crop.x, rest.cutY + crop.y, crop.w, crop.h);
    this.add.image(box.x, box.y, texture.key, key).setOrigin(0).setDisplaySize(box.w, box.h);
  }
  private thumbnail(i: number, box: Box): void {
    this.frame(box, this.selected === i);
    const f = MOCKUP_FIGHTERS[i]!;
    this.cropPortrait(
      i,
      { x: box.x + 2, y: box.y + 2, w: box.w - 4, h: box.h - 4 },
      { x: f.faceX - 50, y: f.faceY - 28, w: 100, h: 56 },
    );
    this.add
      .zone(box.x, box.y, box.w, box.h)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.select(i));
  }
  private draw(): void {
    this.children.removeAll(true);
    this.labels = [];
    menuBackdrop(this);
    menuPanel(this, 47, 187);
    menuTitle(this, 'CHOOSE FIGHTER');
    if (this.layout === 'lineup') this.lineup();
    else if (this.layout === 'hero') this.hero();
    else this.versus();
    const f = MOCKUP_FIGHTERS[this.selected]!;
    if (this.layout !== 'lineup') this.text(95, 160, f.name, C.gold);
    const stats = this.stats();
    const pairs = [
      ['ROCK', stats.rock, C.pink],
      ['PAPER', stats.paper, C.gold],
      ['SCISSORS', stats.scissors, C.cyan],
      ['HP', stats.hp, C.cream],
    ] as const;
    pairs.forEach(([label, value, color], i) => {
      const x = i % 2 ? 103 : 14,
        w = i % 2 ? 73 : 85,
        y = i < 2 ? 176 : 194;
      const g = this.add.graphics();
      g.fillStyle(0x201b49).fillRect(x, y, w, 16);
      g.fillStyle(C.edge).fillRect(x, y, w, 1);
      this.text(x + 4, y + 3, label, color, 'left');
      this.text(x + w - 5, y + 3, String(value), C.cream, 'right');
    });
    const button = this.add.graphics();
    button.fillStyle(0xf18d3e).fillRect(14, 214, 162, 22);
    button.fillStyle(C.gold).fillRect(14, 214, 162, 20);
    button.fillStyle(0xfff2ad).fillRect(14, 214, 162, 1);
    this.text(95, 219, 'SELECT FIGHTER', C.ink);
    this.add
      .zone(14, 214, 162, 22)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => getContext(this).audio.play('menuSelect'));
  }
  private lineup(): void {
    let x = 14;
    MOCKUP_FIGHTERS.forEach((f, i) => {
      const on = i === this.selected,
        w = on ? 62 : 46;
      const box = { x, y: on ? 51 : 63, w, h: on ? 88 : 76 };
      this.frame(box, on);
      this.cropPortrait(
        i,
        { x: x + 2, y: box.y + 2, w: w - 4, h: box.h - 4 },
        { x: f.faceX - Math.floor((w - 4) / 2), y: on ? 46 : 58, w: w - 4, h: box.h - 4 },
      );
      this.text(x + Math.floor(w / 2), 144, f.name, on ? C.gold : C.cream);
      this.add
        .zone(x, 49, w, 106)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.select(i));
      x += w + 4;
    });
  }
  private hero(): void {
    const box = { x: 14, y: 50, w: 162, h: 72 };
    this.frame(box, true);
    this.cropPortrait(this.selected, { x: 16, y: 52, w: 158, h: 68 }, { x: 18, y: 52, w: 158, h: 68 });
    MOCKUP_FIGHTERS.forEach((_, i) => this.thumbnail(i, { x: 14 + i * 56, y: 127, w: 50, h: 28 }));
  }
  private versus(): void {
    const f = MOCKUP_FIGHTERS[this.selected]!;
    const box = { x: 14, y: 52, w: 60, h: 80 };
    this.frame(box, true);
    this.cropPortrait(
      this.selected,
      { x: 16, y: 54, w: 56, h: 76 },
      { x: f.faceX - 28, y: 46, w: 56, h: 76 },
    );
    this.frame({ x: 116, y: 52, w: 60, h: 80 }, false);
    this.text(146, 77, '?', C.cyan);
    this.text(44, 140, 'YOU', C.gold);
    this.text(146, 140, 'RIVAL', C.cyan);
    MOCKUP_FIGHTERS.forEach((f, i) => {
      const box = { x: 81, y: 52 + i * 28, w: 28, h: 24 };
      this.frame(box, this.selected === i);
      this.cropPortrait(
        i,
        { x: box.x + 2, y: box.y + 2, w: 24, h: 20 },
        { x: f.faceX - 36, y: f.faceY - 30, w: 72, h: 60 },
      );
      this.add
        .zone(77, box.y, 36, 28)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.select(i));
    });
  }
}

/** Dev-only review entry. Normal Home, selection, sessions, rules and CRT tuning are untouched. */
export function mountCharacterSelectReview(game: Phaser.Game): void {
  const query = new URLSearchParams(location.search);
  const layout = query.get('characterReview');
  if (layout !== 'lineup' && layout !== 'hero' && layout !== 'versus') return;
  const index = MOCKUP_FIGHTERS.findIndex((f) => f.id === query.get('fighter'));
  const tick = () => {
    if (!game.scene.isActive(SceneKey.home)) return;
    game.events.off('step', tick);
    game.scene.getScene(SceneKey.home).time.delayedCall(500, () => {
      game.scene.stop(SceneKey.home);
      game.scene.add(KEY, CharacterSelectMockup, true, { layout, fighter: Math.max(0, index) });
    });
  };
  game.events.on('step', tick);
}
