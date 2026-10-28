// Bake and audit the full nine-pose Taiko alternate using explicit per-pose masks.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const sharp = createRequire(import.meta.url)(process.env.RPS_SHARP_PATH || 'sharp');
const out = 'art/fighters/mask-study-v1';
mkdirSync(out, { recursive: true });
const atlas = JSON.parse(readFileSync('apps/game/public/assets/taiko.json'));
const {data,info}=await sharp('apps/game/public/assets/taiko.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
const {width,height}=info;
const wrists = {
  idle0:[[56,86,73,104],[96,85,114,106]], idle1:[[56,86,73,104],[96,85,114,106]],
  rock:[[56,86,73,104],[110,76,121,88]], paper:[[77,69,97,86]],
  scissors:[[100,80,117,98]], hurt:[[43,92,58,108],[77,81,91,94]],
  ko:[[80,139,95,156]], win:[[53,49,68,71],[97,87,114,109]],
  kick:[[35,90,49,105],[61,82,73,92]],
};
const heads={idle0:[40,57,94,80],idle1:[40,57,94,80],rock:[40,57,94,80],paper:[37,58,87,83],scissors:[39,59,95,85],hurt:[15,60,59,101],ko:[13,129,45,159],win:[39,64,94,81],kick:[9,69,57,93]};
const palette=JSON.parse(readFileSync(`${out}/authoring.json`)).ramps;
// Preserve the approved ivory ramp; deeper crimson and darker charcoal.
palette[2]=[[35,'300915'],[90,'650c1b'],[145,'a41025'],[200,'d51b2e'],[235,'ee2937'],[255,'ff4245']];
palette[3]=palette[2];
palette[4]=[[20,'080b12'],[90,'10151d'],[160,'1b232d'],[215,'29333e'],[255,'3a4652']];
const colors=[[0,0,0],[72,196,237],[228,124,219],[124,205,113],[244,179,75]];
const inRect=(x,y,r)=>x>=r[0]&&x<=r[2]&&y>=r[1]&&y<=r[3];
const mask=Buffer.alloc(data.length);
for(const [name,{frame:f}] of Object.entries(atlas.frames)) {
  for(let y=0;y<f.h;y++) for(let x=0;x<f.w;x++) {
    const i=((f.y+y)*width+f.x+x)*4;
    const [r,g,b,a]=data.subarray(i,i+4);
    if(!a) continue;
    const high=Math.max(r,g,b),low=Math.min(r,g,b),chroma=high-low,saturation=high?chroma/high:0;
    let hue=chroma?60*(high===r?(g-b)/chroma:high===g?(b-r)/chroma+2:(r-g)/chroma+4):0;
    hue=(hue+360)%360;
    let id=0;
    // Authoring selections are baked to a fixed raster mask, never guessed in-game.
    if(saturation>.65 && high>28 && (hue>=330||hue<=7)) id=1;
    if(saturation>.65 && high>45 && hue>7&&hue<58 && inRect(x,y,heads[name]) && b<r*.25) id=3;
    else if(saturation>.65 && high>45 && hue>=28&&hue<58 && b<g*.48) id=4;
    if(high>65 && saturation<.36 && wrists[name].some(rect=>inRect(x,y,rect))) id=2;
    // Original orange interpolation flecks inside the tunic fasteners are fabric.
    if(['idle0','idle1','rock','win'].includes(name) && x>=75&&x<=84&&y>=82&&y<=92 && saturation>.7&&high>90&&(hue<28||hue>=330)) id=1;
    if(name==='ko'&&x>=53&&x<=75&&y>=130&&y<=143&&saturation>.65&&hue>7&&hue<58&&b<g*.48) id=4;
    if(name==='win'&&x===68&&y===99) id=4;
    if(id) {colors[id].forEach((v,c)=>mask[i+c]=v);mask[i+3]=255;}
  }
}
// Dark interpolation specks can share the tunic's red or fall below the original
// saturation cutoff. Resolve these locally from existing material neighbors,
// using a snapshot so the correction cannot spread across the skin/ink boundary.
const initialMask=Buffer.from(mask);
for(const [name,{frame:f}]of Object.entries(atlas.frames)) {
  for(let y=1;y<159;y++)for(let x=1;x<159;x++){
    const p=(f.y+y)*width+f.x+x,i=p*4;
    if(!data[i+3])continue;
    const [r,g,b]=data.subarray(i,i+3),high=Math.max(r,g,b);
    let headNeighbors=0,wrapNeighbors=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;
      const n=(p+dy*width+dx)*4;
      if(initialMask[n+3]&&initialMask[n]===colors[3][0])headNeighbors++;
      if(initialMask[n+3]&&initialMask[n]===colors[2][0])wrapNeighbors++;
    }
    const fabric=initialMask[i+3]&&initialMask[i]===colors[1][0];
    let id=0;
    if(inRect(x,y,heads[name])&&headNeighbors>=3&&(fabric||(high>28&&high<135&&r>g*1.5&&r>b*1.4)))id=3;
    if(!initialMask[i+3]&&wrapNeighbors>=4&&high>=30&&high<100&&b>=r*.9&&high-Math.min(r,g,b)<40&&wrists[name].some(rect=>inRect(x,y,rect)))id=2;
    if(id){colors[id].forEach((v,c)=>mask[i+c]=v);mask[i+3]=255;}
  }
}
if(process.argv.includes('--render-only')) {
  const fixed=await sharp(`${out}/taiko-atlas-material-mask.png`).ensureAlpha().raw().toBuffer();
  if(fixed.length!==mask.length) throw new Error('Mask dimensions differ');
  fixed.copy(mask);
} else await sharp(mask,{raw:{width,height,channels:4}}).png().toFile(`${out}/taiko-atlas-material-mask.png`);
function mapShade(value,stops) {
  let j=1;while(j<stops.length-1&&value>stops[j][0]) j++;
  const a=stops[j-1],b=stops[j],t=Math.max(0,Math.min(1,(value-a[0])/(b[0]-a[0])));
  return [0,2,4].map(k=>Math.round(parseInt(a[1].slice(k,k+2),16)*(1-t)+parseInt(b[1].slice(k,k+2),16)*t));
}
const result=Buffer.from(data),overlay=Buffer.from(data),audit=[];
for(let i=0;i<data.length;i+=4) {
  if(!mask[i+3]) continue;
  const id=colors.findIndex(rgb=>rgb.every((v,c)=>mask[i+c]===v));
  if(id<1) throw new Error('Invalid material color');
  const mapped=mapShade(Math.max(...data.subarray(i,i+3)),palette[id]);
  mapped.forEach((v,c)=>result[i+c]=v);
  colors[id].forEach((v,c)=>overlay[i+c]=Math.round(data[i+c]*.25+v*.75));
}
for(const [name,{frame:f}] of Object.entries(atlas.frames)) {
  let changed=0,outsideChanges=0,alphaChanges=0;
  for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++) {
    const i=((f.y+y)*width+f.x+x)*4;
    const different=!data.subarray(i,i+4).equals(result.subarray(i,i+4));
    if(different)changed++;
    if(different&&!mask[i+3])outsideChanges++;
    if(data[i+3]!==result[i+3])alphaChanges++;
  }
  if(outsideChanges||alphaChanges)throw new Error(`Containment failure: ${name}`);
  audit.push({name,changed,outsideChanges,alphaChanges});
}
const png=buffer=>sharp(buffer,{raw:{width,height,channels:4}}).png();
await png(result).toFile(`${out}/taiko-masked-atlas.png`);
await png(overlay).toFile(`${out}/taiko-atlas-overlay.png`);
await png(result).flatten({background:'#454859'}).resize(1440,1440,{kernel:'nearest'}).toFile(`${out}/all-frames-3x.png`);
const panels=[];
for(const [name,{frame:f}] of Object.entries(atlas.frames)) {
  const row=panels.length/3;
  for(const [col,buffer] of [data,result,overlay].entries()) {
    const input=await png(buffer).extract({left:f.x,top:f.y,width:160,height:160}).flatten({background:'#454859'}).resize(480,480,{kernel:'nearest'}).toBuffer();
    panels.push({input,left:col*480,top:row*480});
  }
  await png(result).extract({left:f.x,top:f.y,width:160,height:160}).toFile(`${out}/taiko-${name}-alternate.png`);
}
await sharp({create:{width:1440,height:9*480,channels:3,background:'#454859'}}).composite(panels).png().toFile(`${out}/all-frames-comparison.png`);
// Preserve the established idle comparison links.
for(const [file,buffer]of [['taiko-idle-original.png',data],['taiko-idle-alternate.png',result],['taiko-idle-mask-overlay.png',overlay]])
  await png(buffer).extract({left:0,top:0,width:160,height:160}).toFile(`${out}/${file}`);
await png(mask).extract({left:0,top:0,width:160,height:160}).toFile(`${out}/taiko-idle-material-mask.png`);
const details=[];
for(const [col,buffer]of [data,result,overlay].entries()) {
  const input=await png(buffer).extract({left:36,top:54,width:88,height:103}).flatten({background:'#454859'}).resize(352,412,{kernel:'nearest'}).toBuffer();
  details.push({input,left:col*352,top:0});
}
await sharp({create:{width:1056,height:412,channels:3,background:'#454859'}}).composite(details).png().toFile(`${out}/detail-comparison.png`);
await sharp({create:{width:1440,height:480,channels:3,background:'#454859'}}).composite(panels.slice(0,3)).png().toFile(`${out}/comparison.png`);
for(let k=0;k<3;k++)await sharp(`${out}/all-frames-comparison.png`).extract({left:0,top:k*1440,width:1440,height:1440}).toFile(`${out}/review-${k}.png`);
writeFileSync(`${out}/atlas-audit.json`,JSON.stringify({source:'taiko.png',size:[width,height],palette,frames:audit},null,2));
writeFileSync(`${out}/preview.html`,`<!doctype html><meta charset="utf-8"><title>Taiko · all masked combat frames</title><style>body{background:#191a25;color:#f5efdf;font:16px system-ui;margin:24px}main{display:flex;gap:24px;flex-wrap:wrap}canvas,img{image-rendering:pixelated;background:#454859}canvas{width:480px;height:480px}button{padding:9px 14px;margin:4px}section{margin:20px 0}.review{width:min(100%,960px)}p{max-width:920px;line-height:1.5}</style><h1>Taiko · complete masked combat palette</h1><p>Approved ivory retained. Deeper, brighter crimson wraps/headband; darker charcoal belt. Every pose has its own mask. Ankles and skin remain original.</p><div id="buttons"></div><main><section><h2>Original</h2><canvas id="original" width="160" height="160"></canvas></section><section><h2>Masked alternate</h2><canvas id="alternate" width="160" height="160"></canvas></section><section><h2>Material mask overlay</h2><canvas id="overlay" width="160" height="160"></canvas></section></main><p id="label"></p><h2>Every frame · original / alternate / overlay</h2><img class="review" src="all-frames-comparison.png" alt="Every combat frame comparison"><script>const frames=${JSON.stringify(Object.fromEntries(Object.entries(atlas.frames).map(([name,{frame}])=>[name,frame])))},images={};let selected='idle',start=performance.now();for(const [id,url]of Object.entries({original:'../../../apps/game/public/assets/taiko.png',alternate:'taiko-masked-atlas.png',overlay:'taiko-atlas-overlay.png'})){const image=new Image();image.src=url;images[id]=image;}for(const name of ['idle',...Object.keys(frames)]){const b=document.createElement('button');b.textContent=name;b.onclick=()=>{selected=name;start=performance.now()};document.getElementById('buttons').append(b)}function draw(now){const name=selected==='idle'?(Math.floor((now-start)/350)%2?'idle1':'idle0'):selected,f=frames[name];for(const[id,image]of Object.entries(images)){const c=document.getElementById(id).getContext('2d');c.clearRect(0,0,160,160);if(image.complete&&image.naturalWidth)c.drawImage(image,f.x,f.y,160,160,0,0,160,160)}document.getElementById('label').textContent=name;requestAnimationFrame(draw)}requestAnimationFrame(draw);</script>`);
console.log(JSON.stringify(audit));
