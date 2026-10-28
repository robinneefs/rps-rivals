import Phaser from 'phaser';
import { palette } from '../config/palette';
import { tuning } from '../config/tuning';
import { resultMenu } from '../menus/resultMenu';
import { MenuView } from '../views/MenuView';
import { getContext } from './context';
import type { ResultData } from './flow';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';
import { VictoryView } from '../views/VictoryView';

/** Winner portrait splash with the existing local/online rematch and exit actions. */
export class ResultScene extends Phaser.Scene {
  private result!: ResultData;

  constructor() {
    super(SceneKey.result);
  }

  init(data: ResultData): void {
    this.result = data;
  }

  create(): void {
    const { flow, input, audio } = getContext(this);
    const { session, setup, winner } = this.result;
    useMonitorCamera(this);

    const won = winner === session.me;
    audio.play(won ? 'winJingle' : 'loseJingle');

    // In a mirror, the portrait/name alone cannot identify which player won.
    const mirror = session.fighters.p1 === session.fighters.p2;
    const winnerLabel = mirror ? (won ? 'YOU WIN!' : `${session.opponentName} WINS`) : undefined;
    const victory = new VictoryView(this, session.fighters[winner], winnerLabel, mirror && winner === 'p2');
    // Status remains visible while the online rematch handshake is pending.
    const note = victory.note;

    let leaving = false;
    let asked = false;
    const menu = new MenuView(
      this,
      resultMenu({
        retry: () => {
          if (leaving || asked) return;
          asked = true;
          note.setText('WAITING FOR RIVAL');
          session.requestRematch(); // online: waits for the opponent; locally accepted at once
        },
        mainMenu: () => {
          if (leaving) return;
          leaving = true;
          menu.lock();
          flow.toHome();
        },
      }),
      victory.menuY,
      input,
      audio,
    );
    const ended = (text: string) => {
      if (leaving) return;
      leaving = true;
      menu.lock();
      note.setText(text).setColor(palette.pink);
      this.time.delayedCall(tuning.online.endedHoldMs, () => flow.toHome());
    };
    const offs = [
      session.on('rematchAccepted', () => {
        leaving = true;
        menu.lock();
        flow.toFight(setup, session);
      }),
      session.on('rematchRequested', ({ side }) => {
        if (side !== session.me) note.setText('RIVAL WANTS A REMATCH').setColor(palette.gold);
      }),
      session.on('opponentLeft', () => ended('RIVAL LEFT')),
      session.on('disconnected', () => ended('CONNECTION LOST')),
      input.on('action', (a) => {
        if (a.type === 'back' && this.scene.isActive() && !leaving) {
          audio.play('menuBack');
          leaving = true;
          menu.lock();
          flow.toHome();
        }
      }),
    ];
    this.events.once('shutdown', () => offs.forEach((off) => off()));
  }
}
