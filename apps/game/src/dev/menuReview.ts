import type Phaser from 'phaser';
import type { SceneFlow } from '../scenes/flow';
import { SceneKey } from '../scenes/keys';
import { isPlayableCharacter } from '@rps/core';

/** Local-only links for reviewing real menu scenes without finishing a match or connecting a rival. */
export function mountMenuReview(game: Phaser.Game, flow: SceneFlow): void {
  const review = new URLSearchParams(location.search).get('menuReview');
  if (
    !review ||
    !['online', 'create', 'join', 'win', 'loss', 'characters', 'victory', 'stage'].includes(review)
  )
    return;
  let opened = false;
  const tick = () => {
    if (!game.scene.isActive(SceneKey.home)) return;
    game.events.off('step', tick);
    const home = game.scene.getScene(SceneKey.home);
    home.time.delayedCall(700, () => {
      if (review === 'characters') flow.toCharacterSelect({ mode: 'cpu', cpu: 'random' });
      else if (review === 'stage')
        flow.toFight({ mode: 'cpu', cpu: 'random', fighters: { p1: 'riot', p2: 'taiko' } });
      else if (review === 'win' || review === 'loss' || review === 'victory') {
        const requested = new URLSearchParams(location.search).get('fighter');
        const fighter = requested && isPlayableCharacter(requested) ? requested : 'riot';
        const alternate =
          review === 'victory' && new URLSearchParams(location.search).get('palette') === 'alternate';
        const setup = {
          mode: 'cpu',
          cpu: 'random',
          ...(review === 'victory'
            ? { fighters: { p1: fighter, p2: alternate ? fighter : 'taiko' } as const }
            : {}),
        } as const;
        flow.toFight(setup);
        const result = () => {
          if (!game.scene.isActive(SceneKey.fight) || opened) return;
          opened = true;
          game.events.off('step', result);
          game.scene.getScene(SceneKey.fight).time.delayedCall(700, () => {
            const session = flow.activeSession;
            if (!session) return;
            const winner = review === 'loss' || alternate ? 'p2' : 'p1';
            flow.toResult({
              setup,
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
