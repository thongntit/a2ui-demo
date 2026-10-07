import {toggleAccountType,toggleVideoFilter,isVideoSelected,isAccountTypeSelected} from './filterTagParams.js';
import {initWalkthrough} from './walkthrough.js';
const $=s=>document.querySelector(s);
const tabs=[...document.querySelectorAll('[role="tab"]')];
function selectTab(tab){for(const t of tabs){const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!active;}document.body.dataset.view=tab.id.replace('-tab','');}
for(const tab of tabs){tab.onclick=()=>selectTab(tab);tab.onkeydown=e=>{const i=tabs.indexOf(tab);let target;if(e.key==='ArrowRight')target=tabs[(i+1)%tabs.length];if(e.key==='ArrowLeft')target=tabs[(i+tabs.length-1)%tabs.length];if(e.key==='Home')target=tabs[0];if(e.key==='End')target=tabs.at(-1);if(target){e.preventDefault();selectTab(target);target.focus();}};}
let presenting=false,slide=0;
const slideTitles=['What is A2UI?','The building blocks','From agent to interface','One request, many UI updates','Two approaches to agent UI','Payload & rendering','Streaming & trust','Pros & cons','How they fit together'];
function showSlide(next){slide=Math.max(0,Math.min(slideTitles.length-1,next));$('#compare-panel').dataset.slide=slide;$('#compare-panel').dataset.comparisonSlide=slide-4;$('#slide-label').textContent=`${String(slide+1).padStart(2,'0')} / ${String(slideTitles.length).padStart(2,'0')} · ${slideTitles[slide]}`;$('#slide-prev').disabled=slide===0;$('#slide-next').disabled=slide===slideTitles.length-1;$('.comparison-intro h2').textContent=presenting?slideTitles[slide]:'A2UI vs MCP Apps';}
function presentation(active){presenting=active;document.body.classList.toggle('presenting',active);$('#present').setAttribute('aria-pressed',String(active));$('#present').textContent=active?'Exit presentation':'Present ↗';$('.slide-controls').hidden=!active;showSlide(slide);if(!active&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});}
$('#present').onclick=()=>{presentation(!presenting);if(presenting&&!document.fullscreenElement)document.documentElement.requestFullscreen?.().catch(()=>{});};
$('#slide-prev').onclick=()=>showSlide(slide-1);$('#slide-next').onclick=()=>showSlide(slide+1);
document.addEventListener('keydown',e=>{if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,textarea,select,[contenteditable]'))return;if(e.key.toLowerCase()==='p'){e.preventDefault();presentation(!presenting);}if(e.key==='Escape'&&presenting)presentation(false);if(presenting&&!$('#compare-panel').hidden&&!e.target.closest('[role=tab]')){if(e.key==='ArrowRight'){e.preventDefault();showSlide(slide+1);}if(e.key==='ArrowLeft'){e.preventDefault();showSlide(slide-1);}}});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&presenting)presentation(false);});
document.body.dataset.view='demo';showSlide(0);if(new URLSearchParams(location.search).get('present')==='1')presentation(true);
const {inventory,catalogId}=await fetch('/api/inventory').then(r=>r.json());
initWalkthrough(inventory);
let surface=null,busy=false,count=0,revision=0,requestStart=null;
const componentCache=new Map();let visibleKeys=new Set();
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const value=v=>v&&typeof v==='object'&&v.path?v.path.split('/').slice(1).reduce((a,k)=>a?.[k],surface.data):v;
const price=a=>new Intl.NumberFormat('vi-VN').format(a.price)+' đ';
function followStream(){
 if(!$('#auto-scroll').checked)return;
 requestAnimationFrame(()=>{
  if(!$('#auto-scroll').checked)return;
  $('#state').scrollTop=$('#state').scrollHeight;
  $('#trace').scrollTop=$('#trace').scrollHeight;
 });
}
function trace(message,direction='↓ SERVER') {
 const container=$('#trace');container.querySelector('.waiting')?.remove();
 const row=el('div',undefined,'trace-row'),kind=Object.keys(message).find(k=>k!=='version');
 row.append(el('small',`#${++count} ${direction} · ${kind} · ${requestStart===null?'0.0':((performance.now()-requestStart)/1000).toFixed(1)}s`),el('pre',JSON.stringify(message,null,2)));
 container.append(row);while(container.children.length>60)container.firstElementChild.remove();$('#count').textContent=count+' messages';followStream();
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)row.animate([{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'ease-out'});
}
function updateState(){
 $('#state').textContent=JSON.stringify(surface?{surfaceId:surface.surfaceId,catalogId:surface.catalogId,dataModel:surface.data,components:surface.components}:null,null,2);
 $('#state-revision').textContent=surface?`Revision ${++revision} · ${Object.keys(surface.components).length} components`:'No surface';
 followStream();
}
function apply(m){
 if(m.createSurface){if(surface||m.createSurface.catalogId!==catalogId)throw Error('Unsupported surface');surface={data:{},components:{},...m.createSurface};}
 if(m.deleteSurface)surface=null;
 if(m.updateComponents){if(!surface)throw Error('Missing surface');for(const c of m.updateComponents.components)surface.components[c.id]=c;}
 if(m.updateDataModel){if(!surface)throw Error('Missing surface');const {path='/',value:v}=m.updateDataModel;if(path==='/')surface.data=v||{};else {const keys=path.split('/').slice(1).map(k=>k.replaceAll('~1','/').replaceAll('~0','~'));let target=surface.data;for(const k of keys.slice(0,-1))target=target[k]??={};if(v===undefined)delete target[keys.at(-1)];else target[keys.at(-1)]=v;}}
 render();updateState();
}
function button(label,fn,cls=''){const b=el('button',label,cls);b.type='button';b.disabled=busy;b.onclick=fn;return b;}
function action(name,id,context={}){const event={version:'v0.9',action:{name,surfaceId:'marketplace',sourceComponentId:id,timestamp:new Date().toISOString(),context}};updateState();trace(event,'↑ CLIENT');request({event});}
function card(a,id,detail=false){
 const node=el('article',undefined,'ad-card');const image=el('div',a.emoji,'ad-image');image.style.background=a.color;image.setAttribute('aria-label',a.category+' sample illustration');if(a.contain_videos)image.append(el('small','▶ Video'));node.append(image);
 const body=el('div',undefined,'ad-body');body.append(el('span',a.account_type==='p'?'Cá nhân':'Bán chuyên','seller-type'),el('h3',a.subject),el('strong',price(a),'price'),el('p','⌖ '+a.area_name+' · '+a.region_name,'location'));
 if(detail)body.append(el('p',a.description),el('p','Người bán: '+a.seller+' · Tin mẫu'));
 body.append(button(detail?'← Quay lại':'Xem chi tiết',()=>action(detail?'back':'openAd',id,{adId:a.list_id}),'card-action'));node.append(body);return node;
}
function component(id,seen=new Set()){
 const c=surface.components[id];
 if(c&&c.component!=='Column'){
  const signature=JSON.stringify([c,c.component==='Text'?value(c.text):c.component==='FilterBar'?value(c.query):null]);
  const cached=componentCache.get(id);if(cached?.signature===signature)return cached.node;
  const node=buildComponent(id,seen);node.dataset.componentKey=id+':'+c.component;componentCache.set(id,{signature,node});return node;
 }
 return buildComponent(id,seen);
}
function buildComponent(id,seen=new Set()){
 if(seen.has(id))return el('p','Invalid component cycle');const c=surface.components[id];if(!c)return el('span','…');const next=new Set(seen).add(id);
 if(c.component==='Column'){const n=el('div',undefined,'column');for(const child of c.children)n.append(component(child,next));return n;}
 if(c.component==='Text')return el('p',value(c.text),'summary-text');
 if(c.component==='FilterBar'){
  const q=value(c.query)||{};const n=el('div',undefined,'filters');
  n.append(button('Cá nhân',()=>{surface.data.query=toggleAccountType(q,'p');action('filter',id,{query:surface.data.query});},isAccountTypeSelected(q,'p')?'selected':''),button('Có video',()=>{surface.data.query=toggleVideoFilter(q);action('filter',id,{query:surface.data.query});},isVideoSelected(q)?'selected':''),button('Giá thấp trước',()=>{surface.data.query={...q,sort:'price'};action('filter',id,{query:surface.data.query});},q.sort==='price'?'selected':''),button('So sánh',()=>action('compare',id)));
  if(q.maxPrice)n.append(el('span','≤ '+new Intl.NumberFormat('vi-VN').format(q.maxPrice)+' đ','chip'));return n;
 }
 if(['ListingCard','AdDetail'].includes(c.component)){const a=inventory.find(a=>a.list_id===c.adId);return a?card(a,id,c.component==='AdDetail'):el('p','Unknown listing');}
 if(c.component==='Comparison'){const n=el('div',undefined,'comparison');for(const adId of c.adIds){const a=inventory.find(a=>a.list_id===adId);if(a)n.append(card(a,id,true));}return n;}
 return el('p','Unsupported component: '+c.component);
}
function render(){
 const root=$('#surface');
 const content=surface?.components.root?component('root'):el('div','Your search will appear here. Choose a suggestion to start.','empty');root.replaceChildren(content);
 const keys=new Set();for(const node of root.querySelectorAll('[data-component-key]')){
  const key=node.dataset.componentKey;keys.add(key);
  if(!visibleKeys.has(key)&&!matchMedia('(prefers-reduced-motion: reduce)').matches)node.animate([{opacity:0,transform:'translateY(16px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:460,easing:'cubic-bezier(.16,1,.3,1)'});
 }
 visibleKeys=keys;for(const b of root.querySelectorAll('button'))b.disabled=busy;
}
async function request(input){
 if(busy)return;busy=true;const start=performance.now();requestStart=start;let first=null,received=0,completed=false;$('#status').textContent='Codex is thinking…';$('#status').dataset.active='true';$('#send').disabled=true;$('#timing').textContent='Waiting for the first envelope…';render();
 if(input.prompt){$('#chat').append(el('p',input.prompt,'user'));$('#prompt').value='';}
 try{
  const response=await fetch('/api/agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...input,existing:!!surface,metadata:{a2uiClientCapabilities:{'v0.9':{supportedCatalogIds:[catalogId]}},a2uiClientDataModel:{version:'v0.9',surfaces:surface?{marketplace:surface.data}:{}}}})});
  if(!response.ok)throw Error(await response.text());const reader=response.body.getReader(),decoder=new TextDecoder();let pending='';
  while(true){const {done,value:v}=await reader.read();pending+=decoder.decode(v,{stream:!done});const lines=pending.split('\n');pending=lines.pop();for(const line of lines.filter(Boolean)){const m=JSON.parse(line);if(m.error)throw Error(m.error);if(m.status){if(m.status==='complete')completed=true;continue;}first??=(performance.now()-start)/1000;received++;trace(m);apply(m);$('#status').textContent='Streaming · '+received+' messages';$('#timing').textContent=`First ${first.toFixed(1)}s · elapsed ${((performance.now()-start)/1000).toFixed(1)}s`;}if(done)break;}
  if(!completed||pending.trim())throw Error('Stream ended before completion. Partial UI may be visible; try again.');
  if(surface?.data.summary)$('#chat').append(el('p',surface.data.summary,'assistant'));$('#status').textContent='Updated';$('#timing').textContent=`${received} envelopes · first ${(first||0).toFixed(1)}s · total ${((performance.now()-start)/1000).toFixed(1)}s`;
 }catch(e){$('#chat').append(el('p',e.message,'error'));$('.conversation').open=true;$('#status').textContent='Request failed';}
 finally{busy=false;$('#status').dataset.active='false';$('#send').disabled=false;render();}
}
$('#prompt-form').onsubmit=e=>{e.preventDefault();const prompt=$('#prompt').value.trim();if(prompt)request({prompt});};
$('#auto-scroll').onchange=followStream;
for(const b of document.querySelectorAll('[data-prompt]'))b.onclick=()=>request({prompt:b.dataset.prompt});
render();
