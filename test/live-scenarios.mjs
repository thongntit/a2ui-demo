import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:3000');
 const state=async()=>JSON.parse(await page.locator('#state').textContent()).dataModel;
 async function run(prompt){await page.locator('#prompt').fill(prompt);await page.getByRole('button',{name:'Send request'}).click();await page.waitForFunction(()=>['Updated','Request failed'].includes(document.querySelector('#status').textContent),{},{timeout:180000});assert.equal(await page.locator('#status').textContent(),'Updated',await page.locator('#chat').textContent());return state();}
 const videos=await run('Tìm xe máy cá nhân bán, có video ở TP.HCM');
 assert.ok(videos.ads.length>0);assert.equal(videos.query.category,'motorbike');assert.equal(videos.query.f,'p');assert.equal(videos.query.contain_videos,true);assert.ok(videos.ads.every(a=>a.account_type==='p'&&a.contain_videos&&a.category==='motorbike'));
 const comparison=await run('So sánh hai laptop rẻ nhất ở TP.HCM');
 assert.equal(comparison.query.category,'laptop');assert.equal(comparison.query.sort,'price');assert.ok(comparison.ads.length>=2);assert.equal(await page.locator('.comparison .ad-card').count(),2);assert.deepEqual(await page.locator('.comparison .ad-card').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.listId))),comparison.ads.slice(0,2).map(a=>a.list_id));
 const empty=await run('Tìm laptop với từ khóa zzxa2uinoresults997');assert.equal(empty.ads.length,0);assert.equal(await page.locator('.ad-card').count(),0);
 await page.waitForFunction(()=>['state','trace'].every(id=>{const e=document.getElementById(id);return e.scrollHeight-e.clientHeight-e.scrollTop<2;}));
 await page.getByRole('tab',{name:'Trace explained'}).click();assert.equal(await page.locator('#scenario-steps button').count(),6);await page.locator('#scenario-steps button').last().click();assert.equal(await page.locator('.scenario-card').count(),2);
 await page.getByRole('tab',{name:'Specs & tradeoffs'}).click();await page.keyboard.press('p');
 for(let i=0;i<9;i++){assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight),'Presentation slide must fit');if(i<8)await page.locator('#slide-next').click();}
 await page.keyboard.press('Escape');await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 console.log('Live private/video search, ordered comparison, no results, auto-scroll, walkthrough, nine slides, and mobile passed.');
}finally{await browser.close();}
