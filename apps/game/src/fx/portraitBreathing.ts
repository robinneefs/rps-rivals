import Phaser from 'phaser';
import { portraitBreathAmount } from '../config/portraitBreathing';
const KEY = 'portrait-breathing';
const FRAGMENT = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec4 uFrame;
uniform float uBreath;
uniform float uAnchor;
varying vec2 outTexCoord;
varying float outTintEffect;
varying vec4 outTint;
void main() {
  vec2 uv = (outTexCoord - uFrame.xy) / (uFrame.zw - uFrame.xy);
  vec2 p = floor(uv * vec2(192.0,240.0)) + 0.5;
  // Protect the complete head/hair, both hands/forearms and the registered waist crop.
  float upper = smoothstep(107.0,123.0,p.y);
  float lower = 1.0-smoothstep(161.0,180.0,p.y);
  float left = smoothstep(94.0,112.0,p.x);
  float right = 1.0-smoothstep(151.0,166.0,p.x);
  float faceLock = step(1.0,length((p-vec2(139.0,90.0))/vec2(33.0,35.0)));
  float chest = upper * lower * left * right * faceLock;
  float lift = mix(1.15,1.3,uAnchor) * uBreath * chest;
  vec2 shift = vec2((p.x-124.0)*0.035*uBreath*chest, -lift);
  // Sample whole native pixels. No blend, re-drawing, subpixel shimmer or face warping.
  vec2 samplePixel = p - floor(shift + 0.5);
  vec2 sampleUv = uFrame.xy + (samplePixel / vec2(192.0,240.0)) * (uFrame.zw-uFrame.xy);
  vec4 texture = texture2D(uMainSampler,sampleUv);
  vec4 tint = vec4(outTint.bgr*outTint.a,outTint.a);
  gl_FragColor = texture*tint;
}`;
class PortraitBreathingPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
  amount = 0;
  anchor = false;
  constructor(game: Phaser.Game) {
    super({ game, fragShader: FRAGMENT });
  }
  override onBind(object?: Phaser.GameObjects.GameObject): void {
    if (!object) return;
    const frame = (object as Phaser.GameObjects.Image).frame;
    this.set4f('uFrame', frame.u0, frame.v0, frame.u1, frame.v1);
    this.set1f('uBreath', this.amount);
    this.set1f('uAnchor', this.anchor ? 1 : 0);
  }
}
/** Animate only the rest image; original generated endpoints remain preserved as sources. */
export function addPortraitBreathing(
  scene: Phaser.Scene,
  image: Phaser.GameObjects.Image,
  id: 'taiko' | 'anchor',
) {
  if (!(scene.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return null;
  const manager = scene.game.renderer.pipelines;
  if (!manager.has(KEY)) manager.add(KEY, new PortraitBreathingPipeline(scene.game));
  const pipeline = manager.get(KEY) as PortraitBreathingPipeline;
  pipeline.anchor = id === 'anchor';
  pipeline.amount = 0;
  image.setPipeline(KEY);
  return {
    update: (elapsed: number, reduced: boolean) => {
      pipeline.amount = reduced ? 0 : portraitBreathAmount(elapsed);
    },
  };
}
