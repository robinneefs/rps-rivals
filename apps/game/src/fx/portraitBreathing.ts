import Phaser from 'phaser';
import { portraitBreathAmount } from '../config/portraitBreathing';
const KEY = 'portrait-breathing';
const FRAGMENT = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec4 uFrame;
uniform float uBreath;
uniform float uAnchor;
uniform float uFollow;
uniform float uHands;
varying vec2 outTexCoord;
varying float outTintEffect;
varying vec4 outTint;
void main() {
  vec2 uv = (outTexCoord - uFrame.xy) / (uFrame.zw - uFrame.xy);
  vec2 p = floor(uv * vec2(192.0,240.0)) + 0.5;
  // Soft, overlapping body regions preserve connected elbows and shoulders.
  float body = 1.0-smoothstep(164.0,205.0,p.y);
  float head = 1.0-smoothstep(91.0,119.0,p.y);
  float frontHand = (1.0-smoothstep(78.0,112.0,p.x))
    * smoothstep(39.0,65.0,p.y) * (1.0-smoothstep(139.0,166.0,p.y));
  float rearHand = smoothstep(151.0,174.0,p.x)
    * smoothstep(76.0,98.0,p.y) * (1.0-smoothstep(165.0,190.0,p.y));
  float torso = body * (1.0-head) * (1.0-frontHand) * (1.0-rearHand);
  // Anchor carries a heavier, slightly quieter lift; Riot's extended glove follows later.
  float weight = mix(1.0,0.9,uAnchor);
  vec2 shift = vec2(0.35*uBreath*body, -1.65*uBreath*body) * weight;
  shift += vec2((p.x-121.0)*0.045*uBreath*torso, -0.7*uBreath*torso) * weight;
  shift += vec2(0.4*uFollow*head, -0.65*uFollow*head);
  shift += vec2(-1.8*uHands*frontHand, -1.05*uHands*frontHand);
  shift += vec2(0.9*uFollow*rearHand, -0.8*uFollow*rearHand);
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
  follow = 0;
  hands = 0;
  constructor(game: Phaser.Game) {
    super({ game, fragShader: FRAGMENT });
  }
  override onBind(object?: Phaser.GameObjects.GameObject): void {
    if (!object) return;
    const frame = (object as Phaser.GameObjects.Image).frame;
    this.set4f('uFrame', frame.u0, frame.v0, frame.u1, frame.v1);
    this.set1f('uBreath', this.amount);
    this.set1f('uAnchor', this.anchor ? 1 : 0);
    this.set1f('uFollow', this.follow);
    this.set1f('uHands', this.hands);
  }
}
/** Animate only the rest image; original generated endpoints remain preserved as sources. */
export function addPortraitBreathing(
  scene: Phaser.Scene,
  image: Phaser.GameObjects.Image,
  id: 'taiko' | 'anchor' | 'riot',
) {
  if (!(scene.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return null;
  const manager = scene.game.renderer.pipelines;
  if (!manager.has(KEY)) manager.add(KEY, new PortraitBreathingPipeline(scene.game));
  const pipeline = manager.get(KEY) as PortraitBreathingPipeline;
  pipeline.anchor = id === 'anchor';
  pipeline.amount = 0;
  pipeline.follow = 0;
  pipeline.hands = 0;
  image.setPipeline(KEY);
  return {
    update: (elapsed: number, reduced: boolean) => {
      pipeline.amount = reduced ? 0 : portraitBreathAmount(elapsed);
      pipeline.follow = reduced ? 0 : portraitBreathAmount(elapsed - 100);
      pipeline.hands = reduced ? 0 : portraitBreathAmount(elapsed - 180);
    },
  };
}
