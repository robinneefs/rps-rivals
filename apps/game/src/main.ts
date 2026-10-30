import { defaultRules, defaultTimings } from '@rps/core';
import Phaser from 'phaser';
import { AudioService } from './audio/AudioService';
import { CabinetView } from './cabinet/CabinetView';
import { MONITOR } from './config/layout';
import { palette } from './config/palette';
import { tuning } from './config/tuning';
import { InputRouter } from './input/InputRouter';
import { deviceHaptics, Haptics } from './platform/haptics';
import { hookBackButton, onAppActive } from './platform/native';
import { browserStore, SettingsStore } from './platform/settings';
import { BootScene } from './scenes/BootScene';
import { CabinetShake } from './fx/cabinetShake';
import { registerCrt, screenFx } from './fx/crt';
import { mountCrtDisplay } from './fx/CrtDisplay';
import { CabinetLights, setContext } from './scenes/context';
import { FightScene } from './scenes/FightScene';
import { SceneFlow } from './scenes/flow';
import { HomeScene } from './scenes/HomeScene';
import { LobbyScene } from './scenes/LobbyScene';
import { LogoScene } from './scenes/LogoScene';
import { HowToScene } from './scenes/HowToScene';
import { OptionsScene } from './scenes/OptionsScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { ResultScene } from './scenes/ResultScene';
import { SceneKey } from './scenes/keys';
import { TransitionScene } from './scenes/TransitionScene';
import { VERSION } from './version';

const settings = new SettingsStore(browserStore());
const input = new InputRouter();
const cabinetShake = new CabinetShake();
const lights = new CabinetLights();
// made once the game exists; the joystick only clicks after a first touch anyway
let audio: AudioService | null = null;
const cabinet = new CabinetView(
  {
    press: (m) => input.pressButton(m),
    release: (m) => input.releaseButton(m),
    stick: (t) => input.setStick(t.x, t.y),
    stickClick: () => audio?.play('stickClick'),
  },
  cabinetShake,
);
cabinet.setPixelPerfect(settings.value.pixelPerfect);
settings.onChange((s) => cabinet.setPixelPerfect(s.pixelPerfect));
input.on('button', (e) => cabinet.setDown(e.move, e.down));
input.on('stick', (t) => cabinet.setTilt(t));
lights.onChange((m) => cabinet.setSelected(m));

/** One framebuffer pixel is one game pixel; the browser enlarges with nearest sampling. */
const canvasSize = () => ({
  width: MONITOR.width,
  height: MONITOR.height,
  zoom: cabinet.canvasZoom,
});
const size = canvasSize();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: cabinet.screen,
  backgroundColor: palette.black,
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: { mode: Phaser.Scale.NONE, width: size.width, height: size.height, zoom: size.zoom },
  // order = draw order: the monitor screens, the wipe on top
  scene: [
    BootScene,
    LogoScene,
    HomeScene,
    OptionsScene,
    CharacterSelectScene,
    HowToScene,
    LobbyScene,
    FightScene,
    ResultScene,
    TransitionScene,
  ],
});
// Preserve the native pixel grid when fitting the cabinet opening.
const fitCanvas = () => {
  Object.assign(game.canvas.style, {
    imageRendering: 'pixelated',
    display: 'block',
    marginLeft: `${cabinet.monitorInsetX}px`,
  });
  game.scale.updateBounds();
};
audio = new AudioService(game, settings);
const flow = new SceneFlow(game, audio);
const haptics = new Haptics(deviceHaptics(), () => settings.value.vibration, tuning.haptics);
setContext(game, {
  input,
  cabinet,
  settings,
  flow,
  lights,
  audio,
  cabinetShake,
  haptics,
});
cabinet.onResize(() => {
  const s = canvasSize();
  game.scale.resize(s.width, s.height);
  game.scale.setZoom(s.zoom);
  fitCanvas();
});
// the cabinet rattles on the game's clock (slow motion and a paused game hold it too)
game.events.on(Phaser.Core.Events.STEP, (time: number) =>
  cabinetShake.tick(time, tuning.cabinet.shakeStepMs),
);

// Present the native pixel framebuffer through a display-resolution CRT pass.
game.events.once(Phaser.Core.Events.READY, () => {
  fitCanvas();
  registerCrt(game);
  mountCrtDisplay(game, cabinet);
  const apply = (on: boolean) => {
    screenFx.crt = on;
  };
  apply(settings.value.crt);
  settings.onChange((s) => apply(s.crt));
});

// the Android app: the phone's back button backs out of menus, and leaves the app from home
hookBackButton(
  () => game.scene.isActive(SceneKey.home),
  () => input.back(),
);

// the Android app in the background (home button, another app): the same as a hidden browser tab,
// so the game loop and a CPU match wait, and all sound stops until it comes back
onAppActive((active) => {
  game.events.emit(active ? Phaser.Core.Events.VISIBLE : Phaser.Core.Events.HIDDEN);
  game.events.emit(active ? Phaser.Core.Events.FOCUS : Phaser.Core.Events.BLUR);
});

// Dev tuning panel (npm run dev only; never in a release build). Toggle with the ` key.
if (import.meta.env.DEV) {
  if (new URLSearchParams(location.search).has('characterReview')) {
    void import('./dev/characterSelectReview').then(({ mountCharacterSelectReview }) =>
      mountCharacterSelectReview(game),
    );
  }
  if (new URLSearchParams(location.search).has('menuReview')) {
    void import('./dev/menuReview').then(({ mountMenuReview }) => mountMenuReview(game, flow));
  }
  if (new URLSearchParams(location.search).has('roundReview'))
    void import('./dev/roundReview').then(({ mountRoundReview }) => mountRoundReview(game));
  else void import('./dev/effectsPanel').then(({ mountEffectsPanel }) => mountEffectsPanel(game, settings));
  if (new URLSearchParams(location.search).has('legacyTuning'))
    void import('./dev/tuningPanel').then(({ mountTuningPanel }) => {
      const pane = mountTuningPanel({
        groups: [
          { file: 'apps/game/src/config/tuning.ts', title: 'Feel (live)', tree: tuning, expanded: true },
          {
            file: 'packages/core/src/config.ts (defaultRules)',
            title: 'Rules (next match)',
            tree: defaultRules,
          },
          {
            file: 'packages/core/src/config.ts (defaultTimings)',
            title: 'Phase timings (next match)',
            tree: defaultTimings,
          },
        ],
        restartMatch: () => flow.toFight({ mode: 'cpu', cpu: 'random' }),
      });
      if (new URLSearchParams(location.search).get('menuReview')) pane.hidden = true;
    });
}

// A small read-only hook for the smoke tests: which screens are running, and the match phase.
(window as unknown as { __rps: object }).__rps = {
  scenes: () => game.scene.getScenes(true).map((s) => s.scene.key),
  phase: () => flow.activeSession?.snapshot().phase ?? null,
  transitioning: () => flow.transitioning,
  renderScale: () => cabinet.renderScale,
  music: () => audio.music,
  fighters: () => flow.activeSession?.fighters ?? null,
  snapshot: () =>
    new Promise<string>((resolve) =>
      game.renderer.snapshot((image) => resolve((image as HTMLImageElement).src)),
    ),
  homePortrait: () =>
    game.scene.isActive(SceneKey.home)
      ? (game.scene.getScene(SceneKey.home) as HomeScene).portraitState
      : null,
  characterSelection: () =>
    game.scene.isActive(SceneKey.characterSelect)
      ? (game.scene.getScene(SceneKey.characterSelect) as CharacterSelectScene).state
      : null,
  combatTextures: () =>
    game.scene.isActive(SceneKey.fight)
      ? game.scene
          .getScene(SceneKey.fight)
          .children.list.filter((object) => object.name === 'fighter-p1' || object.name === 'fighter-p2')
          .map((object) => (object as Phaser.GameObjects.Sprite).texture.key)
      : [],
  stage: () => {
    if (!game.scene.isActive(SceneKey.fight)) return null;
    const scene = game.scene.getScene(SceneKey.fight);
    return {
      id: scene.data.get('stageId'),
      effects: scene.data.get('stageEffects'),
      layers: scene.children.list.map((object) => object.name).filter(Boolean),
    };
  },
  version: VERSION,
};
