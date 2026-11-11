import Phaser from 'phaser';
import type { CabinetView } from '../cabinet/CabinetView';
import { tuning } from '../config/tuning';
import { CRT_FRAGMENT, screenFx } from './crt';

/** Nearest-enlarge the finished pixel framebuffer, then shade at display resolution. */
export function mountCrtDisplay(game: Phaser.Game, cabinet: CabinetView): void {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
  if (!gl) return; // Keep the native camera shader as a fallback.
  const shader = (type: number, source: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'CRT shader');
    return s;
  };
  const program = gl.createProgram()!;
  const vert = shader(
    gl.VERTEX_SHADER,
    `
    attribute vec2 position;
    varying vec2 outTexCoord;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
      outTexCoord = position * 0.5 + 0.5;
    }
  `,
  );
  const frag = shader(gl.FRAGMENT_SHADER, CRT_FRAGMENT);
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('CRT display link failed');
  gl.useProgram(program);
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const names = [
    'Resolution',
    'Viewport',
    'Time',
    'RollPhase',
    'Glow',
    'Vignette',
    'Corner',
    'Roll',
    'Scanline',
    'Mask',
    'Gamma',
    'Fringe',
    'Crt',
    'Split',
    'Warp',
    'Pixel',
    'Pitch',
    'Thickness',
    'Flash',
    'Mono',
  ];
  const uniforms = Object.fromEntries(
    names.map((name) => [name, gl.getUniformLocation(program, `u${name}`)]),
  );
  const set = (name: string, value: number) => gl.uniform1f(uniforms[name]!, value);
  Object.assign(canvas.style, { position: 'absolute', top: '0', pointerEvents: 'none', zIndex: '1' });
  canvas.setAttribute('aria-hidden', 'true');
  cabinet.screen.append(canvas);
  const resize = () => {
    const size = cabinet.screenSize;
    canvas.width = Math.max(1, Math.round(size.deviceWidth));
    canvas.height = Math.max(1, Math.round(size.deviceHeight));
    canvas.style.width = `${game.canvas.width * cabinet.canvasZoom}px`;
    canvas.style.height = `${game.canvas.height * cabinet.canvasZoom}px`;
    canvas.style.left = `${cabinet.monitorInsetX}px`;
  };
  resize();
  const offResize = cabinet.onResize(resize);
  screenFx.presentation = true;
  const draw = () => {
    const c = tuning.crt;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, game.canvas);
    gl.uniform2f(uniforms.Resolution!, canvas.width, canvas.height);
    gl.uniform4f(uniforms.Viewport!, 0, 0, canvas.width, canvas.height);
    const seconds = game.loop.time / 1000;
    const values: Record<string, number> = {
      Time: seconds % ((Math.PI * 2) / 60),
      RollPhase: (seconds * 0.12) % 1,
      Glow: c.glow,
      Vignette: c.vignette,
      Corner: c.cornerRadius,
      Roll: c.roll,
      Scanline: c.scanlineAlpha,
      Mask: c.phosphorMask,
      Gamma: c.gamma,
      Fringe: c.colorFringe,
      Crt: screenFx.crt ? 1 : 0,
      Split: screenFx.split,
      Warp: screenFx.warp,
      Pixel: canvas.width / game.canvas.width,
      Pitch: c.texturePitch,
      Thickness: c.scanlineThickness,
      Flash: screenFx.flash,
      Mono: screenFx.mono,
    };
    for (const [name, value] of Object.entries(values)) set(name, value);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  game.events.on(Phaser.Core.Events.POST_RENDER, draw);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    game.events.off(Phaser.Core.Events.POST_RENDER, draw);
    screenFx.presentation = false;
    canvas.style.display = 'none';
  });
  game.events.once(Phaser.Core.Events.DESTROY, () => {
    offResize();
    game.events.off(Phaser.Core.Events.POST_RENDER, draw);
    screenFx.presentation = false;
    canvas.remove();
    gl.deleteTexture(texture);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vert);
    gl.deleteShader(frag);
  });
}
