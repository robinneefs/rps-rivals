import Phaser from 'phaser';
import { menuBackdrop, menuPanel, menuTitle } from '../views/MenuStyle';
import { onOffTag, optionsMenu, soundTag, volumeTag, type VolumeId } from '../menus/optionsMenu';
import { stepVolume } from '../platform/settings';
import { OptionsMenuView } from '../views/OptionsMenuView';
import { getContext } from './context';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';

const VOLUME_KEY = { music: 'musicVolume', sfx: 'sfxVolume' } as const;

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
    menuBackdrop(this);
    menuPanel(this, 47, 190);
    menuTitle(this, 'OPTIONS');
    // VIBRATION only on phones
    const listed = { vibration: haptics.supported };

    let leaving = false;
    const back = () => {
      if (leaving) return;
      leaving = true;
      menu.lock();
      flow.toHome();
    };
    const toggleSound = () => settings.set('muted', !settings.value.muted);
    const toggleCrt = () => settings.set('crt', !settings.value.crt);
    const togglePixelPerfect = () => settings.set('pixelPerfect', !settings.value.pixelPerfect);
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
    const menu = new OptionsMenuView(
      this,
      optionsMenu(settings.value, listed, {
        toggleCrt,
        togglePixelPerfect,
        toggleVibration,
        toggleSound,
        stepVolume: (id) => changeVolume(id, 1, true),
        back,
      }),
      input,
      audio,
      (id, level) => {
        const key = VOLUME_KEY[id];
        if (settings.value[key] === level) return;
        settings.set(key, level);
        if (id === 'sfx') audio.play('menuMove');
      },
    );

    const show = () => {
      const s = settings.value;
      menu.setTag('crt', onOffTag(s.crt));
      menu.setTag('pixelPerfect', onOffTag(s.pixelPerfect));
      menu.setTag('vibration', onOffTag(s.vibration));
      menu.setTag('sound', soundTag(s.muted));
      menu.setTag('music', volumeTag(s.musicVolume));
      menu.setTag('sfx', volumeTag(s.sfxVolume));
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
          else if (id === 'pixelPerfect') togglePixelPerfect();
          else if (id === 'vibration') toggleVibration();
          else if (id === 'sound') toggleSound();
          else if (id === 'music' || id === 'sfx') changeVolume(id, dir, false);
        }
        show();
      }),
    ];
    this.events.once('shutdown', () => offs.forEach((off) => off()));
  }
}
