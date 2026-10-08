// Adapted from ct-web-uni-adlisting AdListingClient and query constants.
export const categoryIds={phone:5010,laptop:5030,motorbike:2020,'':0};
export function normalizeQuery(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid search query');
 const category=input.category??'';
 if(!Object.hasOwn(categoryIds,category))throw Error('Supported categories: phone, laptop, motorbike');
 const q=typeof input.q==='string'?input.q.trim().slice(0,150):'';
 const maxPrice=Number(input.maxPrice||0);
 if(!Number.isFinite(maxPrice)||maxPrice<0||maxPrice>1e12)throw Error('Invalid maximum price');
 const f=typeof input.f==='string'?input.f:'';
 if(f&&!f.split(',').every(v=>['p','c'].includes(v)))throw Error('Invalid seller filter');
 const region=Number(input.region??13000);
 if(![0,13000].includes(region))throw Error('This demo supports Hồ Chí Minh or nationwide search');
 return {category,q,maxPrice,f,contain_videos:[true,1,'1','true'].includes(input.contain_videos),sort:input.sort==='price'?'price':'recent',region};
}
export function listingURL(query,limit=6){
 const q=normalizeQuery(query),url=new URL('/v1/public/ad-listing',process.env.ADLISTING_BASE_URL||'https://gateway.chotot.com');
 const p=url.searchParams;p.set('cg',String(categoryIds[q.category]));p.set('limit',String(limit));p.set('o','0');p.set('st','s,k');p.set('sp',q.sort==='price'?'1':q.q?'4':'0');
 if(q.region)p.set('region_v2',String(q.region));if(q.q)p.set('q',q.q);if(q.f)p.set('f',q.f);if(q.contain_videos)p.set('contain_videos','1');
 if(q.maxPrice||q.sort==='price')p.set('price',`1-${q.maxPrice||'*'}`);
 p.set('key_param_included','true');p.set('video_count_included','true');return url;
}
export function normalizeAd(a){
 if(!Number.isInteger(a.list_id)||!a.subject)throw Error('Invalid listing returned by backend');
 const category=Object.keys(categoryIds).find(k=>categoryIds[k]===Number(a.category))||'';
 let image='';try{const u=new URL(a.image||a.thumbnail_image);if(u.protocol==='https:')image=u.href;}catch{}
 return {list_id:a.list_id,subject:String(a.subject).slice(0,250),price:Number(a.price)||0,price_string:a.price_string||'',category,category_id:Number(a.category),region_name:a.region_name||'',area_name:a.area_name||'',account_type:a.company_ad?'c':'p',contain_videos:a.contain_videos===1||!!a.videos?.length,image,description:String(a.body||'').slice(0,1600),seller:String(a.account_name||a.full_name||'Người bán').slice(0,100),source:'chotot-live'};
}
async function getJSON(url,signal){
 const response=await fetch(url,{headers:{'ct-platform':'web','ct-fingerprint':'',Accept:'application/json'},signal:AbortSignal.any([signal,AbortSignal.timeout(15000)])});
 if(!response.ok)throw Error(`Chợ Tốt API returned HTTP ${response.status}`);
 return response.json();
}
export async function fetchListings(query,signal,limit=6){
 const url=listingURL(query,limit);const data=await getJSON(url,signal);
 if(!Array.isArray(data.ads))throw Error('Listing API did not return an ads array');
 return {ads:data.ads.map(normalizeAd),total:Number(data.total)||0,url:url.href};
}
export async function fetchDetail(id,signal){
 if(!Number.isInteger(id)||id<=0)throw Error('Invalid listing ID');
 const url=new URL(`/v2/public/ad-listing/${id}`,process.env.ADLISTING_BASE_URL||'https://gateway.chotot.com');url.searchParams.set('include_expired_ads','false');
 const data=await getJSON(url,signal);if(!data.ad)throw Error('Listing is unavailable');
 return {ads:[normalizeAd(data.ad)],total:1,url:url.href};
}
