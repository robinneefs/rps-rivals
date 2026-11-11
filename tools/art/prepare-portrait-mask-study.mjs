// Isolated, deterministic single-portrait experiment. No production assets are replaced.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const sharp = createRequire(import.meta.url)(process.env.RPS_SHARP_PATH || 'sharp');
const out = resolve('art/portraits/mask-study-v1');
mkdirSync(out, { recursive: true });
const source = 'apps/game/public/assets/menus/action/taiko-sheet.png';
const { data, info } = await sharp(source).extract({ left: 0, top: 0, width: 192, height: 240 })
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
// Native-pixel material contours. These are editable authoring geometry, not runtime guesses.
const regions = [
  { name: 'tunic', id: 1, color: '#48c4ed', points: [[89,79],[98,71],[104,73],[113,82],[121,96],[127,110],[139,116],[149,101],[152,101],[154,115],[157,128],[156,151],[154,161],[146,171],[144,181],[137,183],[140,190],[134,194],[128,203],[112,197],[98,191],[83,187],[67,183],[54,179],[59,170],[62,164],[58,154],[72,151],[86,145],[97,137],[105,126],[109,117],[108,109],[102,96]] },
  { name: 'front-wrap', id: 2, color: '#e47cdb', points: [[4,94],[8,94],[11,104],[20,102],[23,96],[30,99],[35,96],[38,96],[45,94],[49,96],[58,96],[63,91],[65,84],[69,88],[70,97],[73,104],[76,111],[70,114],[58,114],[52,117],[47,121],[42,128],[40,131],[27,131],[17,128],[8,122],[3,118],[3,108]] },
  { name: 'front-lower-wrap', id: 2, color: '#e47cdb', points: [[8,129],[17,134],[28,135],[40,133],[46,135],[54,136],[63,135],[71,131],[70,137],[64,143],[55,148],[46,150],[39,150],[29,148],[20,144],[12,137]] },
  { name: 'front-wrap-join', id: 2, color: '#e47cdb', points: [[3,116],[17,127],[27,130],[40,130],[46,134],[62,133],[74,129],[72,138],[63,145],[50,151],[40,153],[27,150],[17,145],[10,138],[5,128]] },
  { name: 'rear-wrap', id: 2, color: '#e47cdb', points: [[160,96],[167,96],[173,98],[178,102],[182,111],[185,119],[187,130],[188,138],[190,145],[190,155],[186,163],[179,165],[172,161],[166,156],[164,148],[166,139],[169,132],[170,126],[166,122],[171,120],[172,115],[168,111],[171,108],[166,106],[169,102],[162,102]] },
  { name: 'forehead-band', id: 3, color: '#7ccd71', points: [[106,47],[120,47],[128,50],[138,53],[145,56],[155,59],[169,62],[169,70],[161,78],[156,80],[150,75],[145,71],[140,70],[135,68],[129,66],[125,65],[119,63],[116,61],[110,58]] },
  { name: 'upper-tail', id: 3, color: '#7ccd71', points: [[49,20],[62,16],[70,13],[75,15],[83,22],[91,32],[96,43],[101,49],[106,52],[103,55],[97,51],[91,44],[86,36],[78,31],[70,30],[61,30],[55,25]] },
  { name: 'middle-tail', id: 3, color: '#7ccd71', points: [[37,39],[48,36],[58,34],[67,35],[76,40],[85,49],[93,52],[102,54],[108,53],[106,58],[97,59],[86,59],[81,53],[75,50],[66,49],[58,51],[51,53],[45,48]] },
  { name: 'lower-tail', id: 3, color: '#7ccd71', points: [[67,70],[79,65],[87,65],[94,62],[105,60],[105,64],[99,67],[93,70],[85,73],[80,75],[75,72]] },
  { name: 'belt', id: 4, color: '#f4b34b', points: [[59,165],[70,162],[81,164],[91,166],[101,169],[112,175],[120,181],[126,186],[129,193],[128,198],[130,204],[124,202],[118,197],[110,192],[100,188],[88,184],[77,180],[67,177],[57,176]] },
  { name: 'belt-tails', id: 4, color: '#f4b34b', points: [[22,169],[29,164],[35,158],[43,160],[50,163],[60,165],[59,171],[52,176],[43,177],[37,175],[29,172]] },
];
const inside = (x,y,points) => {
  let hit = false;
  for(let i=0,j=points.length-1;i<points.length;j=i++) {
    const a=points[i],b=points[j];
    if((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) hit=!hit;
  }
  return hit;
};
const ids = new Uint8Array(width*height);
for(let p=0;p<ids.length;p++) {
  if(!data[p*4+3]) continue;
  const x=p%width+.5,y=Math.floor(p/width)+.5;
  for(const region of regions) if(inside(x,y,region.points)) ids[p]=region.id;
  // Authoring-only assisted selection separates gold stitches inside the traced tunic.
  // The exported mask is explicit and can be retouched without any color inference.
  const [r,g,b]=data.subarray(p*4,p*4+3);
  if(!ids[p]) {
    // Include small contour-edge details; freeze the resulting selection in the PNG mask.
    for(const region of regions.filter(region=>region.id!==2)) {
      const near=[[-2,0],[2,0],[0,-2],[0,2]].some(([dx,dy])=>inside(x+dx,y+dy,region.points));
      if(!near) continue;
      if(region.id===1 && r>g*1.6 && r>b*1.8) ids[p]=1;
      if((region.id===3 || region.id===4) && r>55 && g>r*.27 && g<r*.85 && b<r*.27) ids[p]=region.id;
    }
  }
  if(ids[p]===1) {
    // Keep the exposed neck/chest and shared black ink out of the fabric mask.
    const neck=inside(x,y,[[119,97],[127,100],[130,108],[139,114],[142,117],[138,122],[129,117],[122,112]]);
    if(neck) ids[p]=0;
    else if(r>60 && g>r*.43 && g<r*.85 && b<g*.55) ids[p]=4;
    else if(!(r>g*1.6 && r>b*1.8)) ids[p]=0;
  }
  // Color-assisted selection is restricted to the authored material contour.
  // This protects the bare fingers that interleave the rear wraps.
  if(ids[p]===2 && (r-b>100 || Math.max(r,g,b)-Math.min(r,g,b)>105)) ids[p]=0;
  if(ids[p]===3 && !(r>55 && g>r*.27 && g<r*.85 && b<r*.27)) ids[p]=0;
}
const colors = [[0,0,0],[72,196,237],[228,124,219],[124,205,113],[244,179,75]];
// Nonlinear, multi-stop ramps retain deep creases and give ivory warm highlights.
const ramps = {
  1: [[18,'111018'],[50,'37302f'],[85,'716459'],[120,'a49882'],[160,'c9bea5'],[200,'e5dcc5'],[240,'fff2dc'],[255,'fff9ed']],
  2: [[20,'190f18'],[60,'400f1d'],[105,'741626'],[150,'a52535'],[195,'cf3944'],[235,'ed605b'],[255,'ff8974']],
  3: [[20,'1b1019'],[65,'4f1020'],[110,'841829'],[160,'b52637'],[210,'df3c43'],[255,'ff6559']],
  4: [[15,'101018'],[60,'191923'],[110,'292832'],[165,'3c3b43'],[215,'55515a'],[255,'716a70']],
};
function mapped(value,stops) {
  let j=1; while(j<stops.length-1 && value>stops[j][0]) j++;
  const a=stops[j-1], b=stops[j], t=Math.max(0,Math.min(1,(value-a[0])/(b[0]-a[0])));
  return [0,2,4].map(k=>Math.round(parseInt(a[1].slice(k,k+2),16)*(1-t)+parseInt(b[1].slice(k,k+2),16)*t));
}
const result=Buffer.from(data),mask=Buffer.alloc(data.length),overlay=Buffer.from(data);
let changed=0,protectedChanged=0;
const counts={};
for(let p=0;p<ids.length;p++) {
  const i=p*4,id=ids[p];
  if(!id) continue;
  counts[id]=(counts[id]||0)+1;
  for(let c=0;c<3;c++) { mask[i+c]=colors[id][c]; overlay[i+c]=Math.round(data[i+c]*.3+colors[id][c]*.7); }
  mask[i+3]=data[i+3];
  const value=Math.max(...data.subarray(i,i+3));
  // Preserve near-black line work exactly; recolor shading above it continuously.
  if(value<=25) continue;
  const rgb=mapped(value,ramps[id]);
  rgb.forEach((v,c)=>result[i+c]=v);
  changed++;
}
for(let p=0;p<ids.length;p++) {
  const i=p*4;
  if(result[i+3]!==data[i+3]) throw new Error('Alpha changed');
  if(!ids[p] && !result.subarray(i,i+4).equals(data.subarray(i,i+4))) protectedChanged++;
}
if(protectedChanged) throw new Error('Unmasked pixels changed');
const encode=buffer=>sharp(buffer,{raw:{width,height,channels:4}}).png();
await encode(data).toFile(`${out}/taiko-original.png`);
await encode(result).toFile(`${out}/taiko-masked-alternate.png`);
await encode(mask).toFile(`${out}/taiko-material-mask.png`);
await encode(overlay).toFile(`${out}/taiko-mask-overlay.png`);
writeFileSync(`${out}/regions.json`,JSON.stringify({source,regions,ramps},null,2));
writeFileSync(`${out}/contours.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="192" height="240" viewBox="0 0 192 240">${regions.map(r=>`<polygon id="${r.name}" points="${r.points.map(p=>p.join(',')).join(' ')}" fill="${r.color}"/>`).join('')}</svg>`);
const panels = await Promise.all([data,result,overlay].map(buffer=>encode(buffer).flatten({background:'#454859'}).resize(576,720,{kernel:'nearest'}).toBuffer()));
await sharp({create:{width:1728,height:720,channels:3,background:'#454859'}}).composite(panels.map((input,i)=>({input,left:i*576,top:0}))).png().toFile(`${out}/comparison.png`);
writeFileSync(`${out}/audit.json`,JSON.stringify({source,size:[width,height],changed,protectedChanged,alphaUnchanged:true,materialPixels:counts},null,2));
writeFileSync(`${out}/preview.html`,`<!doctype html><meta charset="utf-8"><title>Taiko · masked palette study</title><style>body{background:#171824;color:#f7efdf;font:16px system-ui;margin:32px}main{display:flex;gap:24px;flex-wrap:wrap}img{width:384px;height:480px;image-rendering:pixelated;background:#454859}p{max-width:850px;line-height:1.6}button{padding:10px 16px;cursor:pointer}</style><h1>Taiko · masked palette study</h1><p>Single rest portrait. Ivory tunic, crimson wraps/headband, charcoal trim. Original pixels outside the material mask stay identical. Breathing in the game uses a shader on this single image; this static study isolates recolor quality.</p><main>${[['Original','taiko-original.png'],['Masked alternate','taiko-masked-alternate.png'],['Material boundaries','taiko-mask-overlay.png']].map(([name,file])=>`<section><h2>${name}</h2><img src="${file}" alt="${name}"></section>`).join('')}</main><p>Cyan: tunic · Pink: wraps · Green: headband · Gold: trim/belt. First contour pass; inspect boundaries around fingers, face, shoulder, stitching and sash.</p>`);
console.log(JSON.stringify({out,changed,protectedChanged,counts}));
