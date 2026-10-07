import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseSSE,parseJSONLines} from '../lib/stream.mjs';
import {createStreamValidator,catalogId} from '../lib/protocol.mjs';
async function* chunks(values){yield* values;}
const collect=async generator=>{const out=[];for await(const x of generator)out.push(x);return out;};
test('SSE handles byte-by-byte UTF-8, CRLF, comments, and multiline data',async()=>{
 const bytes=new TextEncoder().encode(': ping\r\ndata: {"text":"điện"}\r\n\r\ndata: one\ndata: two\n\ndata: [DONE]\n\n');
 assert.deepEqual(await collect(parseSSE(chunks([...bytes].map(b=>Uint8Array.of(b))))),['{"text":"điện"}','one\ntwo','[DONE]']);
});
test('JSON lines yields a complete envelope before asking for later content',async()=>{
 let released=false;async function* source(){yield '{"first":';yield '1}\n{"second":';released=true;yield '2}';}
 const parser=parseJSONLines(source());assert.deepEqual(await parser.next(),{value:{first:1},done:false});assert.equal(released,false);assert.deepEqual(await parser.next(),{value:{second:2},done:false});
});
test('truncated JSON is rejected',async()=>{await assert.rejects(collect(parseJSONLines(chunks(['{"broken":']))));});
test('progressive root updates allow temporary unresolved children but enforce final tree',()=>{
 const state=createStreamValidator();state.push({version:'v0.9',createSurface:{surfaceId:'marketplace',catalogId}});
 state.push({version:'v0.9',updateComponents:{surfaceId:'marketplace',components:[{id:'root',component:'Column',children:['card']}]}});
 assert.throws(()=>state.finish(),/Missing child/);
 state.push({version:'v0.9',updateComponents:{surfaceId:'marketplace',components:[{id:'card',component:'ListingCard',adId:101}]}});state.finish();
 assert.throws(()=>state.push({version:'v0.9',updateComponents:{surfaceId:'marketplace',components:[{id:'root',component:'Column',children:['root']}]}}),/Cyclic/);
});
