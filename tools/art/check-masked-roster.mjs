import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const browser=await chromium.launch({channel:'chrome',headless:true});
const reports=[];
try{
  for(const character of ['riot','anchor']){
    const folder=resolve(`art/fighters/mask-study-v1/${character}`);
    const audit=JSON.parse(readFileSync(`${folder}/audit.json`));
    if(audit.frames.length!==9||audit.frames.some(frame=>frame.outsideChanges||frame.alphaChanges))throw new Error(`${character}: bad pixel audit`);
    const page=await browser.newPage({viewport:{width:1580,height:950}});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(pathToFileURL(`${folder}/preview.html`).href);
    await page.waitForFunction(()=>Object.values(images).every(image=>image.complete&&image.naturalWidth===480));
    for(const frame of audit.frames){
      await page.getByRole('button',{name:frame.pose,exact:true}).click();
      await page.waitForFunction(name=>document.getElementById('label').textContent===name,frame.pose);
    }
    await page.getByRole('button',{name:'Show native size',exact:true}).click();
    const native=await page.locator('canvas').first().evaluate(canvas=>canvas.getBoundingClientRect().width);
    if(native!==160)throw new Error('Native size toggle failed');
    await page.getByRole('button',{name:'Show enlarged',exact:true}).click();
    await page.getByRole('button',{name:'idle',exact:true}).click();
    await page.waitForFunction(()=>document.getElementById('label').textContent==='idle0');
    await page.waitForFunction(()=>document.getElementById('label').textContent==='idle1');
    await page.getByRole('button',{name:'idle0',exact:true}).click();
    await page.waitForFunction(()=>document.getElementById('label').textContent==='idle0');
    await page.screenshot({path:`${folder}/browser-review.png`});
    if(errors.length)throw new Error(errors.join('\n'));
    reports.push({character,framesReviewed:9,pixelAuditPassed:true,imagesLoaded:true,frameSelectorsPassed:true,idlePlaybackPassed:true,nativeTogglePassed:true,pageErrors:errors});
    await page.close();
  }
}finally{await browser.close();}
writeFileSync('art/fighters/mask-study-v1/roster-browser-audit.json',JSON.stringify(reports,null,2));
console.log(JSON.stringify(reports));
