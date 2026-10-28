import type Phaser from 'phaser';
import type { SceneFlow } from '../scenes/flow';
import { SceneKey } from '../scenes/keys';

/** Local-only links for reviewing real menu scenes without finishing a match or connecting a rival. */
export function mountMenuReview(game: Phaser.Game, flow: SceneFlow): void {
  const review = new URLSearchParams(location.search).get('menuReview');
  if (!review || !['online', 'create', 'join', 'win', 'loss', 'characters'].includes(review)) return;
  let opened = false;
  const tick = () => {
    if (!game.scene.isActive(SceneKey.home)) return;
    game.events.off('step', tick);
    const home = game.scene.getScene(SceneKey.home);
    home.time.delayedCall(700, () => {
      if (review === 'characters') flow.toCharacterSelect({ mode: 'cpu', cpu: 'random' });
      else if (review === 'win' || review === 'loss') {
        flow.toFight({ mode: 'cpu', cpu: 'random' });
        const result = () => {
          if (!game.scene.isActive(SceneKey.fight) || opened) return;
          opened = true;
          game.events.off('step', result);
          game.scene.getScene(SceneKey.fight).time.delayedCall(700, () => {
            const session = flow.activeSession;
            if (!session) return;
            const winner = review === 'win' ? 'p1' : 'p2';
            flow.toResult({
              setup: { mode: 'cpu', cpu: 'random' },
              session,
              winner,
              state: {
                ...session.snapshot().state,
                roundsWon: winner === 'p1' ? { p1: 2, p2: 1 } : { p1: 0, p2: 2 },
              },
            });
          });
        };
        game.events.on('step', result);
      } else {
        // Use the same scene init contract as normal lobby navigation.
        game.scene.stop(SceneKey.home);
        game.scene.start(SceneKey.lobby, { mode: review === 'online' ? 'menu' : review });
      }
    });
  };
  game.events.on('step', tick);
}
