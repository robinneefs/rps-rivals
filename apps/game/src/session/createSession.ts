import { defaultRules, defaultTimings, mathRandomRng } from '@rps/core';
import { SERVER_URL } from '../config/online';
import { VERSION } from '../version';
import { browserClock } from './browserClock';
import { RandomCpu } from './cpu/RandomCpu';
import { LocalSession } from './LocalSession';
import type { MatchSession, MatchSetup } from './MatchSession';
import { OnlineSession } from './OnlineSession';
import { openBrowserSocket } from './openBrowserSocket';

/**
 * Builds the session a match setup describes.
 * Each CPU match gets its own copy of the rules and timings, so the dev tuning panel's edits
 * apply from the next match instead of changing one halfway through. Online, the room's rules win.
 */
export function createSession(setup: MatchSetup): MatchSession {
  switch (setup.mode) {
    case 'cpu':
      return new LocalSession(
        structuredClone(defaultRules),
        structuredClone(defaultTimings),
        browserClock,
        mathRandomRng,
        new RandomCpu(),
        setup.fighters ? { ...setup.fighters } : undefined,
      );
    case 'online':
      return connectOnline(setup.roomCode, 'join');
  }
}

/** Opens a connection to an online room: `create` a new one, or `join` one that is waiting. */
export function connectOnline(roomCode: string, intent: 'create' | 'join'): OnlineSession {
  if (!SERVER_URL) throw new Error('Online play is not set up in this build');
  return new OnlineSession({
    serverUrl: SERVER_URL,
    roomCode,
    intent,
    version: VERSION,
    openSocket: openBrowserSocket,
    now: browserClock.now,
  });
}
