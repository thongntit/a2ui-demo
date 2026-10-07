import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3000');
 await page.getByRole('button',{name:'iPhone dưới 15 triệu',exact:true}).click();
 await page.waitForFunction(()=>['Updated','Request failed'].includes(document.querySelector('#status').textContent),{},{timeout:130000});
 assert.equal(await page.locator('#status').textContent(),'Updated');
 assert.equal(await page.locator('.ad-card').count(),2);
 await page.getByRole('button',{name:'Cá nhân',exact:true}).click();
 await page.waitForFunction(()=>['Updated','Request failed'].includes(document.querySelector('#status').textContent),{},{timeout:130000});
 assert.equal(await page.locator('#status').textContent(),'Updated');
 assert.equal(await page.locator('.ad-card').count(),1);
 await page.getByRole('button',{name:'Xem chi tiết',exact:true}).click();
 await page.waitForFunction(()=>['Updated','Request failed'].includes(document.querySelector('#status').textContent),{},{timeout:130000});
 assert.equal(await page.locator('#status').textContent(),'Updated');
 assert.match(await page.locator('#surface').textContent(),/Pin 89%/);
 assert.equal(await page.locator('.ad-card').count(),1);
 await page.screenshot({path:'test-results/desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:'test-results/mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('Live Codex search → filter → detail passed; mobile overflow and browser errors passed.');
}finally{await browser.close();}
