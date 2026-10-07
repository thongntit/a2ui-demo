import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateStream,catalogId} from '../lib/protocol.mjs';
import {search} from '../lib/inventory.mjs';
import {toggleAccountType,toggleVideoFilter} from '../public/filterTagParams.js';
const create={version:'v0.9',createSurface:{surfaceId:'marketplace',catalogId}};
const tree=children=>({version:'v0.9',updateComponents:{surfaceId:'marketplace',components:[{id:'root',component:'Column',children},{id:'title',component:'Text',text:'Hello'}]}});
test('official v0.9 envelope validates against custom catalog',()=>assert.equal(validateStream([create,tree(['title'])]).length,2));
test('reject unsupported code, missing links, duplicate surfaces and cycles',()=>{
 assert.throws(()=>validateStream([create,{version:'v0.9',updateComponents:{surfaceId:'marketplace',components:[{id:'root',component:'Script',code:'alert(1)'}]}}]));
 assert.throws(()=>validateStream([create,tree(['missing'])]));
 assert.throws(()=>validateStream([create,create,tree([])]));
 assert.throws(()=>validateStream([create,tree(['root'])]));
});
test('Chotot filter helper preserves unrelated account types and resets page',()=>{assert.deepEqual(toggleAccountType({f:'protection_entitlement',page:4},'p'),{f:'p,protection_entitlement',page:1});assert.deepEqual(toggleVideoFilter({contain_videos:'1',page:4}),{page:1});});
test('listing constraints apply together',()=>assert.deepEqual(search({category:'phone',q:'iPhone',maxPrice:15000000,f:'p',contain_videos:true}).map(a=>a.list_id),[101]));
