import Phaser from 'phaser';
import { tuning } from '../config/tuning';

/**
 * CRT look for the monitor: a WebGL post-effect on each monitor camera. Bright colours bleed a
 * soft glow into their neighbours (phosphor bloom), the edges darken (vignette), the corners round
 * off like curved glass, alternating scanlines and an RGB mask texture the image, and a faint
 * bright band rolls slowly down the screen. It works on whole
 * display pixels after the native framebuffer is enlarged (with a native fallback).
 */
export const CRT_FRAGMENT = `
#define SHADER_NAME RPS_CRT_FS
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uMainSampler;
uniform vec2 uResolution;
uniform vec4 uViewport;
uniform float uTime;
uniform float uRollPhase;
uniform float uGlow;
uniform float uVignette;
uniform float uCorner;
uniform float uRoll;
uniform float uScanline;
uniform float uMask;
uniform float uGamma;
uniform float uFringe;
uniform float uCrt;
uniform float uSplit;
uniform float uWarp;
// canvas pixels per monitor pixel (the cameras zoom in by this much)
uniform float uPixel;
uniform float uPitch;
uniform float uThickness;
uniform float uFlash;
uniform float uMono;

varying vec2 outTexCoord;

void main() {
  vec2 local = (gl_FragCoord.xy - uViewport.xy) / uViewport.zw;
  if (local.x < 0.0 || local.y < 0.0 || local.x > 1.0 || local.y > 1.0) {
    gl_FragColor = texture2D(uMainSampler, outTexCoord);
    return;
  }
  vec2 px = uPixel / uResolution;

  // impact warp: rows wobble sideways in whole pixels, a rippling band of them
  vec2 uv = outTexCoord;
  if (uWarp > 0.0) {
    float row = floor(local.y * uViewport.w / uPixel);
    uv.x += (uWarp * sin(row * 0.35 + uTime * 60.0)) * px.x;
  }
  vec4 base = texture2D(uMainSampler, uv);

  // colour split: red and blue pulled apart sideways (the K.O. hit)
  if (uSplit > 0.0) {
    float s = uSplit * px.x;
    base.r = texture2D(uMainSampler, uv + vec2(s, 0.0)).r;
    base.b = texture2D(uMainSampler, uv - vec2(s, 0.0)).b;
  }
  base.rgb = mix(base.rgb, vec3(dot(base.rgb, vec3(0.299, 0.587, 0.114))), uMono);
  base.rgb = mix(base.rgb, vec3(1.0), uFlash);
  if (uCrt < 0.5) {
    gl_FragColor = base;
    return;
  }

  // Mix a little neighbouring red/blue at one whole native pixel, retaining the sharp base.
  // The stronger combat split remains independent and keeps its existing behaviour.
  base.r = mix(base.r, texture2D(uMainSampler, uv + vec2(px.x, 0.0)).r, uFringe);
  base.b = mix(base.b, texture2D(uMainSampler, uv - vec2(px.x, 0.0)).b, uFringe);

  // phosphor glow: the average of 9 taps spread over a 5x5 neighbourhood, only its bright part,
  // added on top (9 reads, not 25, so it stays cheap on slow GPUs)
  vec3 sum = vec3(0.0);
  for (int i = -1; i <= 1; i++)
    for (int j = -1; j <= 1; j++)
      sum += texture2D(uMainSampler, uv + vec2(float(i), float(j)) * 2.0 * px).rgb;
  sum /= 9.0;
  // Broader phosphor bloom, bounded by remaining channel headroom. Protect highlights
  // further so pale skin and face patches retain their differences at stronger glow settings.
  float highlight = max(base.r, max(base.g, base.b));
  float detailGuard = 1.0 - 0.55 * smoothstep(0.65, 0.95, highlight);
  vec3 col = base.rgb + max(sum - 0.45, 0.0) * uGlow * (1.0 - base.rgb) * detailGuard;

  // Display-resolution tube texture, independent of the artwork pixel grid.
  vec2 cell = local * uViewport.zw / max(uPitch, 1.0);
  col *= 1.0 - uScanline * smoothstep(1.0 - uThickness - 0.08, 1.0 - uThickness + 0.08, fract(cell.y));
  float stripe = mod(floor(cell.x), 3.0);
  vec3 mask = stripe < 1.0 ? vec3(1.0, 1.0-uMask, 1.0-uMask)
    : stripe < 2.0 ? vec3(1.0-uMask, 1.0, 1.0-uMask)
    : vec3(1.0-uMask, 1.0-uMask, 1.0);
  col *= mask;

  // Lift midtones to compensate for scanline/mask losses without additive white clipping.
  // Black and white remain fixed endpoints, preserving detail in pale artwork.
  col = pow(clamp(col, 0.0, 1.0), vec3(uGamma));

  // vignette: darker towards the edges
  vec2 c = local - 0.5;
  col *= 1.0 - uVignette * dot(c, c) * 2.0;

  // rounded corners, like the curved glass of a tube
  vec2 d = max(abs(c) - (0.5 - uCorner), 0.0);

  // A broad, soft light band rolling down the screen, bounded by remaining highlight headroom.
  float band = 1.0 - abs(fract(local.y + uRollPhase) - 0.5) * 2.0;
  col += (1.0 - col) * uRoll * smoothstep(0.74, 1.0, band);
  // Apply the glass mask last so the rolling light cannot illuminate the cut-off corners.
  col *= 1.0 - smoothstep(0.8, 1.0, length(d) / max(uCorner, 0.0001));

  gl_FragColor = vec4(col, base.a);
}
`;

export const CRT_PIPELINE = 'RpsCrt';

/**
 * What the monitor shader shows right now, shared by every monitor camera: the CRT look (the
 * player's setting) and the impact effects, which pulse up and fade (see screenPulse).
 */
export const screenFx = { crt: true, split: 0, warp: 0, flash: 0, mono: 0, presentation: false };

export class CrtPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({ game, name: CRT_PIPELINE, fragShader: CRT_FRAGMENT });
  }

  override onDraw(target: Phaser.Renderer.WebGL.RenderTarget): void {
    const cam = this.gameObject as unknown as Phaser.Cameras.Scene2D.Camera | null;
    const w = this.renderer.width;
    const h = this.renderer.height;
    const c = tuning.crt;
    this.set2f('uResolution', w, h);
    if (cam) this.set4f('uViewport', cam.x, h - cam.y - cam.height, cam.width, cam.height);
    // Wrap each periodic animation before uploading, preserving precision after long sessions.
    const seconds = this.game.loop.time / 1000;
    this.set1f('uTime', seconds % ((Math.PI * 2) / 60));
    this.set1f('uRollPhase', (seconds * 0.12) % 1);
    this.set1f('uGlow', c.glow);
    this.set1f('uVignette', c.vignette);
    this.set1f('uCorner', c.cornerRadius);
    this.set1f('uRoll', c.roll);
    this.set1f('uScanline', c.scanlineAlpha);
    this.set1f('uMask', c.phosphorMask);
    this.set1f('uGamma', c.gamma);
    this.set1f('uFringe', c.colorFringe);
    this.set1f('uPitch', c.texturePitch);
    this.set1f('uThickness', c.scanlineThickness);
    this.set1f('uFlash', screenFx.presentation ? 0 : screenFx.flash);
    this.set1f('uMono', screenFx.presentation ? 0 : screenFx.mono);
    this.set1f('uCrt', screenFx.crt && !screenFx.presentation ? 1 : 0);
    this.set1f('uSplit', screenFx.presentation ? 0 : screenFx.split);
    this.set1f('uWarp', screenFx.presentation ? 0 : screenFx.warp);
    this.set1f('uPixel', cam?.zoom ?? 1);
    this.bindAndDraw(target);
  }
}

/** Registers the pipeline once; false on the Canvas renderer, where there are no shaders. */
export function registerCrt(game: Phaser.Game): boolean {
  const renderer = game.renderer;
  if (!(renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return false;
  if (!renderer.pipelines.postPipelineClasses.has(CRT_PIPELINE))
    renderer.pipelines.addPostPipeline(CRT_PIPELINE, CrtPipeline);
  return true;
}

/** Puts the monitor shader on a camera (WebGL only). The CRT look itself follows screenFx.crt. */
export function useScreenShader(cam: Phaser.Cameras.Scene2D.Camera): void {
  if (!(cam.scene.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return;
  // a scene keeps its camera when it restarts, so only add the shader once
  const has = cam.getPostPipeline(CRT_PIPELINE);
  if (Array.isArray(has) ? has.length === 0 : !has) cam.setPostPipeline(CRT_PIPELINE);
}

/**
 * An impact effect on the monitor: `split` pulls the colours apart, `warp` makes the rows wobble.
 * Starts at `px` and fades to nothing over `ms` on the scene's tweens (so slow motion slows it).
 */
const activePulses = new Map<string, () => void>();

export function screenPulse(
  scene: Phaser.Scene,
  kind: 'split' | 'warp' | 'flash' | 'mono',
  px: number,
  ms: number,
): () => void {
  activePulses.get(kind)?.();
  screenFx[kind] = px;
  const reset = () => {
    screenFx[kind] = 0;
    activePulses.delete(kind);
    scene.events.off('shutdown', cancel);
  };
  const cancel = () => {
    tween.stop();
    reset();
  };
  const tween = scene.tweens.add({
    targets: screenFx,
    [kind]: 0,
    duration: ms,
    ease: 'Quad.easeIn',
    onStop: reset,
    onComplete: reset,
  });
  activePulses.set(kind, cancel);
  scene.events.once('shutdown', cancel);
  return cancel;
}
