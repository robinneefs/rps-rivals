import { opponentOf, seededRng, type MatchState, type Move, type Rng, type Side } from '@rps/core';
import type Phaser from 'phaser';
import { HIT_SFX, type SfxPlayer } from '../audio/sounds';
import { STAGE } from '../config/layout';
import { moveColors, palette } from '../config/palette';
import { tuning } from '../config/tuning';
import { screenPulse } from '../fx/crt';
import { flash } from '../fx/flash';
import { koImpact } from '../fx/koImpact';
import { burst } from '../fx/particles';
import { shake } from '../fx/shake';
import type { MatchSession, SessionEvents } from '../session/MatchSession';
import type { BannerView } from '../views/BannerView';
import type { ClashView } from '../views/ClashView';
import type { FighterView } from '../views/FighterView';
import type { HudView } from '../views/HudView';
import type { TagView } from '../views/TagView';
import { chooseChoreography } from './choreography';

export interface FightViews {
  fighters: Record<Side, FighterView>;
  clash: ClashView;
  hud: HudView;
  banner: BannerView;
  tags: TagView;
}

/**
 * Turns session events into choreography over time, using tuning values. It never decides a
 * result: it plays back what the session reports, inside the referee's phase windows.
 */
export class FightDirector {
  private readonly offs: (() => void)[] = [];
  private koSide: Side | null = null;
  private firstPickOfRound = false;
  /** Picks so far this match, so the arrows to the buttons show only for the first few. */
  private turns = 0;
  /** "ROUND 1" waits for the VS card; a phase change cancels it. */
  private introStep: Phaser.Time.TimerEvent | null = null;
  /** Separate cosmetic randomness, shared by both online clients and independent of damage/SFX. */
  private readonly choreographyRng: Rng;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly session: MatchSession,
    private readonly views: FightViews,
    private readonly sfx: SfxPlayer,
    private readonly roundsToWin: number,
    /** Short names over the fighters and on the VS card ("YOU", "RIVAL"). */
    private readonly labels: Record<Side, string>,
    private readonly hooks: {
      versusIntro?: boolean;
      clearPick: () => void;
      matchOver: (winner: Side, state: MatchState) => void;
      /** Rattles the whole cabinet against the room. */
      shakeCabinet: (px: number, ms: number) => void;
      /** Buzzes the phone along with a shake of this many px, or with the K.O. rumble. */
      vibrate: (shakePx: number | 'ko') => void;
    },
  ) {
    this.choreographyRng = seededRng(session.stageSeed() ^ 0x7461696b);
    this.offs.push(
      session.on('phase', this.onPhase),
      session.on('locked', ({ side }) => {
        views.hud.setReady(side, true);
        // your own chip shows your move (see myPick); the rival's turns from a dim "?" to a bright one
        if (side !== session.me) views.tags.setChip(side, 'unknown');
      }),
      session.on('reveal', this.onReveal),
      session.on('matchOver', ({ winner, state }) =>
        scene.time.delayedCall(tuning.result.delayAfterMatchMs, () => hooks.matchOver(winner, state)),
      ),
    );
    scene.events.once('shutdown', () => this.offs.forEach((off) => off()));
  }

  /** You picked (or changed your pick): your move shows over your head and the prompt goes. */
  myPick(move: Move): void {
    this.views.tags.setChip(this.session.me, move);
    this.views.hud.showPrompt(false);
  }

  private onPhase = (e: SessionEvents['phase']): void => {
    const { fighters, clash, hud, banner, tags } = this.views;
    const state = this.session.snapshot().state;
    const tagged = e.round <= tuning.identity.tagRounds;
    this.introStep?.remove();
    this.introStep = null;
    switch (e.phase) {
      case 'roundIntro': {
        this.koSide = null;
        this.firstPickOfRound = true;
        this.hooks.clearPick();
        for (const side of ['p1', 'p2'] as const) {
          fighters[side].toIdle();
          hud.setReady(side, false);
        }
        clash.hide();
        hud.resetHealth(state.health);
        hud.setRounds(state.roundsWon, this.roundsToWin);
        hud.showPrompt(false);
        tags.hideChips();
        const title = e.finalRound ? 'FINAL ROUND' : `ROUND ${e.round}`;
        const showTitle = () => {
          this.sfx.play('roundStart');
          banner.show(title, { color: palette.gold, holdMs: Infinity });
        };
        if (e.round === 1) {
          // who is who before anything happens: the VS card, then the round
          tags.showTags(tagged);
          if (!this.hooks.versusIntro) banner.showVs(this.labels);
          this.introStep = this.scene.time.delayedCall(
            this.hooks.versusIntro ? tuning.versus.openMs : tuning.identity.vsCardMs,
            showTitle,
          );
        } else {
          if (e.round === tuning.identity.tagRounds + 1) tags.blinkOut();
          else tags.showTags(tagged);
          showTitle();
        }
        break;
      }
      case 'picking': {
        this.hooks.clearPick();
        for (const side of ['p1', 'p2'] as const) {
          fighters[side].toIdle();
          hud.setReady(side, false);
        }
        clash.hide();
        this.turns++;
        hud.showPrompt(true, this.turns <= tuning.prompt.arrowTurns);
        tags.showTags(tagged);
        tags.setChip('p1', 'waiting');
        tags.setChip('p2', 'waiting');
        if (this.firstPickOfRound) {
          this.sfx.play('fight');
          banner.show('FIGHT!', { color: palette.pink, holdMs: 350 });
        } else banner.hide();
        this.firstPickOfRound = false;
        break;
      }
      case 'reveal':
        // the badges carry the names from here
        tags.showTags(false);
        tags.hideChips();
        hud.showPrompt(false);
        hud.setReady('p1', false);
        hud.setReady('p2', false);
        break;
      case 'roundOver': {
        this.hooks.clearPick();
        const loser = this.koSide;
        if (loser) {
          const winner = opponentOf(loser);
          fighters[loser].pose('ko');
          fighters[loser].setOffset(tuning.reveal.guardStepPx - tuning.reveal.recoilPx);
          fighters[winner].pose('win');
          fighters[winner].setOffset(0);
          clash.hide();
          shake(this.scene, this.scene.cameras.main, tuning.shake.koPx, tuning.shake.durationMs * 1.5);
          this.hooks.shakeCabinet(tuning.cabinet.koPx, tuning.cabinet.koMs);
          this.hooks.vibrate('ko');
          this.sfx.play('ko');
          banner.showKo();
        }
        hud.setRounds(state.roundsWon, this.roundsToWin);
        break;
      }
      case 'matchOver':
        banner.hide();
        break;
      case 'idle':
        break;
    }
  };

  private onReveal = (e: SessionEvents['reveal']): void => {
    const { fighters, clash, hud } = this.views;
    const r = tuning.reveal;
    const at = (ms: number, fn: () => void) => this.scene.time.delayedCall(ms, fn);
    // the badges pop in (with the slam when the timer ran out on someone), then whoosh to the middle
    clash.present(e.picks, e.autoPicked);
    if (e.autoPicked.p1 || e.autoPicked.p2) {
      this.sfx.play('timeUp');
      hud.slamTimer();
      this.hooks.shakeCabinet(tuning.cabinet.timeUpPx, tuning.cabinet.timeUpMs);
      this.hooks.vibrate(tuning.cabinet.timeUpPx);
    }
    at(r.flyAtMs, () => {
      clash.fly(r.impactAtMs - r.flyAtMs);
      this.sfx.play('whoosh');
    });

    const outcome = e.outcome;
    const action = chooseChoreography(outcome, this.choreographyRng);
    at(r.strikeAtMs, () => {
      fighters[action.attacker].attack(action.attack);
      fighters[action.attacker].setOffset(r.lungePx);
      fighters[action.defender].setOffset(r.guardStepPx);
      if (action.reaction === 'block') fighters[action.defender].block();
      this.dust(action.attacker);
    });

    at(r.impactAtMs, () => {
      clash.collide(outcome);
      if (outcome.kind === 'tie') {
        fighters[action.defender].block();
        fighters[action.defender].setOffset(r.guardStepPx - r.recoilPx);
        shake(this.scene, this.scene.cameras.main, 1, tuning.shake.durationMs / 2);
        this.hooks.vibrate(1);
        this.sfx.play('clash');
        return;
      }
      const loser = fighters[outcome.loser];
      loser.pose('hurt');
      loser.setOffset(r.guardStepPx - r.recoilPx);
      flash(this.scene, loser.sprite, tuning.flash.frames, tuning.flash.frameMs);
      this.sfx.play(HIT_SFX[e.picks[outcome.winner]], { detune: (Math.random() - 0.5) * 80 });
      this.sparks(outcome.loser, e.picks[outcome.winner], outcome.damage);
      const ko = e.events.some((ev) => ev.type === 'ko');
      if (ko) {
        koImpact(this.scene, tuning.ko);
        screenPulse(this.scene, 'split', tuning.crt.koSplitPx, tuning.crt.koSplitMs);
      } else if (outcome.damage >= tuning.cabinet.bigHitDamage) {
        this.hooks.shakeCabinet(tuning.cabinet.bigHitPx, tuning.cabinet.bigHitMs);
        screenPulse(this.scene, 'warp', tuning.crt.bigHitWarpPx, tuning.crt.bigHitWarpMs);
      }
      const pause = tuning.hitPause.byDamage[outcome.damage] ?? 60;
      at(pause, () => {
        const shakePx = tuning.shake.byDamage[outcome.damage] ?? 2;
        shake(this.scene, this.scene.cameras.main, shakePx, tuning.shake.durationMs);
        this.hooks.vibrate(shakePx);
        hud.setHealth(outcome.loser, e.state.health[outcome.loser]);
        const hit = e.events.find((ev) => ev.type === 'damage' && ev.side === outcome.loser);
        const amount = hit?.type === 'damage' ? hit.amount : outcome.damage;
        clash.showDamage(outcome.loser, amount);
        hud.flashBar(outcome.loser);
      });
      if (ko) this.koSide = outcome.loser;
    });

    // after a K.O. the slow motion pushes this past the round's end, where the K.O. and win poses rule
    at(r.recoverAtMs, () => {
      if (this.koSide) return;
      for (const side of ['p1', 'p2'] as const) fighters[side].toIdle();
    });
    at(r.clearAtMs, () => clash.hide());
  };

  /** Sparks fly off the hurt fighter, away from the hit, in the winning move's colours. */
  private sparks(loser: Side, move: Move, damage: number): void {
    const s = tuning.sparks;
    const away = loser === 'p2' ? 1 : -1;
    const c = moveColors[move];
    burst(this.scene, STAGE.fighterX[loser] - away * 8, STAGE.floorY - 55, {
      count: s.countByDamage[damage] ?? 10,
      colors: [palette.white, c.main, c.main, c.shade],
      angleDeg: away === 1 ? -35 : -145,
      spreadDeg: s.spreadDeg,
      speed: [s.speedMin, s.speedMax],
      gravity: s.gravity,
      lifeMs: s.lifeMs,
      sizePx: s.sizePx,
    });
  }

  /** A little dust kicks up behind a fighter's back foot as they lunge. */
  private dust(side: Side): void {
    const d = tuning.dust;
    const back = side === 'p1' ? -1 : 1;
    burst(this.scene, STAGE.fighterX[side] + back * 10, STAGE.floorY - 2, {
      count: d.count,
      colors: [0xd8c8e8, 0xb8a8d0],
      angleDeg: back === -1 ? -160 : -20,
      spreadDeg: 40,
      speed: [d.speedMin, d.speedMax],
      gravity: d.gravity,
      lifeMs: d.lifeMs,
      sizePx: d.sizePx,
    });
  }
}
