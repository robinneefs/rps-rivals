import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import type { MatchSession } from '../src/session/MatchSession';
import { watchSessionEnd } from '../src/scenes/watchSessionEnd';

function setup() {
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  vi.stubGlobal('document', doc);
  const events = new EventEmitter();
  const gameEvents = new EventEmitter();
  const network = new EventEmitter();
  let active = true;
  const session = {
    endedReason: null as string | null,
    on(name: string, callback: () => void) {
      network.on(name, callback);
      return () => network.off(name, callback);
    },
  };
  const scene = { events, game: { events: gameEvents }, scene: { isActive: () => active } };
  const ended = vi.fn();
  watchSessionEnd(scene as unknown as Phaser.Scene, session as unknown as MatchSession, ended);
  return {
    doc,
    events,
    gameEvents,
    network,
    session,
    ended,
    activate: (value: boolean) => {
      active = value;
    },
  };
}

afterEach(() => vi.unstubAllGlobals());
describe('online disconnect reconciliation', () => {
  it('shows a hidden disconnect once when the phone returns, then releases listeners on shutdown', () => {
    const { doc, events, network, session, ended } = setup();
    doc.visibilityState = 'hidden';
    session.endedReason = 'disconnected';
    network.emit('disconnected');
    events.emit('preupdate');
    expect(ended).not.toHaveBeenCalled();
    doc.visibilityState = 'visible';
    doc.dispatchEvent(new Event('visibilitychange'));
    events.emit('preupdate');
    expect(ended).toHaveBeenCalledExactlyOnceWith(false);
    events.emit('shutdown');
    expect(network.listenerCount('disconnected')).toBe(0);
    expect(events.listenerCount('preupdate')).toBe(0);
  });
  it('recovers a missed event from persistent endedReason after the scene becomes active', () => {
    const { activate, events, gameEvents, session, ended } = setup();
    activate(false);
    session.endedReason = 'opponentLeft';
    gameEvents.emit('visible');
    expect(ended).not.toHaveBeenCalled();
    activate(true);
    events.emit('preupdate');
    expect(ended).toHaveBeenCalledExactlyOnceWith(true);
  });
  it('does not report a live connection on focus or resume', () => {
    const { gameEvents, events, ended } = setup();
    gameEvents.emit('focus');
    gameEvents.emit('visible');
    events.emit('preupdate');
    expect(ended).not.toHaveBeenCalled();
  });
});
