import { opponentOf, characterStats, type Side } from '@rps/core';
import Phaser from 'phaser';
import { STAGE } from '../config/layout';
import { stageFor } from '../config/stages';
import { showDisconnect } from '../views/OnlineNotice';
import { tuning } from '../config/tuning';
import { characterPresentation } from '../config/characters';
import { combatTexture } from '../assets/alternatePalettes';
import { FightDirector } from '../fight/FightDirector';
import { BannerView } from '../views/BannerView';
import { ClashView } from '../views/ClashView';
import { FighterView } from '../views/FighterView';
import { HudView } from '../views/HudView';
import { TagView } from '../views/TagView';
import { addStage } from '../views/StageView';
import { getContext } from './context';
import type { FightData } from './flow';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';
import type { MatchSession, MatchSetup } from '../session/MatchSession';

/** Wiring only: builds the views, connects the session, input and director, then says ready. */
export class FightScene extends Phaser.Scene {
  private fight!: FightData;
  private hud!: HudView;
  /** The last whole second shown on the timer, for the countdown ticks. */
  private lastSecs = 0;

  constructor() {
    super(SceneKey.fight);
  }

  init(data: FightData): void {
    this.fight = data;
  }

  create(): void {
    const { input, flow, lights, audio, cabinetShake, haptics } = getContext(this);
    const { session, setup } = this.fight;
    useMonitorCamera(this);
    // ?stage=<id> in the address forces a stage, for trying one out
    const stage = stageFor(session.stageSeed(), new URLSearchParams(window.location.search).get('stage'));
    audio.playMusic(stage.music ?? 'fight');
    const addForeground = addStage(this, stage, session.stageSeed());

    const fighters = {
      p1: new FighterView(this, 'p1', STAGE.fighterX.p1, STAGE.floorY, combatTexture(session.fighters, 'p1')),
      p2: new FighterView(this, 'p2', STAGE.fighterX.p2, STAGE.floorY, combatTexture(session.fighters, 'p2')),
    };
    // Grass/rain overlap the fighters, while tags, move effects and HUD remain above them.
    addForeground?.();
    const names = labels(session);
    const tags = new TagView(this, names);
    const hud = new HudView(
      this,
      hudNames(session, setup),
      {
        p1: characterStats(session.fighters.p1, session.rules).hp,
        p2: characterStats(session.fighters.p2, session.rules).hp,
      },
      {
        p1: characterPresentation(session.fighters.p1).name,
        p2: characterPresentation(session.fighters.p2).name,
      },
    );
    const clash = new ClashView(this, names, session.me);
    const banner = new BannerView(this, 90);
    /** Online, the rival left or the connection dropped: the match is over without a result. */
    let endedEarly = false;

    const director = new FightDirector(
      this,
      session,
      { fighters, clash, hud, banner, tags },
      audio,
      session.rules.roundsToWin,
      names,
      {
        clearPick: () => lights.select(null),
        // online, the rival can leave in the moment between the K.O. and the result screen
        matchOver: (winner, state) => {
          if (!endedEarly) flow.toResult({ setup, session, winner, state });
        },
        shakeCabinet: (px, ms) => cabinetShake.kick(px, ms),
        vibrate: (px) => (px === 'ko' ? haptics.ko() : haptics.shake(px)),
      },
    );

    // online only: the match ends early if the other player leaves or the connection drops
    // (once the result screen is up, it says so itself)
    const endEarly = (text: string) => {
      if (endedEarly || !this.scene.isActive()) return;
      endedEarly = true;
      lights.select(null);
      showDisconnect(this, text === 'RIVAL LEFT', () => flow.toHome());
    };
    const offs = [
      input.on('action', (a) => {
        if (endedEarly || !this.scene.isActive() || a.type !== 'pick') return;
        const before = session.snapshot().myPick;
        session.submitPick(a.move);
        const picked = session.snapshot().myPick;
        if (picked) {
          lights.select(picked);
          director.myPick(picked);
        }
        if (picked && picked !== before) audio.play('lockIn');
      }),
      session.on('opponentLeft', () => endEarly('RIVAL LEFT')),
      session.on('disconnected', () => endEarly('OFFLINE')),
    ];
    // a hidden tab stops drawing, so a CPU match waits for the player to come back
    const hide = () => session.setPaused(true);
    const show = () => session.setPaused(false);
    this.game.events.on(Phaser.Core.Events.HIDDEN, hide);
    this.game.events.on(Phaser.Core.Events.VISIBLE, show);
    this.events.once('shutdown', () => {
      offs.forEach((off) => off());
      this.game.events.off(Phaser.Core.Events.HIDDEN, hide);
      this.game.events.off(Phaser.Core.Events.VISIBLE, show);
      session.setPaused(false);
      lights.select(null);
    });
    this.hud = hud;
    if (session.endedReason)
      // create() runs before the scene becomes active; report after its first update.
      this.time.delayedCall(0, () =>
        endEarly(session.endedReason === 'opponentLeft' ? 'RIVAL LEFT' : 'OFFLINE'),
      );
    else session.ready();
  }

  override update(): void {
    const view = this.fight.session.snapshot();
    this.hud.setTimer(view.phase === 'picking' ? view.msLeft : null);
    // a tick for each of the last seconds, higher as time runs out (quiet once you've picked)
    const secs = view.phase === 'picking' ? Math.ceil(view.msLeft / 1000) : 0;
    if (secs !== this.lastSecs && secs > 0 && view.msLeft <= tuning.hud.timerWarnMs && !view.myPick)
      getContext(this).audio.play('tick', { detune: (tuning.hud.timerWarnMs / 1000 - secs) * 200 });
    this.lastSecs = secs;
  }
}

/** Short names: "YOU" for this player's side, the opponent's name ("RIVAL") for the other. */
function labels(session: MatchSession): Record<Side, string> {
  return { [session.me]: 'YOU', [opponentOf(session.me)]: session.opponentName } as Record<Side, string>;
}

/**
 * The HUD's name tags. Online, P1 (the host) is always on the left and P2 on the right on both
 * screens, so each tag says which player it is and which one is you.
 */
function hudNames(session: MatchSession, setup: MatchSetup): Record<Side, string> {
  const names = labels(session);
  if (setup.mode !== 'online') return names;
  return { p1: `P1 ${names.p1}`, p2: `P2 ${names.p2}` };
}
