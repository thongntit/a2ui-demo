import {test} from 'node:test';
import assert from 'node:assert/strict';
import {listingURL,normalizeAd,normalizeQuery,fetchListings} from '../lib/adlisting.mjs';
test('real listing request maps repository query conventions',()=>{
 const u=listingURL({category:'phone',q:'iPhone',maxPrice:15000000,f:'p',contain_videos:true,sort:'price',region:13000});
 assert.equal(u.origin,'https://gateway.chotot.com');assert.equal(u.pathname,'/v1/public/ad-listing');
 for(const [k,v] of Object.entries({cg:'5010',region_v2:'13000',q:'iPhone',price:'1-15000000',f:'p',contain_videos:'1',sp:'1'}))assert.equal(u.searchParams.get(k),v);
 assert.equal(listingURL({category:'laptop'}).searchParams.get('cg'),'5030');assert.equal(listingURL({category:'motorbike'}).searchParams.get('cg'),'2020');
});
test('normalization whitelists records, excludes contact data and interprets video enum',()=>{
 const ad=normalizeAd({list_id:1,subject:'Laptop',category:5030,price:100,company_ad:true,contain_videos:2,phone:'private',detail_address:'private',image:'javascript:alert(1)'});
 assert.equal(ad.category,'laptop');assert.equal(ad.account_type,'c');assert.equal(ad.contain_videos,false);assert.equal(ad.image,'');assert.equal(ad.phone,undefined);assert.equal(ad.detail_address,undefined);
 assert.equal(normalizeAd({list_id:2,subject:'Phone',contain_videos:1}).contain_videos,true);
});
test('invalid search intents are rejected before network access',()=>{
 assert.throws(()=>normalizeQuery({category:'unknown'}));assert.throws(()=>normalizeQuery({maxPrice:-1}));assert.throws(()=>normalizeQuery({region:-1}));assert.throws(()=>normalizeQuery({f:'admin'}));
 assert.throws(()=>normalizeQuery({category:'constructor'}));
});
test('backend failure is propagated without substituting sample listings',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('Unavailable',{status:503}));
 await assert.rejects(fetchListings({category:'phone'},new AbortController().signal),/HTTP 503/);
});
