// One native combat pose, with a separately inspectable material mask.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const sharp = createRequire(import.meta.url)(process.env.RPS_SHARP_PATH || 'sharp');
const out = resolve('art/fighters/mask-study-v1');
mkdirSync(out, { recursive: true });
const source = 'apps/game/public/assets/taiko.png';
const atlas = JSON.parse(readFileSync('apps/game/public/assets/taiko.json'));
const frame = atlas.frames.idle0.frame;
const { data } = await sharp(source).extract({ left: frame.x, top: frame.y, width: frame.w, height: frame.h })
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const width = frame.w, height = frame.h;
const regions = [
  { name:'tunic', id:1, points:[[63,78],[70,74],[76,78],[79,81],[87,80],[90,85],[90,95],[86,102],[68,104],[64,100],[70,96],[77,94],[78,89],[73,86],[68,87],[66,88]] },
  { name:'trousers', id:1, points:[[68,106],[85,106],[91,110],[99,115],[106,122],[109,130],[113,135],[112,140],[107,143],[100,143],[95,140],[90,135],[89,130],[82,124],[79,122],[74,128],[69,133],[66,139],[60,143],[50,143],[46,139],[46,132],[52,126],[59,119],[64,115]] },
  { name:'front-wrap', id:2, points:[[59,92],[65,90],[68,89],[70,92],[70,95],[67,98],[64,101],[60,102],[58,98]] },
  { name:'rear-wrap', id:2, points:[[102,90],[107,91],[110,92],[110,95],[108,99],[106,101],[102,101],[99,98],[99,94]] },
  { name:'headband', id:3, points:[[70,64],[92,64],[91,70],[86,70],[82,68],[77,68],[74,70],[69,70]] },
  { name:'upper-tail', id:3, points:[[45,62],[61,62],[63,65],[73,65],[73,69],[60,70],[48,70]] },
  { name:'lower-tail', id:3, points:[[46,75],[56,70],[65,69],[72,68],[71,72],[62,73],[54,78],[49,79]] },
  { name:'belt-and-tails', id:4, points:[[68,102],[87,102],[88,108],[71,108],[69,114],[67,123],[57,123],[60,114],[53,119],[48,122],[44,114],[51,111],[62,106]] },
  { name:'fasteners', id:4, points:[[75,83],[83,83],[83,91],[77,91]] },
];
function inside(x,y,points) {
  let hit=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++) {
    const a=points[i],b=points[j];
    if((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) hit=!hit;
  }
  return hit;
}
const colors = [[0,0,0],[72,196,237],[228,124,219],[124,205,113],[244,179,75]];
const mask = Buffer.alloc(data.length);
if(process.argv.includes('--render-only')) {
  const saved=await sharp(`${out}/taiko-idle-material-mask.png`).ensureAlpha().raw().toBuffer();
  if(saved.length!==mask.length) throw new Error('Mask dimensions differ');
  saved.copy(mask);
} else {
  for(let p=0;p<width*height;p++) {
    const i=p*4, [r,g,b,a]=data.subarray(i,i+4);
    if(!a) continue;
    const x=p%width+.5,y=Math.floor(p/width)+.5;
    let id=0;
    // Authoring-only color-assisted selection inside explicit material contours.
    // Rendering below consumes the baked mask; it never guesses materials from RGB.
    for(const region of regions) {
      const reach=region.name==='trousers'?3:1;
      const near=inside(x,y,region.points) || (region.id===1 && [[-reach,0],[reach,0],[0,-reach],[0,reach]].some(([dx,dy])=>inside(x+dx,y+dy,region.points)));
      if(!near) continue;
      if(region.id===1 && r>g*1.75 && r>b*1.9 && r>25) id=1;
      if(region.id===2 && Math.max(r,g,b)>100 && Math.max(r,g,b)-Math.min(r,g,b)<65) id=2;
      if(region.id===3 && r>65 && r>g*1.5 && g>b*1.5 && g<r*.7) id=3;
      if(region.id===4 && r>60 && g>r*.45 && g<r*.92 && b<g*.55) id=4;
    }
    if(id) { colors[id].forEach((v,c)=>mask[i+c]=v); mask[i+3]=255; }
  }
  await sharp(mask,{raw:{width,height,channels:4}}).png().toFile(`${out}/taiko-idle-material-mask.png`);
}
const ramps = {
  1:[[20,'25212a'],[65,'655d59'],[105,'a69b85'],[150,'d0c5ab'],[195,'eee4ce'],[240,'fff5e1'],[255,'fff9ed']],
  2:[[50,'3b101c'],[110,'791624'],[165,'ac2330'],[215,'cd343c'],[255,'e64b47']],
  3:[[35,'35101b'],[85,'671321'],[135,'9c1d2b'],[195,'c82d36'],[255,'e64b47']],
  4:[[20,'0c1018'],[90,'191e27'],[160,'2b323c'],[215,'414a54'],[255,'59636b']],
};
function mapShade(value,stops) {
  let j=1; while(j<stops.length-1 && value>stops[j][0]) j++;
  const a=stops[j-1],b=stops[j],t=Math.max(0,Math.min(1,(value-a[0])/(b[0]-a[0])));
  return [0,2,4].map(k=>Math.round(parseInt(a[1].slice(k,k+2),16)*(1-t)+parseInt(b[1].slice(k,k+2),16)*t));
}
const result=Buffer.from(data),overlay=Buffer.from(data);
let masked=0,changed=0;
const materialPixels={};
for(let p=0;p<width*height;p++) {
  const i=p*4;
  if(!mask[i+3]) continue;
  const id=colors.findIndex(rgb=>rgb.every((v,c)=>mask[i+c]===v));
  if(id<1) throw new Error(`Invalid mask color at ${p%width},${Math.floor(p/width)}`);
  masked++; materialPixels[id]=(materialPixels[id]||0)+1;
  const rgb=mapShade(Math.max(...data.subarray(i,i+3)),ramps[id]);
  rgb.forEach((v,c)=>result[i+c]=v);
  colors[id].forEach((v,c)=>overlay[i+c]=Math.round(data[i+c]*.25+v*.75));
  if(!data.subarray(i,i+3).equals(result.subarray(i,i+3))) changed++;
}
let outsideChanges=0;
for(let i=0;i<data.length;i+=4) {
  if(data[i+3]!==result[i+3]) throw new Error('Alpha changed');
  if(!mask[i+3] && !data.subarray(i,i+4).equals(result.subarray(i,i+4))) outsideChanges++;
}
if(outsideChanges) throw new Error('Unmasked pixels changed');
const png=buffer=>sharp(buffer,{raw:{width,height,channels:4}}).png();
await png(data).toFile(`${out}/taiko-idle-original.png`);
await png(result).toFile(`${out}/taiko-idle-alternate.png`);
await png(overlay).toFile(`${out}/taiko-idle-mask-overlay.png`);
const panels=await Promise.all([data,result,overlay].map(buffer=>png(buffer).flatten({background:'#454859'}).resize(640,640,{kernel:'nearest'}).toBuffer()));
await sharp({create:{width:1920,height:640,channels:3,background:'#454859'}}).composite(panels.map((input,i)=>({input,left:i*640,top:0}))).png().toFile(`${out}/comparison.png`);
// A tighter enlarged view makes the actual character easier to compare in chat.
const detail=await Promise.all([data,result,overlay].map(buffer=>png(buffer).extract({left:36,top:54,width:88,height:103}).flatten({background:'#454859'}).resize(352,412,{kernel:'nearest'}).toBuffer()));
await sharp({create:{width:1056,height:412,channels:3,background:'#454859'}}).composite(detail.map((input,i)=>({input,left:i*352,top:0}))).png().toFile(`${out}/detail-comparison.png`);
writeFileSync(`${out}/authoring.json`,JSON.stringify({source,frame:'idle0',regions,ramps},null,2));
writeFileSync(`${out}/audit.json`,JSON.stringify({size:[width,height],masked,changed,materialPixels,outsideChanges,alphaUnchanged:true,registrationUnchanged:true},null,2));
writeFileSync(`${out}/preview.html`,`<!doctype html><meta charset="utf-8"><title>Taiko combat sprite mask trial</title><style>body{background:#191a25;color:#f5efdf;font:16px system-ui;margin:30px}main{display:flex;gap:24px;flex-wrap:wrap}img{image-rendering:pixelated;background:#454859}.large{width:480px;height:480px}.native{width:160px;height:160px}p{max-width:900px;line-height:1.5}</style><h1>Taiko · combat sprite mask trial</h1><p>One idle pose. Ivory tunic/trousers, crimson headband/wrists, charcoal belt/fasteners. Original geometry, transparency and placement preserved. Cyan: fabric; pink: wraps; green: headband; gold: trim.</p><main>${[['Original','original'],['Masked alternate','alternate'],['Mask overlay','mask-overlay']].map(([label,file])=>`<section><h2>${label}</h2><img class="large" src="taiko-idle-${file}.png" alt="${label}"><h3>Native size</h3><img class="native" src="taiko-idle-${file}.png" alt="${label} at native size"></section>`).join('')}</main>`);
console.log(JSON.stringify({out,masked,changed,outsideChanges,materialPixels}));
