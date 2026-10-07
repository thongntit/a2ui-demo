import Ajv from 'ajv/dist/2020.js';
import {readFileSync} from 'node:fs';
export const catalogId='urn:chotot:a2ui:demo:0.9';
const str={type:'string'};
const bound={anyOf:[str,{type:'object',properties:{path:str},required:['path'],additionalProperties:false}]};
const component=(name,props,required=[])=>({type:'object',properties:{id:str,component:{const:name},...props},required:['id','component',...required],additionalProperties:false});
export const catalog={ $id:'https://a2ui.org/specification/v0_9/catalog.json', $defs:{theme:{type:'object',additionalProperties:false},anyComponent:{oneOf:[
 component('Column',{children:{$ref:'common_types.json#/$defs/ChildList'}},['children']),
 component('Text',{text:bound},['text']),
 component('FilterBar',{query:{type:'object',properties:{path:str},required:['path'],additionalProperties:false}},['query']),
 component('ListingCard',{adId:{type:'integer'}},['adId']),
 component('AdDetail',{adId:{type:'integer'}},['adId']),
 component('Comparison',{adIds:{type:'array',items:{type:'integer'},minItems:2,maxItems:3}},['adIds'])
]}}};
const ajv=new Ajv({strict:false,validateFormats:false});
ajv.addSchema(JSON.parse(readFileSync(new URL('../schemas/common_types.json',import.meta.url))),'common_types.json');
ajv.addSchema(catalog,'catalog.json');
export const validate=ajv.compile(JSON.parse(readFileSync(new URL('../schemas/server_to_client.json',import.meta.url))));
export const validateAction=ajv.compile(JSON.parse(readFileSync(new URL('../schemas/client_to_server.json',import.meta.url))));
export function createStreamValidator(existing=false){
 let created=existing,count=0;const nodes={};
 const checkCycles=(id,anc=new Set())=>{if(anc.has(id))throw Error('Cyclic UI tree');const next=new Set(anc).add(id);for(const child of nodes[id]?.children||[])checkCycles(child,next);};
 return {
  push(m){
   if(++count>30)throw Error('Too many A2UI messages');
   if(!validate(m))throw Error('Invalid A2UI envelope: '+ajv.errorsText(validate.errors));
   const kind=Object.keys(m).find(k=>k!=='version'),payload=m[kind];
   if(payload.surfaceId!=='marketplace')throw Error('Unknown surface');
   if(kind==='createSurface'){if(created||payload.catalogId!==catalogId)throw Error('Invalid surface creation');created=true;}
   else if(!created)throw Error('Surface must be created first');
   if(kind==='deleteSurface'){created=false;for(const id of Object.keys(nodes))delete nodes[id];}
   if(kind==='updateDataModel'&&payload.path?.split('/').some(k=>['__proto__','constructor','prototype'].includes(k)))throw Error('Unsafe data path');
   if(kind==='updateComponents'){
    for(const c of payload.components){if(c.component==='Column'&&!Array.isArray(c.children))throw Error('Demo supports static children');if(['__proto__','constructor','prototype'].includes(c.id))throw Error('Unsafe component ID');nodes[c.id]=c;}
    for(const id of Object.keys(nodes))checkCycles(id);
   }
   return m;
  },
  finish(){
   if(!created||!nodes.root)throw Error('Each response must include a root tree');
   const visit=id=>{if(!nodes[id])throw Error('Missing child reference');for(const child of nodes[id].children||[])visit(child);};visit('root');
  }
 };
}
export function validateStream(messages,existing=false){
 if(!Array.isArray(messages)||messages.length>30)throw Error('Expected at most 30 A2UI messages');
 const state=createStreamValidator(existing);for(const m of messages)state.push(m);state.finish();
 return messages;
}
