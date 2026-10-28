import type Phaser from 'phaser';
import { tuning } from '../config/tuning';
import { menuColors as C, MenuText } from './MenuStyle';

/** A monitor-sized notice that stays above combat effects and result art. */
export function showDisconnect(scene: Phaser.Scene, rivalLeft: boolean, onReturn: () => void): void {
  const layer = scene.add.container(0, 0).setDepth(10000);
  const panel = scene.add.graphics();
  panel.fillStyle(C.ink, 0.85).fillRect(0, 0, 192, 240);
  panel.fillStyle(C.ink).fillRect(8, 76, 178, 89);
  panel.fillStyle(C.panel).fillRect(6, 73, 178, 89);
  panel.fillStyle(C.pink).fillRect(6, 73, 178, 3);
  layer.add(panel);
  const text = (y: number, label: string, color: number = C.cream) => {
    const line = new MenuText(scene, 95, y, label, color);
    layer.add(line.image);
    return line;
  };
  text(85, rivalLeft ? 'RIVAL DISCONNECTED' : 'CONNECTION LOST', C.pink);
  text(106, 'THIS MATCH HAS ENDED');
  text(122, 'REMATCH UNAVAILABLE');
  const countdown = text(144, '', C.cyan);
  const started = scene.time.now;
  const refresh = () =>
    countdown.setText(
      `MAIN MENU IN ${Math.max(1, Math.ceil((tuning.online.endedHoldMs - (scene.time.now - started)) / 1000))}`,
    );
  refresh();
  const timer = scene.time.addEvent({ delay: 100, loop: true, callback: refresh });
  scene.time.delayedCall(tuning.online.endedHoldMs, () => {
    timer.remove();
    onReturn();
  });
}

/** Persistent invitation above the result actions; never blocks accepting it. */
export function rematchNotice(scene: Phaser.Scene): (waiting: boolean) => void {
  const panel = scene.add.graphics().setDepth(100);
  panel.fillStyle(C.ink, 0.96).fillRect(6, 139, 178, 39);
  panel.fillStyle(C.gold).fillRect(6, 139, 3, 39);
  const title = new MenuText(scene, 97, 144, '', C.gold);
  const hint = new MenuText(scene, 97, 160, '', C.cream);
  title.image.setDepth(101);
  hint.image.setDepth(101);
  panel.setVisible(false);
  return (waiting) => {
    panel.setVisible(true);
    title.setText(waiting ? 'REMATCH REQUESTED' : 'RIVAL WANTS A REMATCH');
    hint.setText(waiting ? 'WAITING FOR RIVAL...' : 'SELECT REMATCH TO ACCEPT');
  };
}
