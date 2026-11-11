import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.RPS_PREVIEW_URL||'http://127.0.0.1:5196';
const out='art/review/installed-alternates';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[],errors=[];
try{
  const page=await browser.newPage({viewport:{width:1050,height:940}});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`)});
  await page.addInitScript(()=>{
    localStorage.setItem('rps-fighter.settings',JSON.stringify({muted:true,crt:false}));
  });
  for(const [id,key]of [['taiko','fighter-p1'],['riot','fighter-p2'],['anchor','fighter-anchor']]){
    await page.goto(`${base}/?menuReview=stage&fighter=${id}&stage=sunset-harbor`);
    await page.waitForFunction(()=>window.__rps?.phase()==='picking'&&!window.__rps.transitioning());
    const textures=await page.evaluate(()=>window.__rps.combatTextures());
    assert.deepEqual(textures,[key,`${key}-alternate`]);
    await page.screenshot({path:`${out}/${id}-fight.png`});
    for(const alternate of [false,true]){
      await page.goto(`${base}/?menuReview=victory&fighter=${id}${alternate?'&palette=alternate':''}`);
      await page.waitForFunction(()=>window.__rps?.scenes().includes('Result')&&!window.__rps.transitioning());
      await page.waitForTimeout(1200);
      await page.screenshot({path:`${out}/${id}-victory-${alternate?'alternate':'original'}.png`});
    }
    checks.push({id,combatTextures:textures,fightPassed:true,originalAndAlternateVictoryPassed:true});
  }
  assert.deepEqual(errors,[]);
  writeFileSync(`${out}/checks.json`,JSON.stringify({base,checks,errors},null,2));
  console.log(JSON.stringify({checks,errors}));
}finally{await browser.close();}
