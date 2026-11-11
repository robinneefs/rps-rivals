import type Phaser from 'phaser';
import { tuning } from '../config/tuning';
import { screenFx } from '../fx/crt';
import { playScreenEffect, screenEffects } from '../fx/screenEffects';
import type { SettingsStore } from '../platform/settings';

/** Separate DOM workbench; it never passes through the game's pixel raster. */
export function mountEffectsPanel(game: Phaser.Game, settings: SettingsStore): void {
  const defaults = { ...tuning.crt };
  const effectDefaults = structuredClone(screenEffects);
  const storageKey = 'rps.effects-workbench.v1';
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    for (const [key, value] of Object.entries(saved.crt ?? {}))
      if (key in tuning.crt && typeof value === 'number' && Number.isFinite(value))
        Object.assign(tuning.crt, { [key]: value });
    for (const name of Object.keys(screenEffects) as (keyof typeof screenEffects)[])
      for (const [key, value] of Object.entries(saved.effects?.[name] ?? {}))
        if (key in screenEffects[name] && typeof value === 'number' && Number.isFinite(value))
          Object.assign(screenEffects[name], { [key]: value });
  } catch {
    /* Storage is optional. */
  }
  const save = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ crt: tuning.crt, effects: screenEffects }));
    } catch {
      /* Live edits still work. */
    }
  };
  const host = document.createElement('div');
  document.body.append(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    :host{position:fixed;right:18px;top:18px;z-index:30;font:13px/1.5 system-ui,sans-serif;color:#e9eaf2}
    *{box-sizing:border-box}button,input{font:inherit}button{cursor:pointer;color:inherit;border:1px solid #3b4154;background:#252b3c;border-radius:8px;padding:8px 12px}button:hover{background:#39435b}button:focus-visible,input:focus-visible{outline:2px solid #9eaaff;outline-offset:2px}
    .panel{width:360px;max-width:calc(100vw - 36px);max-height:calc(100dvh - 36px);overflow:auto;background:#151a26f5;border:1px solid #41485f;border-radius:16px;box-shadow:0 16px 60px #0009}
    header{padding:18px 20px 12px}h2{font-size:19px;margin:0}p{color:#a9b1c6;margin:6px 0 12px;font-size:12px}.row{display:flex;align-items:center;justify-content:space-between;gap:10px}.tabs{display:flex;padding:0 16px 12px;gap:8px}.tabs button{flex:1}.active{background:#5656a0;border-color:#aaaaff}main{padding:0 20px 20px}.cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0}.cards button{text-align:left}h3{font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#b4bde0;margin:22px 0 12px}label.control{display:block;margin:14px 0}input[type=number]{width:76px;background:#0e1320;color:#e4e8ff;border:1px solid #3b4154;border-radius:5px;padding:4px;text-align:right}input[type=range]{width:100%;accent-color:#a5a0ff;margin:8px 0 0}small{color:#a9b1c6;font-size:11px}.footer{display:flex;gap:8px;margin-top:20px}.footer button{flex:1}.launch{box-shadow:0 4px 20px #0008}select{width:100%;background:#252b3c;color:#fff;border:1px solid #41485f;border-radius:8px;padding:10px}output{color:#c2baff}
    </style><button class="launch" hidden>Effects studio · F4</button><section class="panel" aria-label="Effects studio"><header><div class="row"><h2>Effects studio</h2><button class="close" aria-label="Hide effects studio">×</button></div><p>Live controls · changes saved on this device</p></header><nav class="tabs"><button data-tab="crt">CRT screen</button><button data-tab="effects">One-shot effects</button></nav><main></main></section>`;
  const main = root.querySelector('main')!;
  const panel = root.querySelector<HTMLElement>('.panel')!;
  const launch = root.querySelector<HTMLButtonElement>('.launch')!;
  const toggle = () => {
    panel.hidden = !panel.hidden;
    launch.hidden = !panel.hidden;
  };
  launch.onclick = toggle;
  root.querySelector<HTMLButtonElement>('.close')!.onclick = toggle;
  for (const event of ['keydown', 'keyup', 'pointerdown'])
    host.addEventListener(event, (e) => e.stopPropagation());
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'F4') {
        e.preventDefault();
        toggle();
      }
    },
    { capture: true },
  );
  let tab = 'crt';
  let selected: keyof typeof screenEffects = 'hit';
  let stop: (() => void) | undefined;
  const clear = () => {
    stop?.();
    for (const scene of game.scene.getScenes(true)) scene.tweens.killTweensOf(screenFx);
    Object.assign(screenFx, { split: 0, warp: 0, flash: 0, mono: 0 });
  };
  const button = (parent: Element, text: string, click: () => void) => {
    const el = document.createElement('button');
    el.textContent = text;
    el.onclick = click;
    parent.append(el);
    return el;
  };
  const control = (tree: object, key: string, title: string, min: number, max: number, step: number) => {
    const values = tree as Record<string, number>;
    const label = document.createElement('label');
    label.className = 'control';
    label.innerHTML = '<span class="row"><span></span><input type="number"></span><input type="range">';
    label.querySelector('span span')!.textContent = title;
    const inputs = [...label.querySelectorAll('input')];
    for (const input of inputs) {
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.value = String(values[key]);
      input.setAttribute('aria-label', title);
      input.oninput = () => {
        if (!Number.isFinite(input.valueAsNumber)) return;
        values[key] = Math.min(max, Math.max(min, input.valueAsNumber));
        for (const peer of inputs) if (peer !== input) peer.value = String(values[key]);
        save();
      };
    }
    main.append(label);
  };
  const render = () => {
    main.replaceChildren();
    root
      .querySelectorAll<HTMLButtonElement>('[data-tab]')
      .forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    if (tab === 'crt') {
      const enabled = document.createElement('label');
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = settings.value.crt;
      check.onchange = () => settings.set('crt', check.checked);
      enabled.append(check, ' CRT enabled');
      main.append(enabled);
      const hint = document.createElement('p');
      hint.textContent = 'Game pixels → crisp enlargement → CRT at display resolution';
      main.append(hint);
      const cards = document.createElement('div');
      cards.className = 'cards';
      main.append(cards);
      const presets = {
        'Balanced arcade': defaults,
        'Clean glass': {
          ...defaults,
          glow: 0.3,
          scanlineAlpha: 0.06,
          phosphorMask: 0.025,
          colorFringe: 0,
          roll: 0,
          gamma: 0.95,
        },
        'Warm tube': {
          ...defaults,
          glow: 1.7,
          scanlineAlpha: 0.24,
          phosphorMask: 0.1,
          colorFringe: 0.22,
          gamma: 0.8,
        },
        'Worn arcade': {
          ...defaults,
          glow: 1.4,
          scanlineAlpha: 0.32,
          phosphorMask: 0.18,
          colorFringe: 0.4,
          roll: 0.2,
          vignette: 0.7,
        },
      };
      for (const [name, preset] of Object.entries(presets))
        button(cards, name, () => {
          Object.assign(tuning.crt, preset);
          settings.set('crt', true);
          save();
          render();
        });
      control(tuning.crt, 'glow', 'Phosphor glow', 0, 3, 0.01);
      control(tuning.crt, 'gamma', 'Gamma / midtones', 0.4, 1.6, 0.01);
      control(tuning.crt, 'colorFringe', 'Colour fringe', 0, 1, 0.01);
      control(tuning.crt, 'texturePitch', 'Texture pitch · display pixels', 1, 10, 0.1);
      control(tuning.crt, 'scanlineAlpha', 'Scanline darkness', 0, 0.8, 0.01);
      control(tuning.crt, 'scanlineThickness', 'Scanline thickness', 0.05, 0.9, 0.01);
      control(tuning.crt, 'phosphorMask', 'RGB phosphor mask', 0, 0.5, 0.005);
      control(tuning.crt, 'vignette', 'Edge darkening', 0, 1, 0.01);
      control(tuning.crt, 'cornerRadius', 'Glass corners', 0, 0.25, 0.005);
      control(tuning.crt, 'roll', 'Rolling light', 0, 0.5, 0.005);
    } else {
      const hint = document.createElement('p');
      hint.textContent = 'Preview over any game screen. Adjust a recipe, then replay it.';
      main.append(hint);
      const cards = document.createElement('div');
      cards.className = 'cards';
      main.append(cards);
      for (const name of Object.keys(screenEffects) as (keyof typeof screenEffects)[])
        button(cards, name.replace(/([A-Z])/g, ' $1'), () => {
          selected = name;
          clear();
          const scene = game.scene.getScenes(true).find((s) => s.sys.isActive());
          if (scene) stop = playScreenEffect(scene, selected);
          render();
        }).classList.toggle('active', selected === name);
      const title = document.createElement('h3');
      title.textContent = selected + ' recipe';
      main.append(title);
      const recipe = screenEffects[selected];
      control(recipe, 'split', 'Colour split · game pixels', 0, 10, 0.05);
      control(recipe, 'warp', 'Row distortion · game pixels', 0, 10, 0.05);
      control(recipe, 'flash', 'White flash', 0, 1, 0.01);
      control(recipe, 'mono', 'Desaturation', 0, 1, 0.01);
      control(recipe, 'durationMs', 'Fade duration · ms', 10, 2500, 10);
      button(main, '▶ Replay effect', () => {
        clear();
        const scene = game.scene.getScenes(true)[0];
        if (scene) stop = playScreenEffect(scene, selected);
      });
      button(main, 'Stop effects', clear);
    }
    const footer = document.createElement('div');
    footer.className = 'footer';
    main.append(footer);
    button(footer, 'Reset ' + (tab === 'crt' ? 'CRT' : 'recipe'), () => {
      if (tab === 'crt') Object.assign(tuning.crt, defaults);
      else {
        clear();
        Object.assign(screenEffects[selected], effectDefaults[selected]);
      }
      save();
      render();
    });
    const copy = button(footer, 'Copy settings', () => {
      void navigator.clipboard
        .writeText(JSON.stringify({ crt: tuning.crt, effects: screenEffects }, null, 2))
        .then(() => {
          copy.textContent = 'Copied!';
        })
        .catch(() => {
          copy.textContent = 'Copy unavailable';
        });
    });
  };
  root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(
    (b) =>
      (b.onclick = () => {
        tab = b.dataset.tab!;
        render();
      }),
  );
  settings.onChange(() => {
    if (tab === 'crt') render();
  });
  render();
}
