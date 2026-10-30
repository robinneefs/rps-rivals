import Phaser from 'phaser';
import { rematchNotice, showDisconnect } from '../views/OnlineNotice';
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

    // Identify the winning player consistently, including mirrors.
    const mirror = session.fighters.p1 === session.fighters.p2;
    const winnerLabel = won ? 'YOU WIN!' : `${session.opponentName} WINS`;
    const victory = new VictoryView(this, session.fighters[winner], winnerLabel, mirror && winner === 'p2');
    // Status remains visible while the online rematch handshake is pending.
    const notice = rematchNotice(this);

    let leaving = false;
    let asked = false;
    const menu = new MenuView(
      this,
      resultMenu({
        retry: () => {
          if (leaving || asked) return;
          asked = true;
          if (setup.mode === 'online') notice(true);
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
    const ended = (rivalLeft: boolean) => {
      if (leaving) return;
      leaving = true;
      menu.lock();
      showDisconnect(this, rivalLeft, () => flow.toHome());
    };
    const offs = [
      session.on('rematchAccepted', () => {
        if (leaving) return;
        leaving = true;
        menu.lock();
        flow.toFight(setup, session);
      }),
      session.on('rematchRequested', ({ side }) => {
        if (!leaving && !asked && side !== session.me) notice(false);
      }),
      session.on('opponentLeft', () => ended(true)),
      session.on('disconnected', () => ended(false)),
      input.on('action', (a) => {
        if (a.type === 'back' && this.scene.isActive() && !leaving) {
          audio.play('menuBack');
          leaving = true;
          menu.lock();
          flow.toHome();
        }
      }),
    ];
    if (session.endedReason) ended(session.endedReason === 'opponentLeft');
    else if (session.rivalRequestedRematch) notice(false);
    this.events.once('shutdown', () => offs.forEach((off) => off()));
  }
}
