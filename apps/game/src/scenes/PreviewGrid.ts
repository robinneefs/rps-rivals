import Phaser from 'phaser';
import { SCREEN } from '../cabinet/geometry';
import { MONITOR } from '../config/layout';
import { getContext } from './context';

const PRESETS = [192, 144, 216, 288, 96] as const;

/** Capture every preview layer onto ONE real grid, then enlarge only the finished texture. */
export function mountPreviewGrid(scene: Phaser.Scene, panel: HTMLElement, baseWidth = 144): void {
  const { cabinet } = getContext(scene);
  const camera = scene.cameras.main;
  const sources = [...scene.children.list];
  camera.ignore(sources);
  const canvas = scene.game.canvas;
  const oldRendering = canvas.style.imageRendering;
  let width: number = baseWidth;
  let block = 1;
  let target: Phaser.GameObjects.RenderTexture | null = null;
  let closed = false;

  const label = document.createElement('label');
  label.textContent = 'Grid ';
  Object.assign(label.style, { display: 'block', margin: '5px 0' });
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Grid');
  PRESETS.forEach((w) => select.add(new Option(`${w} x ${(w * 5) / 4}`, String(w))));
  select.value = String(baseWidth);
  select.addEventListener('keydown', (event) => event.stopPropagation());
  label.append(select);
  panel.prepend(label);
  const verify = document.createElement('button');
  verify.textContent = 'Check pixel grid';
  const result = document.createElement('output');
  result.setAttribute('aria-label', 'Grid check result');
  Object.assign(result.style, { display: 'block', fontSize: '12px', maxWidth: '260px' });
  panel.append(verify, result);

  const fit = () => {
    const height = (width * 5) / 4;
    block = Math.max(1, Math.min(6, Math.ceil(cabinet.screenSize.deviceWidth / width)));
    scene.scale.resize(width * block, height * block);
    scene.scale.setZoom(SCREEN.width / (width * block));
    camera
      .setViewport(0, 0, width * block, height * block)
      .setOrigin(0)
      .setZoom((width * block) / baseWidth);
    canvas.style.imageRendering = 'pixelated';
    canvas.dataset.previewGrid = `${width}x${height}`;
    canvas.dataset.previewBlock = String(block);
    result.textContent = '';
  };
  const redraw = () => {
    if (!target) return;
    // DynamicTexture has a BaseCamera; willRender only needs its id.
    const captureCamera = target.camera as Phaser.Cameras.Scene2D.Camera;
    target.clear().draw(sources.filter((object) => object.willRender(captureCamera)));
  };
  const apply = () => {
    target?.destroy();
    target = scene.add
      .renderTexture(0, 0, width, (width * 5) / 4)
      .setOrigin(0)
      .setDisplaySize(baseWidth, (baseWidth * 5) / 4);
    target.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    target.camera.setOrigin(0).setZoom(width / baseWidth);
    fit();
    redraw();
  };
  select.addEventListener('change', () => {
    width = Number(select.value);
    apply();
  });
  const offResize = cabinet.onResize(fit);
  scene.events.on('postupdate', redraw);

  // Inspect the actual rendered framebuffer, not just the configured resolution.
  verify.addEventListener('click', () => {
    if (!(scene.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) {
      result.textContent = 'Pixel verification needs WebGL.';
      return;
    }
    const checkedWidth = width;
    const checkedBlock = block;
    result.textContent = 'Checking rendered pixels...';
    scene.game.renderer.snapshot((snapshot) => {
      if (closed || width !== checkedWidth || block !== checkedBlock) return;
      if (!(snapshot instanceof HTMLImageElement)) return;
      const copy = document.createElement('canvas');
      copy.width = snapshot.width;
      copy.height = snapshot.height;
      const ctx = copy.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(snapshot, 0, 0);
      const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
      let broken = 0;
      const colours = new Set<number>();
      for (let y = 0; y < copy.height; y += checkedBlock) {
        for (let x = 0; x < copy.width; x += checkedBlock) {
          const start = (y * copy.width + x) * 4;
          colours.add((pixels[start]! << 16) | (pixels[start + 1]! << 8) | pixels[start + 2]!);
          let uniform = true;
          for (let dy = 0; dy < checkedBlock && uniform; dy++) {
            for (let dx = 0; dx < checkedBlock && uniform; dx++) {
              const at = ((y + dy) * copy.width + x + dx) * 4;
              for (let c = 0; c < 4; c++) if (pixels[at + c] !== pixels[start + c]) uniform = false;
            }
          }
          if (!uniform) broken++;
        }
      }
      const dimensionsMatch =
        copy.width === checkedWidth * checkedBlock && copy.height === ((checkedWidth * 5) / 4) * checkedBlock;
      const pass = dimensionsMatch && colours.size > 1 && broken === 0;
      result.textContent = `${pass ? 'PASS' : 'FAIL'}: ${checkedWidth} x ${(checkedWidth * 5) / 4}, ${checkedBlock}x${checkedBlock} blocks; ${broken} broken cells.`;
      result.dataset.gridPass = String(pass);
    });
  });
  scene.events.once('shutdown', () => {
    closed = true;
    offResize();
    scene.events.off('postupdate', redraw);
    canvas.style.imageRendering = oldRendering;
    delete canvas.dataset.previewGrid;
    delete canvas.dataset.previewBlock;
    // Restore the normal game canvas, including when the dev panel starts a match.
    scene.scale.resize(MONITOR.width, MONITOR.height);
    scene.scale.setZoom(SCREEN.width / MONITOR.width);
  });
  apply();
}
