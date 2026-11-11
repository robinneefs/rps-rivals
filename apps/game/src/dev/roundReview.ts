import type Phaser from 'phaser';
import {
  Emitter,
  applyExchange,
  createMatchState,
  defaultRules,
  rulesForFighters,
  type Phase,
  type Picks,
  type Move,
} from '@rps/core';
import type { MatchSession, SessionEvents } from '../session/MatchSession';
import { SceneKey, MONITOR_SCENES } from '../scenes/keys';
import { getContext } from '../scenes/context';
import { tuning } from '../config/tuning';
import { screenFx } from '../fx/crt';

const steps = [
  ['Round introduction', 'Round title, full health, score markers and player identity.', 'intro', 600],
  ['FIGHT!', 'FIGHT clears, followed by a 350ms pause before the picking window starts.', 'fight', 1900],
  ['Choose a move', 'Countdown, pick prompt, button guidance and waiting chips.', 'pick', 800],
  ['Your move locked', 'Your chosen move is visible; the opponent’s move stays hidden.', 'lock', 800],
  ['Opponent ready', 'Both ready indicators are lit; the rival’s pick is still secret.', 'ready', 800],
  [
    'Time runs out / AUTO',
    'A missing pick is assigned automatically. Timer slam and AUTO badge.',
    'auto',
    200,
  ],
  ['Moves revealed', 'Both move badges appear beside their fighters, labelled by owner.', 'reveal', 240],
  ['Badges fly / wind-up', 'Move badges travel inward while the fighters prepare their attacks.', 'fly', 510],
  ['Collision / hit', 'Badges collide and the winning fighter connects.', 'impact', 670],
  ['Damage and verdict', 'Winning rule, who hit, damage number and draining health bar.', 'damage', 1000],
  ['Clash / no damage', 'Matching moves bounce apart. Neither health bar loses HP.', 'tie', 1000],
  ['Recovery', 'Fighters return to idle before the next picking window.', 'recover', 1460],
  ['Next exchange', 'The prompt and countdown return, with the previous damage retained.', 'again', 800],
  [
    'Finishing hit',
    'A lethal exchange plays the current flash, freeze and slow-motion effect.',
    'lethal',
    1050,
  ],
  ['K.O. / round won', 'K.O. lettering, winner/loser poses and updated round markers.', 'ko', 650],
  ['Next round', 'Health resets and ROUND 2 appears. The exchange loop starts again.', 'next', 450],
  ['Final round', 'At one round each, the deciding round is labelled FINAL ROUND.', 'final', 450],
  ['Match victory', 'Winning two rounds exits the loop to the existing victory screen.', 'win', 2100],
  ['Match defeat', 'The opposite result uses the existing defeat screen.', 'loss', 2100],
] as const;

/** Development-only review harness. Replays the real FightScene and FightDirector with fixtures. */
export function mountRoundReview(game: Phaser.Game): void {
  let index = Math.max(
    0,
    Math.min(steps.length - 1, Number(new URLSearchParams(location.search).get('beat')) || 0),
  );
  let generation = 0;
  let timers: ReturnType<typeof setTimeout>[] = [];
  let session: MatchSession | undefined;
  let reviewMove: Move = 'rock';
  const host = document.createElement('div');
  document.body.append(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
  :host{position:fixed;right:20px;top:20px;z-index:40;color:#eeeef6;font:14px/1.5 system-ui}*{box-sizing:border-box}section{width:350px;max-width:calc(100vw - 32px);max-height:calc(100dvh - 40px);overflow:auto;background:#151a26f5;border:1px solid #505970;border-radius:16px;padding:22px;box-shadow:0 18px 60px #0009}h1{font-size:23px;margin:0}p{color:#b9c1d6}small{color:#e4bc72;text-transform:uppercase;letter-spacing:1px}button{font:inherit;cursor:pointer;color:inherit;background:#292f43;border:1px solid #4c5670;border-radius:8px;padding:9px 11px}button:hover{background:#414b69}button:focus-visible{outline:2px solid #f5cc78}nav{display:flex;gap:7px;margin:16px 0}nav button{flex:1}ol{padding:0;list-style:none;margin:16px 0 0}li button{display:block;width:100%;text-align:left;margin:5px 0}li button[aria-current=true]{border-color:#f4c772;background:#443b2d}h2{font-size:18px;margin:15px 0 0}.status{font-size:12px;color:#9ed8ba}a{color:#c4caff}@media(max-width:850px){:host{top:auto;bottom:10px;right:10px}section{max-height:36dvh;width:310px}}
  </style><section aria-label="Round loop review"><small>Current game · UI review</small><h1>Round loop</h1><p>Choose a numbered beat. Each preview plays into a held frame. Use Replay to inspect its motion.</p><h2></h2><p class="description"></p><div class="status" role="status"></div><nav><button class="prev">← Previous</button><button class="replay">Replay</button><button class="next">Next →</button></nav><ol></ol><p>Normal path: 1–5 → 7–10 → 12–13 → repeat. A clash returns to picking; a K.O. advances the round or ends the match.</p><a href="?">Exit review</a></section>`;
  for (const event of ['keydown', 'keyup', 'pointerdown'])
    host.addEventListener(event, (e) => e.stopPropagation());
  const hands = document.createElement('nav');
  hands.setAttribute('aria-label', 'Hand icon previews');
  for (const move of ['rock', 'paper', 'scissors'] as const) {
    const button = document.createElement('button');
    button.textContent = `Try ${move}`;
    button.onclick = () => {
      reviewMove = move;
      open(3);
    };
    hands.append(button);
  }
  root.querySelector('nav')!.after(hands);
  const list = root.querySelector('ol')!;
  steps.forEach(([name], i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.textContent = `${String(i + 1).padStart(2, '0')} · ${name}`;
    b.onclick = () => open(i);
    li.append(b);
    list.append(li);
  });
  const later = (ms: number, fn: () => void) => {
    timers.push(setTimeout(fn, ms));
  };
  function open(i: number) {
    index = (i + steps.length) % steps.length;
    const token = ++generation;
    timers.forEach(clearTimeout);
    timers = [];
    session?.dispose();
    const [name, description, kind, hold] = steps[index]!;
    const url = new URL(location.href);
    url.searchParams.set('beat', String(index));
    history.replaceState(null, '', url);
    root.querySelector('h2')!.textContent = `${index + 1}. ${name}`;
    root.querySelector('.description')!.textContent = description;
    root.querySelector('.status')!.textContent = 'Playing into the review frame…';
    list.querySelectorAll('button').forEach((b, n) => b.setAttribute('aria-current', String(n === index)));
    for (const key of MONITOR_SCENES) {
      game.scene.resume(key);
      game.scene.stop(key);
    }
    Object.assign(screenFx, { split: 0, warp: 0, flash: 0, mono: 0 });
    const events = new Emitter<SessionEvents>();
    const fighters = { p1: 'taiko', p2: 'riot' } as const;
    const rules = rulesForFighters(structuredClone(defaultRules), fighters);
    let state = createMatchState(rules);
    let phase: Phase = 'idle';
    let myPick: Move | null = null;
    const fixture: MatchSession = {
      fighters,
      me: 'p1',
      opponentName: 'CPU',
      rules,
      ready() {},
      submitPick(move) {
        if (phase !== 'picking') return;
        myPick = move;
        events.emit('locked', { side: 'p1' });
      },
      requestRematch() {},
      setPaused() {},
      stageSeed: () => 0,
      snapshot: () => ({ phase, state, msLeft: phase === 'picking' ? 2000 : 0, myPick }),
      on: (event, fn) => events.on(event, fn),
      dispose: () => events.clear(),
    };
    session = fixture;
    const setup = { mode: 'cpu', cpu: 'random', fighters } as const;
    game.scene.start(SceneKey.fight, { setup, session: fixture });
    // Scene starts are queued by Phaser; wait for create() and all director subscriptions.
    const begin = () => {
      if (token !== generation) return;
      if (!game.scene.isActive(SceneKey.fight)) {
        later(20, begin);
        return;
      }
      const scene = game.scene.getScene(SceneKey.fight);
      const context = getContext(scene);
      context.lights.select(null);
      const enter = (p: Phase) => {
        phase = p;
        events.emit('phase', {
          phase: p,
          round: state.round,
          finalRound: state.roundsWon.p1 === 1 && state.roundsWon.p2 === 1,
          endsAt: null,
        });
      };
      if (kind === 'next') {
        state.round = 2;
        state.roundsWon.p1 = 1;
      }
      if (kind === 'final') {
        state.round = 3;
        state.roundsWon = { p1: 1, p2: 1 };
      }
      if (['ko', 'lethal'].includes(kind)) state.health.p2 = 10;
      enter('roundIntro');
      if (['win', 'loss'].includes(kind)) {
        const winner = kind === 'win' ? 'p1' : 'p2';
        state.roundsWon[winner] = 2;
        state.winner = winner;
        context.flow.toResult({ setup, session: fixture, state, winner });
        game.scene.resume(SceneKey.fight);
      } else if (!['intro', 'fight', 'next', 'final'].includes(kind)) {
        enter('picking');
        if (['lock', 'ready'].includes(kind)) {
          // Use the same input route as real picks: a mutable fixture supplies the selected move.
          fixture.snapshot = () => ({ phase, state, msLeft: 2000, myPick: reviewMove });
          events.emit('locked', { side: 'p1' });
          context.lights.select(reviewMove);
          context.input.pressButton(reviewMove);
          context.input.releaseButton(reviewMove);
        }
        if (kind === 'ready') events.emit('locked', { side: 'p2' });
        if (!['fight', 'pick', 'lock', 'ready'].includes(kind)) {
          // Finish the opening FIGHT banner before replaying an exchange.
          scene.time.delayedCall(650, () => {
            const picks: Picks = { p1: 'rock', p2: kind === 'tie' ? 'rock' : 'scissors' };
            const result = applyExchange(state, picks, rules);
            state = result.state;
            enter('reveal');
            events.emit('reveal', { ...result, picks, autoPicked: { p1: kind === 'auto', p2: false } });
            if (kind === 'ko') scene.time.delayedCall(1850, () => enter('roundOver'));
            if (kind === 'again')
              scene.time.delayedCall(tuning.reveal.clearAtMs + 100, () => enter('picking'));
          });
        }
      }
      const duration =
        kind === 'ko' ? 1850 + hold : kind === 'again' ? tuning.reveal.clearAtMs + 100 + hold : hold;
      const revealLead = ['fight', 'pick', 'lock', 'ready', 'intro', 'next', 'final', 'win', 'loss'].includes(
        kind,
      )
        ? 0
        : 650;
      later(duration + revealLead, () => {
        if (token !== generation) return;
        // Hold the visible half of the intro flicker so the marker remains reviewable.
        if (['intro', 'next', 'final'].includes(kind))
          for (const name of ['intro-you-label', 'intro-you-arrow'])
            (scene.children.getByName(name) as Phaser.GameObjects.Container | null)?.setVisible(true);
        // Centre the review frame rather than freezing a camera-shake offset.
        scene.cameras.main.setScroll(0, 0);
        game.scene.pause(SceneKey.fight);
        if (game.scene.isActive(SceneKey.result)) game.scene.pause(SceneKey.result);
        root.querySelector('.status')!.textContent = 'Held for review · Replay to watch again';
      });
    };
    later(60, begin);
  }
  root.querySelector<HTMLButtonElement>('.prev')!.onclick = () => open(index - 1);
  root.querySelector<HTMLButtonElement>('.next')!.onclick = () => open(index + 1);
  root.querySelector<HTMLButtonElement>('.replay')!.onclick = () => open(index);
  const waitForBoot = () => {
    if (game.scene.isActive(SceneKey.home)) {
      root.querySelector('.status')!.textContent = 'Preparing hand icon previews…';
      open(index);
    } else later(100, waitForBoot);
  };
  waitForBoot();
}

/** Same native-size reduction used in the study, loaded only by this development preview. */
