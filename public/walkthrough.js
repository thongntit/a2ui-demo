const query={category:'laptop',q:'',maxPrice:0,f:'',contain_videos:false,sort:'price'};
const summary='So sánh hai laptop rẻ nhất: Dell Latitude 5420 · i5 (6.500.000 đ) và ThinkPad T14 · RAM 16GB (7.800.000 đ).';
const envelopes=[
 {version:'v0.9',createSurface:{surfaceId:'marketplace',catalogId:'urn:chotot:a2ui:demo:0.9',sendDataModel:true}},
 {version:'v0.9',updateDataModel:{surfaceId:'marketplace',value:{query,summary}}},
 {version:'v0.9',updateComponents:{surfaceId:'marketplace',components:[{id:'root',component:'Column',children:['summary','filters']},{id:'summary',component:'Text',text:{path:'/summary'}},{id:'filters',component:'FilterBar',query:{path:'/query'}}]}},
 {version:'v0.9',updateComponents:{surfaceId:'marketplace',components:[{id:'comparison',component:'Comparison',adIds:[303,302]},{id:'root',component:'Column',children:['summary','filters','comparison']}]}}
];
const stages=[
 {label:'Start · Client definitions',time:'BEFORE ANY AGENT RESPONSE',title:'The client already knows how to render these names',envelope:-1,explanation:'The agent does not send React components or JavaScript. Our app already implements Column, Text, FilterBar, and Comparison, and both sides agree on their JSON schema. The response supplies component instances and values to those implementations.',state:'No surface yet. The client has renderer code, a supported catalog ID, and a preloaded inventory cache. It does not yet have a root tree, summary, or query from the agent.',caveat:'The code on the right is simplified pseudocode based on public/app.js. It is client-owned code, not code returned by the model. The catalog schema is defined in lib/protocol.mjs and supplied to the agent by the server.'},
 {label:'#1 · Surface',time:'RECORDED · 3.7s',title:'Create a rendering context',envelope:0,explanation:'The server creates marketplace and selects the agreed Chợ Tốt component catalog. The catalog ID identifies the vocabulary; it is not a backend URL.',state:'A surface exists, but its data model and component map are empty. sendDataModel: true asks the client to attach its current model to later actions through transport metadata.',caveat:'No root component exists yet. A2UI creates the surface; the demo’s waiting placeholder is host UI, not an agent-generated component.'},
 {label:'Backend · integration',time:'PROPOSED INTEGRATION · NOT A RECORDED EVENT',title:'Fetch the records before making claims',envelope:null,explanation:'For a real search, the agent service resolves “laptop, cheapest first, two results” and calls a listing service. It waits for actual records before producing the result summary and comparison IDs.',state:'Backend/tool state changes outside the A2UI surface. The returned records must also become accessible to the renderer. The query alone is not a search result.',caveat:'This is a suggested placement after surface creation and before #2, not a measured backend call. In the current demo, inventory was already supplied before #1.'},
 {label:'#2 · Data',time:'RECORDED · 7.4s',title:'Update data without drawing components',envelope:1,explanation:'The full data model is replaced with query and summary. In this demo maxPrice: 0 means unlimited; q and f are empty, no video filter is applied, and sort: price means lowest price first. These are application conventions, not A2UI-defined search semantics.',state:'The query and summary are now stored at /query and /summary. The model contains a human-readable result summary, but no array of listing records.',caveat:'Still no agent-rendered UI: data is ready, but no root tree has arrived. The 7.4s timestamp is receipt time, not proof that the backend took 3.7s.'},
 {label:'#3 · Layout',time:'RECORDED · 10.2s',title:'Bind the first visible component tree',envelope:2,explanation:'root is a Column with two children. Text resolves /summary from the existing model. The custom FilterBar resolves /query and displays the current filters. Component references link a flat list into a tree.',state:'Three components are added. Data is unchanged. The renderer now has both the tree and its bound values, so it can render immediately.',caveat:'Summary text and filters appear now. The summary mentions the two laptops, but the comparison widget itself has not arrived yet.'},
 {label:'#4 · Comparison',time:'RECORDED · 13.3s',title:'Append the comparison to the existing UI',envelope:3,explanation:'The server adds a custom Comparison component with listing IDs 303 and 302, then replaces root’s children with summary, filters, comparison. Existing summary and filters definitions remain in the component map.',state:'Four components now exist. root is updated rather than duplicated. The data model stays unchanged; the new widget joins the visible tree.',caveat:'Both laptops appear together because this envelope contains one Comparison component with two IDs. It does not stream one laptop at a time. A2UI standardizes the envelope; Comparison and adIds are our custom catalog contract.'}
];
const clientCode=`// CLIENT CODE: simplified from public/app.js\n// Implemented BEFORE receiving the agent response.\n\nconst supportedCatalog = "urn:chotot:a2ui:demo:0.9";\n\nfunction renderComponent(c, data, componentMap) {\n  switch (c.component) {\n    case "Column":\n      return verticalLayout(c.children.map(id =>\n        renderComponent(componentMap[id], data, componentMap)\n      ));\n    case "Text":\n      return text(resolvePath(data, c.text.path));\n    case "FilterBar":\n      return filterControls(resolvePath(data, c.query.path));\n    case "Comparison":\n      return comparisonCards(c.adIds.map(id =>\n        inventory.find(ad => ad.list_id === id)\n      ));\n  }\n}\n\n// Example: {component:"Text", text:{path:"/summary"}}\n// means: run our Text renderer with data.summary.\n// Example: {component:"Comparison", adIds:[303,302]}\n// means: run our Comparison renderer with those records.`;
const meanings={
 '-1':[
  ['Catalog schema','Defines which component names and properties are allowed. The server shares it with the agent; the client implements the same contract.'],
  ['Renderer functions','Define the actual layout, DOM, styling, and event handlers. The model chooses from these functions using component names.'],
  ['Component map','Stores instances by string ID, such as root or summary. IDs link nodes; they are not component types.'],
  ['Data model','Stores values separately from the UI tree. /summary points to data.summary; /query points to data.query.'],
  ['Inventory cache','Maps numeric listing IDs to full records. This demo preloads it; a production app must provide its own records.']
 ],
 0:[
  ['version: "v0.9"','Interpret this envelope using the A2UI v0.9 contract.'],
  ['createSurface','Create a UI surface; do not create listing data or call a search API.'],
  ['surfaceId: "marketplace"','Name the surface. Later envelopes use this ID to target the same surface.'],
  ['catalogId: "urn:chotot:a2ui:demo:0.9"','Select the catalog the client already supports. This identifies a schema/vocabulary, not a URL to fetch.'],
  ['sendDataModel: true','Attach this surface’s data model to future client messages through transport metadata. It does not fetch records or send an action immediately.']
 ],
 1:[
  ['version / surfaceId','Use v0.9 and target the existing marketplace surface.'],
  ['updateDataModel','Change stored values, independently of component definitions.'],
  ['value: {...}','No path is specified, so this object replaces the whole surface data model.'],
  ['query','Our custom search-state object. A2UI treats its fields as ordinary application data.'],
  ['category: "laptop"','Our app’s laptop category key. Not a standardized A2UI category or verified Chợ Tốt backend code.'],
  ['q: ""','No keyword substring filter in this demo.'],
  ['maxPrice: 0','Our convention for no price limit.'],
  ['f: ""','No seller-type restriction. Our helpers use p for private and c for professional.'],
  ['contain_videos: false','Do not restrict results to listings with video.'],
  ['sort: "price"','Our convention for ascending price. Actual backend mapping belongs to the search adapter.'],
  ['summary: "So sánh..."','Store the literal text at /summary. It is not visible until a Text component binds to it.']
 ],
 2:[
  ['updateComponents','Add or update component instances in the surface’s component map.'],
  ['components: [...]','Flat list of node definitions. List order is not the visible layout order.'],
  ['id: "root"','The required entry point for this surface’s component tree.'],
  ['component: "Column"','Use the client’s already-implemented vertical container.'],
  ['children: ["summary", "filters"]','Render those component IDs in that order. These strings reference nodes below.'],
  ['id: "summary" / component: "Text"','Create a node named summary using the client’s Text renderer. The ID could be different without changing its binding.'],
  ['text: {path: "/summary"}','Read dataModel.summary. This is a JSON Pointer binding, not literal text or an HTTP endpoint.'],
  ['id: "filters" / component: "FilterBar"','Create a node named filters using our custom filter component.'],
  ['query: {path: "/query"}','Pass dataModel.query to that custom component, which already knows how to show filters and send actions.']
 ],
 3:[
  ['updateComponents','Patch component definitions on the existing surface; do not replace the entire component map.'],
  ['id: "comparison"','Add a new instance with this node ID. It is not a listing ID.'],
  ['component: "Comparison"','Choose our custom, client-defined comparison widget.'],
  ['adIds: [303, 302]','Pass numeric listing IDs to that widget. It looks up full records in inventory and displays them in this order.'],
  ['id: "root"','This ID already exists, so update the root definition rather than create a second root.'],
  ['children: ["summary", "filters", "comparison"]','Replace the root’s child list. Append comparison after the two existing nodes; their definitions stay stored.'],
  ['No updateDataModel in #4','The query and summary remain exactly as #2 set them. UI structure changes while data stays the same.']
 ],
 backend:[['listingService.search(...)','Server-owned application/tool call. A2UI does not define or execute it.'],['Returned records','Ground the summary and IDs and make records available to the renderer.'],['Timing','Not included in these four envelopes; this step is a proposed integration, not a measured event.']]
};
const $=s=>document.querySelector(s);
const element=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
export function initWalkthrough(inventory){
 const nav=$('#scenario-steps');let selected=0;
 function show(index){
  selected=index;const stage=stages[index];for(const [i,b] of [...nav.children].entries()){b.setAttribute('aria-pressed',String(i===index));}
  $('#scenario-time').textContent=stage.time;$('#scenario-title').textContent=stage.title;$('#scenario-explanation').textContent=stage.explanation;$('#scenario-state-note').textContent=stage.state;$('#scenario-caveat').textContent=stage.caveat;
  const envelopeIndex=stage.envelope??0;const state={surface:envelopeIndex<0?null:envelopes[0].createSurface,dataModel:{},components:{}};
  for(let i=1;i<=envelopeIndex;i++){const m=envelopes[i];if(m.updateDataModel)state.dataModel=m.updateDataModel.value;if(m.updateComponents)for(const c of m.updateComponents.components)state.components[c.id]=c;}
  $('#scenario-state').textContent=JSON.stringify(state,null,2);
  $('#scenario-json-title').textContent=stage.envelope===-1?'Client definitions · simplified code':stage.envelope===null?'Backend pseudocode · not A2UI':'Exact recorded envelope';
  $('#scenario-json').textContent=stage.envelope===-1?clientCode:stage.envelope===null?`// Proposed server-side integration; not a real endpoint\nconst intent = resolveIntent(userPrompt);\nconst ads = await listingService.search({\n  category: "laptop",\n  sort: "price_ascending",\n  limit: 2\n});\n\n// Returned records must be available to the renderer.\n// With this sample inventory:\n// 303 → Dell Latitude 5420 · i5 → 6.500.000 đ\n// 302 → ThinkPad T14 · RAM 16GB → 7.800.000 đ\n\n// Then emit #2, #3, and #4 with grounded values.`:JSON.stringify(envelopes[stage.envelope],null,2);
  const fields=$('#scenario-fields');fields.replaceChildren();
  for(const [field,meaning] of meanings[stage.envelope===null?'backend':stage.envelope]){fields.append(element('dt',field),element('dd',meaning));}
  $('.walkthrough-explanation').scrollTop=0;$('#scenario-json').scrollTop=0;
  const preview=$('#scenario-preview');preview.replaceChildren();
  if(envelopeIndex<2)preview.append(element('p',stage.envelope===null?'The surface can show a host-owned loading indicator while records are fetched.':'No agent-rendered components yet.','scenario-placeholder'));
  else{preview.append(element('p',summary));const filters=element('div',undefined,'scenario-filter-preview');filters.append(element('span','Cá nhân'),element('span','Có video'),element('span','Giá thấp trước ✓'));preview.append(filters);
   if(envelopeIndex===3){const cards=element('div',undefined,'scenario-cards');for(const id of [303,302]){const ad=inventory.find(a=>a.list_id===id);const card=element('div',undefined,'scenario-card');card.append(element('small','Listing ID '+id),element('strong',ad.subject),element('span',new Intl.NumberFormat('vi-VN').format(ad.price)+' đ'));cards.append(card);}preview.append(cards);}
  }
 }
 stages.forEach((s,i)=>{const b=element('button',s.label);b.type='button';b.onclick=()=>show(i);nav.append(b);});
 nav.onkeydown=e=>{let i=selected;if(e.key==='ArrowRight')i=Math.min(stages.length-1,i+1);else if(e.key==='ArrowLeft')i=Math.max(0,i-1);else return;e.preventDefault();show(i);nav.children[i].focus();};show(0);
}
