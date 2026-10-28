import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
const folder=resolve('art/portraits/generated-alternates-v1');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1450,height:920}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(`${folder}/preview.html`).href);
  for(const id of ['taiko','riot','anchor']){
    await page.getByRole('button',{name:id.toUpperCase(),exact:true}).click();
    await page.waitForFunction(id=>[...document.querySelectorAll('main img')].every(img=>img.complete&&img.naturalWidth===192&&img.src.includes(id)),id);
    await page.screenshot({path:`${folder}/${id}-browser-review.png`});
  }
  await page.getByRole('button',{name:'Show native game size',exact:true}).click();
  if(await page.locator('main img').first().evaluate(img=>img.getBoundingClientRect().width)!==192)throw new Error('Native toggle failed');
  if(errors.length)throw new Error(errors.join('\n'));
  const report={characters:3,imageLoadingPassed:true,selectorsPassed:true,nativeSizePassed:true,pageErrors:errors};
  writeFileSync(`${folder}/browser-audit.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
}finally{await browser.close();}
