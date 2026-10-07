import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();
 await page.goto('http://localhost:3000');
 await page.evaluate(()=>{
  window.renderEvents=[];
  new MutationObserver(()=>{const count=document.querySelectorAll('.ad-card').length,status=document.querySelector('#status').textContent;window.renderEvents.push({ms:performance.now(),count,status});}).observe(document.querySelector('#surface'),{childList:true,subtree:true});
 });
 await page.getByRole('button',{name:'iPhone dưới 15 triệu',exact:true}).click();
 await page.waitForFunction(()=>['Updated','Request failed'].includes(document.querySelector('#status').textContent),{},{timeout:130000});
 assert.equal(await page.locator('#status').textContent(),'Updated',await page.locator('#chat').textContent());
 const events=await page.evaluate(()=>window.renderEvents);
 assert.ok(events.some(e=>e.count===1&&e.status.startsWith('Streaming')),'First card must appear while the stream is active');
 assert.equal(await page.locator('.ad-card').count(),2);
 console.log(JSON.stringify({timing:await page.locator('#timing').textContent(),progressiveCards:events.filter(e=>e.count&&e.status.startsWith('Streaming')).map(e=>({cards:e.count,status:e.status}))}));
 await page.screenshot({path:'test-results/streaming-desktop.png',fullPage:true});
}finally{await browser.close();}
