// Package image_gen edits for review; no recoloring or geometry correction occurs here.
import { createRequire } from 'node:module';
import { readFileSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.env.RPS_SHARP_PATH||'sharp');
const folder='art/portraits/generated-alternates-v1',audit=[];
for(const id of ['taiko','riot','anchor']){
  const source=`apps/game/public/assets/menus/action/${id}-sheet.png`;
  const atlas=JSON.parse(readFileSync(source.replace('.png','.json'))),f=atlas.frames.rest.frame;
  const sourceFrame=await sharp(source).extract({left:f.x,top:f.y,width:f.w,height:f.h}).ensureAlpha().raw().toBuffer();
  const original=await sharp(`${folder}/${id}-original.png`).ensureAlpha().raw().toBuffer();
  if(!sourceFrame.equals(original))throw new Error('Original is not the installed rest frame');
  const metadata=await sharp(`${folder}/${id}-generated.png`).metadata();
  if(!metadata.hasAlpha)throw new Error('Generated image has no alpha');
  const native=await sharp(`${folder}/${id}-generated.png`).resize(f.w,f.h,{fit:'fill',kernel:'nearest'}).ensureAlpha().raw().toBuffer();
  const raw={width:f.w,height:f.h,channels:4};
  await sharp(native,{raw}).png().toFile(`${folder}/${id}-alternate-native.png`);
  let union=0,intersection=0,originalOnly=0,generatedOnly=0,transparent=0;
  const edgeOverlay=Buffer.alloc(native.length);
  for(let p=0;p<f.w*f.h;p++){
    const i=p*4,a=original[i+3]>=128,b=native[i+3]>=128;
    if(a||b)union++;
    if(a&&b)intersection++;
    if(a&&!b)originalOnly++;
    if(b&&!a)generatedOnly++;
    if(!native[i+3])transparent++;
    if(a||b){const rgb=a&&b?[115,127,142]:a?[43,209,240]:[255,83,126];rgb.forEach((v,c)=>edgeOverlay[i+c]=v);edgeOverlay[i+3]=255;}
  }
  if(!transparent)throw new Error('No transparent margins');
  const panels=[];
  for(const [index,data]of [original,native,edgeOverlay].entries()){
    panels.push({input:await sharp(data,{raw}).flatten({background:'#454859'}).resize(576,720,{kernel:'nearest'}).png().toBuffer(),left:index*576,top:0});
  }
  await sharp({create:{width:1728,height:720,channels:3,background:'#454859'}}).composite(panels).png().toFile(`${folder}/${id}-comparison.png`);
  await sharp(edgeOverlay,{raw}).png().toFile(`${folder}/${id}-silhouette-comparison.png`);
  audit.push({id,source,sourceFrame:'rest',frame:f,sourceSha256:createHash('sha256').update(sourceFrame).digest('hex'),originalMatchesInstalledRest:true,generatedDimensions:[metadata.width,metadata.height],nativeDimensions:[f.w,f.h],alphaThresholdForComparison:128,silhouetteIoU:intersection/union,originalOnly,generatedOnly,fullyTransparentNativePixels:transparent});
}
writeFileSync(`${folder}/audit.json`,JSON.stringify(audit,null,2));
writeFileSync(`${folder}/preview.html`,`<!doctype html><meta charset="utf-8"><title>Generated alternate portraits · review</title><style>body{background:#191a25;color:#f5efdf;font:16px system-ui;margin:24px}p{max-width:1050px;line-height:1.5}main{display:flex;gap:24px;flex-wrap:wrap}img{background:#454859;image-rendering:pixelated;width:384px;height:480px}button{padding:10px 16px;margin:8px;cursor:pointer}a{color:#9acef5}.small img{width:192px;height:240px}h1{margin-bottom:8px}</style><h1>Generated alternate portraits</h1><p>Reference-based image edits of the exact <b>rest</b> frames used by Victory, Home, character selection and Versus. No inhale/exhale frame is used. Original pose and registration were requested; these are generated variations, so small drawing differences remain possible. Live game artwork has not been replaced.</p><button id="scale">Show native game size</button><div id="characters"></div><main><section><h2>Original</h2><img id="original" alt="Installed original rest portrait"></section><section><h2>Generated alternate</h2><img id="alternate" alt="Generated alternate at native registration"></section><section><h2>Silhouette comparison</h2><img id="silhouette" alt="Silhouette comparison"></section></main><p id="metric"></p><p>Gray: overlapping silhouette · Cyan: original only · Pink: generated only. Overlap measures silhouette, not the identity or accuracy of interior facial/hand details.</p><script>const audit=${JSON.stringify(audit)};function show(id){original.src=id+'-original.png';alternate.src=id+'-alternate-native.png';silhouette.src=id+'-silhouette-comparison.png';const row=audit.find(row=>row.id===id);document.getElementById('metric').textContent=id.toUpperCase()+' · silhouette overlap '+(row.silhouetteIoU*100).toFixed(1)+'% · original rest frame '+row.frame.w+' × '+row.frame.h;}for(const id of ['taiko','riot','anchor']){const button=document.createElement('button');button.textContent=id.toUpperCase();button.onclick=()=>show(id);document.getElementById('characters').append(button)}document.getElementById('scale').onclick=()=>{document.body.classList.toggle('small');document.getElementById('scale').textContent=document.body.classList.contains('small')?'Show enlarged':'Show native game size'};show('taiko');</script>`);
console.log(JSON.stringify(audit));
