// Package image-generated breathing poses using Riot's native menu registration and timing.
// node tools/art/prepare-portrait-breathing.mjs (sharp or RPS_SHARP_PATH)
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const sharp = createRequire(import.meta.url)(process.env.RPS_SHARP_PATH || 'sharp');
const folder = new URL('../../art/portraits/action-v1/', import.meta.url);
const path = (name) => fileURLToPath(new URL(name, folder));
const phases = ['rest', 'inhale', 'exhale'];
const timing = JSON.parse(readFileSync(new URL('../../art/menus/action-v2/manifest.json', import.meta.url))).characterLoop;
mkdirSync(new URL('native/', folder), { recursive: true });
const audit = [];
for (const character of ['taiko', 'anchor']) {
  const frames = {}, composites = [];
  for (const [i, phase] of phases.entries()) {
    const filename = `${character}${phase === 'rest' ? '' : `-${phase}`}.png`;
    const { data, info } = await sharp(path(filename)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (info.width !== 1122 || info.height !== 1402) throw new Error(`Incorrect source dimensions: ${filename}`);
    // Same binary-alpha and small disconnected-component cleanup as prepare-action-menu.mjs.
    const { width: w, height: h } = info;
    const seen = new Uint8Array(w * h), queue = new Int32Array(w * h);
    for (let start = 0; start < w * h; start++) {
      if (seen[start] || data[start * 4 + 3] < 128) continue;
      queue[0] = start; seen[start] = 1;
      let head = 0, count = 1;
      while (head < count) {
        const p = queue[head++], x = p % w, y = Math.floor(p / w);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy, n = ny * w + nx;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h || seen[n] || data[n * 4 + 3] < 128) continue;
          seen[n] = 1; queue[count++] = n;
        }
      }
      for (let n = 0; n < count; n++) data[queue[n] * 4 + 3] = count >= 100 ? 255 : 0;
    }
    for (let p = 3; p < data.length; p += 4) if (data[p] < 128) data[p] = 0;
    const pose = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
      .resize(192, 240, { fit: 'fill', kernel: 'nearest' }).png().toBuffer();
    writeFileSync(path(`native/${character}-${phase}.png`), pose);
    composites.push({ input: pose, left: i * 192, top: 0 });
    frames[phase] = { frame: { x: i * 192, y: 0, w: 192, h: 240 }, rotated: false, trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 192, h: 240 }, sourceSize: { w: 192, h: 240 } };
    const native = await sharp(pose).raw().toBuffer();
    let opaque = 0;
    for (let p = 3; p < native.length; p += 4) {
      if (native[p] !== 0 && native[p] !== 255) throw new Error('Nonbinary native alpha');
      if (native[p]) opaque++;
    }
    if (opaque < 1000) throw new Error('Empty frame');
    audit.push({ character, phase, source: [w, h], native: [192, 240], opaque });
  }
  await sharp({ create: { width: 576, height: 240, channels: 4, background: '#00000000' } })
    .composite(composites).png().toFile(path(`native/${character}-sheet.png`));
  writeFileSync(path(`native/${character}-sheet.json`), JSON.stringify({ frames,
    meta: { image: `${character}-sheet.png`, size: { w: 576, h: 240 }, scale: '1' } }, null, 2));
}
const manifest = { characterLoop: { frames: timing.frames, durations: timing.durations },
  characters: ['taiko', 'anchor'].map(id => ({ id, atlas: `native/${id}-sheet.json`, image: `native/${id}-sheet.png` })),
  generation: 'Built-in image_gen edits of each original rest portrait; prompts saved beside source frames.', audit };
writeFileSync(path('breathing-manifest.json'), JSON.stringify(manifest, null, 2));
writeFileSync(path('preview.html'), `<!doctype html><meta charset="utf-8"><title>Taiko & Anchor breathing review</title>
<style>body{margin:24px;background:#181827;color:#eee;font:16px system-ui}main{display:flex;gap:32px;flex-wrap:wrap}canvas{width:384px;height:480px;image-rendering:pixelated;background:#343449}button{padding:8px 16px;margin:12px 0}p{max-width:780px}</style>
<h1>Taiko & Anchor · breathing</h1><p>Riot timing: rest 2000ms → inhale 240ms → rest 160ms → exhale 260ms → rest 180ms. Native 192 × 240 frames, shown at 2×.</p>
<button id="toggle">Pause</button> <span id="phase">rest</span><main><section><h2>Taiko</h2><canvas width="192" height="240" id="taiko"></canvas></section><section><h2>Anchor</h2><canvas width="192" height="240" id="anchor"></canvas></section></main>
<script>const order=${JSON.stringify(timing.frames)},durations=${JSON.stringify(timing.durations)},names=['rest','inhale','exhale'];let index=0,elapsed=0,last=performance.now(),paused=false;
const images=['taiko','anchor'].map(id=>{const image=new Image();image.src='native/'+id+'-sheet.png';return{image,ctx:document.getElementById(id).getContext('2d')}});
document.getElementById('toggle').onclick=()=>{paused=!paused;document.getElementById('toggle').textContent=paused?'Play':'Pause'};
function draw(now){if(!paused){elapsed+=Math.min(now-last,100);while(elapsed>=durations[index]){elapsed-=durations[index];index=(index+1)%order.length}}last=now;for(const{image,ctx}of images){ctx.clearRect(0,0,192,240);if(image.complete&&image.naturalWidth)ctx.drawImage(image,order[index]*192,0,192,240,0,0,192,240)}document.getElementById('phase').textContent=names[order[index]];requestAnimationFrame(draw)}requestAnimationFrame(draw);</script>`);
console.log(JSON.stringify(manifest, null, 2));
