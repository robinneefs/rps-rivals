import Phaser from 'phaser';
import { Tex } from '../assets/keys';
import { MONITOR } from '../config/layout';
import { palette } from '../config/palette';
import {
  CRT_HINT,
  onOffTag,
  optionsMenu,
  SOUND_HINT,
  VIBRATION_HINT,
  soundTag,
  volumeTag,
  type VolumeId,
} from '../menus/optionsMenu';
import { stepVolume } from '../platform/settings';
import { MenuView } from '../views/MenuView';
import { PixelText } from '../views/PixelText';
import { addMenuBackdrop } from '../views/MenuBackdrop';
import { getContext } from './context';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';

const VOLUME_KEY = { music: 'musicVolume', sfx: 'sfxVolume' } as const;
const NO_HINT: [string, string] = ['', ''];

/**
 * Options: the CRT look, vibration (phones only) and sound (on/off, music and effects volume).
 * Changes apply at once.
 */
export class OptionsScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.options);
  }

  create(): void {
    const { flow, input, settings, audio, haptics } = getContext(this);
    useMonitorCamera(this);
    const cx = MONITOR.width / 2;
    addMenuBackdrop(this);
    this.add.tileSprite(0, 0, MONITOR.width, MONITOR.height, Tex.dither).setOrigin(0);
    // VIBRATION only on phones
    const listed = { vibration: haptics.supported };
    new PixelText(this, cx, 20, 'OPTIONS', {
      size: 3,
      color: palette.cyan,
      align: 'center',
      outline: palette.ink,
      shadow: palette.shadow,
    });

    let leaving = false;
    const back = () => {
      if (leaving) return;
      leaving = true;
      menu.lock();
      flow.toHome();
    };
    const toggleSound = () => settings.set('muted', !settings.value.muted);
    const toggleCrt = () => settings.set('crt', !settings.value.crt);
    const toggleVibration = () => {
      settings.set('vibration', !settings.value.vibration);
      haptics.preview();
    };
    /** Select steps the volume up and wraps to OFF; the stick steps it either way. */
    const changeVolume = (id: VolumeId, dir: 1 | -1, wrap: boolean) => {
      const key = VOLUME_KEY[id];
      settings.set(key, stepVolume(settings.value[key], dir, wrap));
      // a short preview of the new effects volume (the music is already playing)
      if (id === 'sfx') audio.play('menuMove');
    };
    const menu = new MenuView(
      this,
      optionsMenu(settings.value, listed, {
        toggleCrt,
        toggleVibration,
        toggleSound,
        stepVolume: (id) => changeVolume(id, 1, true),
        back,
      }),
      44,
      input,
      audio,
      196,
    );

    const hintY = menu.bottom + 7;
    this.add.rectangle(0, hintY, MONITOR.width, 25, palette.panel).setOrigin(0);
    const hint = [0, 1].map(
      (i) =>
        new PixelText(this, cx, hintY + 5 + i * 10, '', {
          color: palette.lilac,
          align: 'center',
          shadow: palette.ink,
        }),
    );
    const show = () => {
      const s = settings.value;
      menu.setTag('crt', onOffTag(s.crt));
      menu.setTag('vibration', onOffTag(s.vibration));
      menu.setTag('sound', soundTag(s.muted));
      menu.setTag('music', volumeTag(s.musicVolume));
      menu.setTag('sfx', volumeTag(s.sfxVolume));
      const id = menu.selectedId;
      const lines =
        id === 'sound' || id === 'music' || id === 'sfx'
          ? SOUND_HINT
          : id === 'crt'
            ? CRT_HINT
            : id === 'vibration'
              ? VIBRATION_HINT
              : NO_HINT;
      lines.forEach((line, i) => hint[i]?.setText(line));
    };
    show();

    const offs = [
      settings.onChange(show),
      input.on('action', (a) => {
        if (leaving || !this.scene.isActive()) return;
        if (a.type === 'back') {
          audio.play('menuBack');
          back();
        } else if (a.type === 'nav' && (a.dir === 'left' || a.dir === 'right')) {
          // left / right also change the setting under the cursor
          const dir = a.dir === 'right' ? 1 : -1;
          const id = menu.selectedId;
          if (id === 'crt') toggleCrt();
          else if (id === 'vibration') toggleVibration();
          else if (id === 'sound') toggleSound();
          else if (id === 'music' || id === 'sfx') changeVolume(id, dir, false);
        }
        // the hint follows the cursor (the menu has already moved it)
        show();
      }),
    ];
    this.events.once('shutdown', () => offs.forEach((off) => off()));
  }
}
