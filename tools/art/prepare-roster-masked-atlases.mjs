// Fixed material-mask previews for Riot and Anchor; production artwork stays untouched.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const sharp=createRequire(import.meta.url)(process.env.RPS_SHARP_PATH||'sharp');
const root='art/fighters/mask-study-v1';
const names=['idle0','idle1','rock','paper','scissors','hurt','ko','win','kick'];
const colors=[[0,0,0],[72,196,237],[228,124,219],[124,205,113],[244,179,75],[155,145,245]];
const inside=(x,y,points)=>{
  let hit=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[i],b=points[j];
    if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
  }
  return hit;
};
const inRect=(x,y,r)=>x>=r[0]&&x<=r[2]&&y>=r[1]&&y<=r[3];
const baseHair=[[65,74],[68,66],[73,62],[77,58],[86,56],[93,57],[98,56],[99,61],[104,64],[104,69],[101,75],[96,76],[95,69],[91,70],[86,74],[81,77],[78,80],[70,80]];
const riotHair={
  idle0:baseHair,idle1:baseHair,rock:baseHair,
  paper:[[59,80],[64,73],[63,69],[71,67],[76,64],[84,62],[89,63],[92,68],[94,72],[91,77],[87,78],[84,75],[79,79],[75,84],[69,87],[62,86]],
  scissors:[[63,80],[67,74],[65,69],[72,66],[77,63],[86,62],[94,63],[97,66],[100,69],[101,75],[97,79],[93,78],[92,73],[87,76],[82,81],[78,85],[69,85]],
  hurt:[[32,86],[37,78],[40,73],[46,68],[51,65],[57,66],[61,69],[65,73],[65,78],[60,76],[57,79],[52,84],[51,89],[48,94],[39,94],[33,92]],
  ko:[[23,150],[27,142],[26,136],[33,134],[38,132],[43,134],[46,137],[43,141],[40,145],[43,151],[48,154],[43,157],[33,158],[27,155]],
  win:[[62,80],[67,75],[66,71],[70,66],[76,64],[84,63],[90,65],[94,68],[96,73],[93,80],[89,81],[88,75],[83,77],[79,82],[76,87],[69,86]],
  kick:[[18,84],[23,79],[22,75],[29,72],[34,70],[40,69],[47,70],[50,74],[54,76],[54,81],[51,85],[47,84],[46,79],[42,81],[38,85],[34,89],[25,91],[20,89]],
};
const headRects=[[42,42,98,77],[42,42,98,77],[42,42,98,77],[40,40,92,79],[43,48,99,87],[16,48,66,99],[7,129,54,159],[38,40,100,80],[20,56,68,94]];
const tankRects=[[68,75,95,96],[68,75,95,96],[68,75,95,96],[65,73,93,97],[67,78,98,100],[55,78,82,107],[49,137,82,153],[69,74,96,91],[47,83,74,106]];
const anchorWrists=[[[58,77,80,97],[101,76,119,96]],[[58,77,80,97],[101,76,119,96]],[[58,77,80,97],[113,63,129,78]],[[84,63,104,82]],[[107,77,124,94]],[[47,83,67,104],[86,69,102,86]],[[75,140,90,157]],[[53,31,72,57],[100,86,116,103]],[[37,80,53,103],[64,75,78,90]]];
// The fallen pose's hand overlaps orange trousers; its darkest skin shades share
// the fabric hue, so this skin boundary must stop selection growth explicitly.
const koArm=[[48,140],[58,139],[67,141],[78,142],[87,142],[93,142],[98,144],[100,148],[99,152],[94,154],[87,154],[80,153],[63,155],[53,152],[48,147]];
const pantsRegions={
  idle0:[[43,100],[93,99],[116,126],[115,138],[99,139],[87,127],[78,119],[68,127],[57,139],[37,138],[37,126]],
  idle1:[[43,100],[93,99],[116,126],[115,138],[99,139],[87,127],[78,119],[68,127],[57,139],[37,138],[37,126]],
  rock:[[43,100],[93,99],[116,126],[115,138],[99,139],[87,127],[78,119],[68,127],[57,139],[37,138],[37,126]],
  paper:[[43,101],[94,99],[117,127],[115,138],[99,140],[87,127],[78,119],[68,128],[57,139],[36,139],[36,126]],
  scissors:[[43,103],[93,102],[117,129],[115,138],[99,140],[87,128],[78,121],[68,129],[57,140],[36,139],[36,127]],
  hurt:[[54,107],[81,98],[100,108],[113,121],[111,137],[99,140],[87,130],[82,120],[75,120],[67,135],[55,144],[48,144],[48,128]],
  ko:[[72,135],[109,136],[125,142],[125,156],[102,158],[77,154]],
  win:[[53,95],[88,95],[111,126],[110,139],[99,143],[86,132],[77,124],[68,131],[59,140],[38,140],[38,128]],
  kick:[[46,101],[67,96],[84,88],[119,82],[126,89],[110,101],[87,109],[74,118],[65,136],[56,141],[45,140],[43,130]],
};
function mapShade(value,stops){
  let j=1;while(j<stops.length-1&&value>stops[j][0])j++;
  const a=stops[j-1],b=stops[j],t=Math.max(0,Math.min(1,(value-a[0])/(b[0]-a[0])));
  return [0,2,4].map(k=>Math.round(parseInt(a[1].slice(k,k+2),16)*(1-t)+parseInt(b[1].slice(k,k+2),16)*t));
}
const configs={
  riot:{description:'Blue jacket, skirt and shoe accents; white top and buckle; blonde hair. Skin, gloves, leggings and original white trim stay separate.',
    legend:'Cyan: purple fabric → blue · Pink: gold fabric → white · Green: hair → blonde',
    ramps:{
      1:[[20,'091326'],[55,'152957'],[100,'224681'],[145,'3264ac'],[195,'4b86ca'],[235,'73a8e2'],[255,'a4ccf1']],
      2:[[40,'3b3940'],[90,'736f72'],[140,'aaa39c'],[190,'d4cdc0'],[230,'eee7d9'],[255,'fff8ea']],
      3:[[18,'241b1b'],[35,'594026'],[60,'956136'],[85,'ca9954'],[110,'e8c279'],[145,'ffe4a3'],[180,'fff0c6']],
    }},
  anchor:{description:'Olive trousers, mustard vest and tank, steel-blue hair, charcoal wrist wraps and buckle. Skin, boots, knee patches and original linework stay separate.',
    legend:'Cyan: trousers → olive · Pink: vest/tank → mustard · Green: hair → steel blue · Gold: wraps/buckle → charcoal · Lavender: hair tie → mustard',
    ramps:{
      1:[[30,'1d2319'],[75,'343c23'],[120,'4b5730'],[170,'68753e'],[215,'84924f'],[255,'a5ad68']],
      2:[[15,'2b2518'],[35,'5b4618'],[60,'927124'],[95,'c49c36'],[125,'dfb94d'],[165,'f2d477'],[220,'ffecac']],
      3:[[8,'101825'],[20,'22354e'],[35,'3d5b7c'],[50,'6183a5'],[75,'91b2cc'],[110,'b9d4e3']],
      4:[[40,'080b12'],[100,'121822'],[165,'222b36'],[215,'35414e'],[255,'4c5b68']],
      5:[[40,'463515'],[100,'856322'],[165,'ba9637'],[220,'e0bf55'],[255,'f4d77d']],
    }},
};
for(const character of ['riot','anchor']){
  const config=configs[character],out=`${root}/${character}`;
  mkdirSync(out,{recursive:true});
  const atlas=JSON.parse(readFileSync(`apps/game/public/assets/${character}.json`));
  const {data,info}=await sharp(`apps/game/public/assets/${character}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width,height}=info,mask=Buffer.alloc(data.length);
  for(const [pose,{frame:f}]of Object.entries(atlas.frames)){
    const index=names.indexOf(pose);
    if(index<0)throw new Error(`Unknown frame: ${pose}`);
    for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++){
      const i=((f.y+y)*width+f.x+x)*4,[r,g,b,a]=data.subarray(i,i+4);
      if(!a)continue;
      const high=Math.max(r,g,b),low=Math.min(r,g,b),chroma=high-low,saturation=high?chroma/high:0;
      let hue=chroma?60*(high===r?(g-b)/chroma:high===g?(b-r)/chroma+2:(r-g)/chroma+4):0;
      hue=(hue+360)%360;
      let id=0;
      if(character==='riot'){
        if(saturation>.35&&high>22&&hue>=250&&hue<=310)id=1;
        if(saturation>.55&&hue>=32&&hue<=68&&b<g*.45)id=2;
        if(inside(x+.5,y+.5,riotHair[pose])&&r>20&&r<180&&r>g*1.32&&g>b*.9)id=3;
      }else{
        if(inside(x+.5,y+.5,pantsRegions[pose])&&high>35&&saturation>.78&&hue<=20)id=1;
        if(high>45&&saturation>.45&&hue>=180&&hue<=225)id=2;
        if(inRect(x,y,tankRects[index])&&high>=26&&high<105&&saturation<.45)id=2;
        if(inRect(x,y,headRects[index])&&high>14&&high<110&&b>r*1.15&&b>=g&&saturation>.15)id=3;
        if(high>70&&low>50&&saturation<.38&&anchorWrists[index].some(rect=>inRect(x,y,rect)))id=4;
        if(saturation>.65&&hue>=32&&hue<=65&&b<g*.5&&(high>90||inRect(x,y,headRects[index])))id=(pose==='ko'?x<61:y<(pose==='win'?90:94))?5:4;
        if(pose==='ko'&&inRect(x,y,[65,134,77,142])&&hue>=22&&hue<=68&&saturation>.55&&b<g*.6)id=4;
        if(pose==='ko'&&id===1&&inside(x+.5,y+.5,koArm))id=0;
      }
      if(id){colors[id].forEach((v,c)=>mask[i+c]=v);mask[i+3]=255;}
    }
  }
  if(character==='anchor'){
    // Grow the trouser selection along connected orange edge pixels. Black ink
    // and knee patches stop the fill; the original contours supply the seeds.
    const queue=[];
    for(let p=0;p<width*height;p++)if(mask[p*4+3]&&mask[p*4]===colors[1][0])queue.push(p);
    for(let head=0;head<queue.length;head++){
      const p=queue[head],px=p%width,py=Math.floor(p/width);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const x=px+dx,y=py+dy;
        if(x<0||x>=width||y<0||y>=height||Math.floor(x/160)!==Math.floor(px/160)||Math.floor(y/160)!==Math.floor(py/160))continue;
        const n=y*width+x,i=n*4;
        if(mask[i+3]||!data[i+3])continue;
        if(x<160&&y>=320&&inside(x+.5,y-320+.5,koArm))continue;
        const [r,g,b]=data.subarray(i,i+3),hi=Math.max(r,g,b),lo=Math.min(r,g,b);
        if(r!==hi||hi<35||(hi-lo)/hi<.78)continue;
        const hue=60*(g-b)/(hi-lo);
        if(hue<0||hue>22)continue;
        colors[1].forEach((v,c)=>mask[i+c]=v);mask[i+3]=255;queue.push(n);
      }
    }
  }
  if(process.argv.includes('--render-only')){
    const saved=await sharp(`${out}/${character}-material-mask.png`).ensureAlpha().raw().toBuffer();
    if(saved.length!==mask.length)throw new Error('Mask dimensions differ');saved.copy(mask);
  }else await sharp(mask,{raw:{width,height,channels:4}}).png().toFile(`${out}/${character}-material-mask.png`);
  const result=Buffer.from(data),overlay=Buffer.from(data);
  for(let i=0;i<data.length;i+=4){
    if(!mask[i+3])continue;
    const id=colors.findIndex(rgb=>rgb.every((v,c)=>mask[i+c]===v));
    if(!config.ramps[id])throw new Error('Invalid material color');
    const mapped=mapShade(Math.max(...data.subarray(i,i+3)),config.ramps[id]);
    mapped.forEach((v,c)=>result[i+c]=v);
    colors[id].forEach((v,c)=>overlay[i+c]=Math.round(data[i+c]*.25+v*.75));
  }
  const audit=[];
  for(const [pose,{frame:f}]of Object.entries(atlas.frames)){
    let changed=0,outsideChanges=0,alphaChanges=0;const materials={};
    for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++){
      const i=((f.y+y)*width+f.x+x)*4,different=!data.subarray(i,i+4).equals(result.subarray(i,i+4));
      if(different)changed++;
      if(different&&!mask[i+3])outsideChanges++;
      if(data[i+3]!==result[i+3])alphaChanges++;
      if(mask[i+3]){const id=colors.findIndex(rgb=>rgb.every((v,c)=>mask[i+c]===v));materials[id]=(materials[id]||0)+1;}
    }
    if(outsideChanges||alphaChanges)throw new Error(`${character}/${pose}: containment failure`);
    audit.push({pose,changed,outsideChanges,alphaChanges,materials});
  }
  const png=buffer=>sharp(buffer,{raw:{width,height,channels:4}}).png();
  await png(data).toFile(`${out}/${character}-original-atlas.png`);
  await png(result).toFile(`${out}/${character}-masked-atlas.png`);
  await png(overlay).toFile(`${out}/${character}-overlay.png`);
  await png(result).flatten({background:'#454859'}).resize(1440,1440,{kernel:'nearest'}).toFile(`${out}/all-frames-3x.png`);
  const panels=[];
  for(const [pose,{frame:f}]of Object.entries(atlas.frames)){
    const row=panels.length/3;
    for(const [col,buffer]of [data,result,overlay].entries()){
      const input=await png(buffer).extract({left:f.x,top:f.y,width:f.w,height:f.h}).flatten({background:'#454859'}).resize(480,480,{kernel:'nearest'}).toBuffer();
      panels.push({input,left:col*480,top:row*480});
    }
    await png(result).extract({left:f.x,top:f.y,width:f.w,height:f.h}).toFile(`${out}/${pose}-alternate.png`);
  }
  await sharp({create:{width:1440,height:4320,channels:3,background:'#454859'}}).composite(panels).png().toFile(`${out}/all-frames-comparison.png`);
  for(let k=0;k<3;k++)await sharp(`${out}/all-frames-comparison.png`).extract({left:0,top:k*1440,width:1440,height:1440}).toFile(`${out}/review-${k}.png`);
  const details=[];
  for(const [col,buffer]of [data,result,overlay].entries()){
    const input=await png(buffer).extract({left:30,top:38,width:100,height:120}).flatten({background:'#454859'}).resize(300,360,{kernel:'nearest'}).toBuffer();
    details.push({input,left:col*300,top:0});
  }
  await sharp({create:{width:900,height:360,channels:3,background:'#454859'}}).composite(details).png().toFile(`${out}/idle-comparison.png`);
  writeFileSync(`${out}/audit.json`,JSON.stringify({character,size:[width,height],palette:config.ramps,frames:audit},null,2));
  writeFileSync(`${out}/authoring.json`,JSON.stringify({riotHair,headRects,tankRects,anchorWrists,pantsRegions,koArm,palette:config.ramps},null,2));
  const title=character[0].toUpperCase()+character.slice(1);
  writeFileSync(`${out}/preview.html`,`<!doctype html><meta charset="utf-8"><title>${title} · masked combat palette</title><style>body{background:#191a25;color:#f5efdf;font:16px system-ui;margin:24px}a{color:#9acef5;margin-right:20px}main{display:flex;gap:24px;flex-wrap:wrap}canvas,img{image-rendering:pixelated;background:#454859}canvas{width:480px;height:480px}button{padding:9px 14px;margin:4px}section{margin:20px 0}.review{width:min(100%,960px)}p{max-width:960px;line-height:1.5}</style><nav><a href="../preview.html">Taiko</a><a href="../riot/preview.html">Riot</a><a href="../anchor/preview.html">Anchor</a></nav><h1>${title} · complete masked combat palette</h1><p>${config.description}</p><p>${config.legend}</p><div id="buttons"></div><button id="scale">Show native size</button><main><section><h2>Original</h2><canvas id="original" width="160" height="160"></canvas></section><section><h2>Masked alternate</h2><canvas id="alternate" width="160" height="160"></canvas></section><section><h2>Material mask overlay</h2><canvas id="overlay" width="160" height="160"></canvas></section></main><p id="label"></p><h2>All frames · original / alternate / overlay</h2><img class="review" src="all-frames-comparison.png" alt="All nine poses"><script>const frames=${JSON.stringify(Object.fromEntries(Object.entries(atlas.frames).map(([name,{frame}])=>[name,frame])))},images={};let selected='idle',start=performance.now(),native=false;for(const [id,url]of Object.entries({original:'${character}-original-atlas.png',alternate:'${character}-masked-atlas.png',overlay:'${character}-overlay.png'})){const image=new Image();image.src=url;images[id]=image;}for(const name of ['idle',...Object.keys(frames)]){const b=document.createElement('button');b.textContent=name;b.onclick=()=>{selected=name;start=performance.now()};document.getElementById('buttons').append(b)}document.getElementById('scale').onclick=()=>{native=!native;for(const c of document.querySelectorAll('canvas')){c.style.width=c.style.height=(native?160:480)+'px'}document.getElementById('scale').textContent=native?'Show enlarged':'Show native size'};function draw(now){const name=selected==='idle'?(Math.floor((now-start)/350)%2?'idle1':'idle0'):selected,f=frames[name];for(const[id,image]of Object.entries(images)){const c=document.getElementById(id).getContext('2d');c.clearRect(0,0,160,160);if(image.complete&&image.naturalWidth)c.drawImage(image,f.x,f.y,160,160,0,0,160,160)}document.getElementById('label').textContent=name;requestAnimationFrame(draw)}requestAnimationFrame(draw);</script>`);
  console.log(JSON.stringify({character,frames:audit}));
}
const taikoPreview=`${root}/preview.html`;
const taikoHtml=readFileSync(taikoPreview,'utf8');
if(!taikoHtml.includes('data-roster-nav'))writeFileSync(taikoPreview,taikoHtml.replace('<h1>', '<nav data-roster-nav><a style="color:#9acef5;margin-right:20px" href="preview.html">Taiko</a><a style="color:#9acef5;margin-right:20px" href="riot/preview.html">Riot</a><a style="color:#9acef5" href="anchor/preview.html">Anchor</a></nav><h1>'));
