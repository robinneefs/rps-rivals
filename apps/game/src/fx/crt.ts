import Phaser from 'phaser';
import { tuning } from '../config/tuning';

/**
 * CRT look for the monitor: a WebGL post-effect on each monitor camera. Bright colours bleed a
 * soft glow into their neighbours (phosphor bloom), the edges darken (vignette), the corners round
 * off like curved glass, and a faint bright band rolls slowly down the screen. It works on whole
 * monitor pixels, so the pixel art itself is never warped or blurred. Fine scanlines are drawn
 * by an overlay at device resolution (see CrtOverlay).
 */
const FRAG = `
#define SHADER_NAME RPS_CRT_FS
precision mediump float;

uniform sampler2D uMainSampler;
uniform vec2 uResolution;
uniform vec4 uViewport;
uniform float uTime;
uniform float uGlow;
uniform float uVignette;
uniform float uCorner;
uniform float uRoll;
uniform float uCrt;
uniform float uSplit;
uniform float uWarp;
// canvas pixels per monitor pixel (the cameras zoom in by this much)
uniform float uPixel;

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
    uv.x += floor(uWarp * sin(row * 0.35 + uTime * 60.0) + 0.5) * px.x;
  }
  vec4 base = texture2D(uMainSampler, uv);

  // colour split: red and blue pulled apart sideways (the K.O. hit)
  if (uSplit > 0.0) {
    float s = floor(uSplit + 0.5) * px.x;
    base.r = texture2D(uMainSampler, uv + vec2(s, 0.0)).r;
    base.b = texture2D(uMainSampler, uv - vec2(s, 0.0)).b;
  }
  if (uCrt < 0.5) {
    gl_FragColor = base;
    return;
  }

  // phosphor glow: the average of 9 taps spread over a 5x5 neighbourhood, only its bright part,
  // added on top (9 reads, not 25, so it stays cheap on slow GPUs)
  vec3 sum = vec3(0.0);
  for (int i = -1; i <= 1; i++)
    for (int j = -1; j <= 1; j++)
      sum += texture2D(uMainSampler, uv + vec2(float(i), float(j)) * 2.0 * px).rgb;
  sum /= 9.0;
  vec3 col = base.rgb + max(sum - 0.3, 0.0) * uGlow;

  // vignette: darker towards the edges
  vec2 c = local - 0.5;
  col *= 1.0 - uVignette * dot(c, c) * 2.0;

  // rounded corners, like the curved glass of a tube
  vec2 d = max(abs(c) - (0.5 - uCorner), 0.0);
  col *= 1.0 - smoothstep(0.8, 1.0, length(d) / uCorner);

  // a faint brighter band rolling slowly down the screen
  float band = 1.0 - abs(fract(local.y + uTime * 0.12) - 0.5) * 2.0;
  col += uRoll * smoothstep(0.92, 1.0, band);

  gl_FragColor = vec4(col, base.a);
}
`;

export const CRT_PIPELINE = 'RpsCrt';

/**
 * What the monitor shader shows right now, shared by every monitor camera: the CRT look (the
 * player's setting) and the impact effects, which pulse up and fade (see screenPulse).
 */
export const screenFx = { crt: true, split: 0, warp: 0 };

export class CrtPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({ game, name: CRT_PIPELINE, fragShader: FRAG });
  }

  override onDraw(target: Phaser.Renderer.WebGL.RenderTarget): void {
    const cam = this.gameObject as unknown as Phaser.Cameras.Scene2D.Camera | null;
    const w = this.renderer.width;
    const h = this.renderer.height;
    const c = tuning.crt;
    this.set2f('uResolution', w, h);
    if (cam) this.set4f('uViewport', cam.x, h - cam.y - cam.height, cam.width, cam.height);
    this.set1f('uTime', this.game.loop.time / 1000);
    this.set1f('uGlow', c.glow);
    this.set1f('uVignette', c.vignette);
    this.set1f('uCorner', c.cornerRadius);
    this.set1f('uRoll', c.roll);
    this.set1f('uCrt', screenFx.crt ? 1 : 0);
    this.set1f('uSplit', screenFx.split);
    this.set1f('uWarp', screenFx.warp);
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
export function screenPulse(scene: Phaser.Scene, kind: 'split' | 'warp', px: number, ms: number): void {
  scene.tweens.killTweensOf(screenFx);
  screenFx[kind] = px;
  scene.tweens.add({
    targets: screenFx,
    [kind]: 0,
    duration: ms,
    ease: 'Quad.easeIn',
    onStop: () => (screenFx[kind] = 0),
  });
  scene.events.once('shutdown', () => (screenFx[kind] = 0));
}
