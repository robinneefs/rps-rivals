import type Phaser from 'phaser';
import type { MatchSession } from '../session/MatchSession';

/** Reconcile persistent connection state after mobile suspension, not just one-shot events. */
export function watchSessionEnd(
  scene: Phaser.Scene,
  session: MatchSession,
  onEnd: (rivalLeft: boolean) => void,
): () => void {
  let notified = false;
  const check = () => {
    if (notified || !session.endedReason || document.visibilityState === 'hidden' || !scene.scene.isActive())
      return;
    notified = true;
    onEnd(session.endedReason === 'opponentLeft');
  };
  const offs = [session.on('opponentLeft', check), session.on('disconnected', check)];
  // Covers events delivered while hidden or before create() has made the scene active.
  scene.events.on('preupdate', check);
  scene.game.events.on('visible', check);
  scene.game.events.on('focus', check);
  document.addEventListener('visibilitychange', check);
  const off = () => {
    offs.forEach((unsubscribe) => unsubscribe());
    scene.events.off('preupdate', check);
    scene.game.events.off('visible', check);
    scene.game.events.off('focus', check);
    document.removeEventListener('visibilitychange', check);
  };
  scene.events.once('shutdown', off);
  return off;
}
