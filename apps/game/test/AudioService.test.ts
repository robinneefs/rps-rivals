import type Phaser from 'phaser';
import { afterEach, expect, it, vi } from 'vitest';
import { AudioService } from '../src/audio/AudioService';
import { DEFAULT_SETTINGS, SettingsStore } from '../src/platform/settings';

afterEach(() => vi.unstubAllGlobals());

it('discards unfocused/suspended effects and destroys existing one-shots without stopping music', () => {
  const handlers = new Map<string, () => void>();
  const effect = { key: 'sfx.hitRock_1', destroy: vi.fn() };
  const music = { key: 'music.harbor', destroy: vi.fn() };
  const context = { state: 'running' };
  const sound = {
    locked: false,
    gameLostFocus: false,
    context,
    on: vi.fn(),
    play: vi.fn(),
    getAll: (key: string) => [effect, music].filter((s) => s.key === key),
  };
  const game = {
    sound,
    events: { on: (name: string, callback: () => void) => handlers.set(name, callback) },
    cache: { audio: { exists: () => true } },
  };
  const settings = new SettingsStore({ getItem: () => JSON.stringify(DEFAULT_SETTINGS), setItem() {} });
  const doc = { hidden: false };
  vi.stubGlobal('document', doc);
  const audio = new AudioService(game as unknown as Phaser.Game, settings);
  audio.play('hitRock');
  expect(sound.play).toHaveBeenCalledOnce();
  sound.gameLostFocus = true;
  handlers.get('blur')!();
  for (let i = 0; i < 20; i++) audio.play('hitRock');
  expect(sound.play).toHaveBeenCalledOnce();
  expect(effect.destroy).toHaveBeenCalledOnce();
  expect(music.destroy).not.toHaveBeenCalled();
  sound.gameLostFocus = false;
  context.state = 'suspended';
  audio.play('hitRock');
  context.state = 'running';
  doc.hidden = true;
  audio.play('hitRock');
  expect(sound.play).toHaveBeenCalledOnce();
  doc.hidden = false;
  audio.play('hitRock');
  expect(sound.play).toHaveBeenCalledTimes(2);
});
