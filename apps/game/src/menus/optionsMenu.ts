import { VOLUME_MAX, type Settings } from '../platform/settings';
import type { MenuItem } from './MenuItem';

/** Under the menu while the cursor is on a sound item. */
export const SOUND_HINT: [string, string] = ['STICK LEFT / RIGHT', 'CHANGES THE VOLUME'];

/** A volume as a small bar, e.g. "||||||....", or OFF at 0. */
export const volumeTag = (v: number): string =>
  v === 0 ? 'OFF' : '|'.repeat(v) + '.'.repeat(VOLUME_MAX - v);

export const soundTag = (muted: boolean): string => (muted ? 'OFF' : 'ON');

export const onOffTag = (on: boolean): string => (on ? 'ON' : 'OFF');

/** Under the menu while the cursor is on CRT SCREEN. */
export const CRT_HINT: [string, string] = ['SCANLINES AND A SOFT GLOW', 'LIKE AN OLD ARCADE TUBE'];

/** Under the menu while the cursor is on VIBRATION. */
export const VIBRATION_HINT: [string, string] = ['THE PHONE BUZZES WITH', 'EVERY SCREEN SHAKE'];

export type VolumeId = 'music' | 'sfx';

/** VIBRATION is only listed on a device that can vibrate. */
export const optionsMenu = (
  settings: Settings,
  show: { vibration: boolean },
  actions: {
    toggleCrt: () => void;
    toggleVibration: () => void;
    toggleSound: () => void;
    stepVolume: (id: VolumeId) => void;
    back: () => void;
  },
): MenuItem[] => [
  {
    id: 'crt',
    label: 'CRT SCREEN',
    tag: onOffTag(settings.crt),
    enabled: true,
    onSelect: actions.toggleCrt,
  },
  ...(show.vibration
    ? [
        {
          id: 'vibration',
          label: 'VIBRATION',
          tag: onOffTag(settings.vibration),
          enabled: true,
          onSelect: actions.toggleVibration,
        },
      ]
    : []),
  {
    id: 'sound',
    label: 'SOUND',
    tag: soundTag(settings.muted),
    enabled: true,
    onSelect: actions.toggleSound,
  },
  {
    id: 'music',
    label: 'MUSIC',
    tag: volumeTag(settings.musicVolume),
    enabled: true,
    onSelect: () => actions.stepVolume('music'),
  },
  {
    id: 'sfx',
    label: 'EFFECTS',
    tag: volumeTag(settings.sfxVolume),
    enabled: true,
    onSelect: () => actions.stepVolume('sfx'),
  },
  { id: 'back', label: 'BACK', enabled: true, onSelect: actions.back },
];
