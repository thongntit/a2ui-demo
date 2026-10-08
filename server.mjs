import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {generate} from './lib/provider.mjs';
import {inventory} from './lib/inventory.mjs';
import {catalog,catalogId,validateAction} from './lib/protocol.mjs';
let active=0;
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&url.pathname==='/api/inventory'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({inventory:[],catalog,catalogId,source:'chotot-live'}));}
  if(req.method==='GET'&&url.pathname==='/api/trace-fixtures'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({inventory}));}
  if(req.method==='POST'&&url.pathname==='/api/agent'){
   if(req.headers.origin&&!['http://localhost:3000','http://127.0.0.1:3000',`http://localhost:${process.env.PORT||3000}`].includes(req.headers.origin)){res.writeHead(403);return res.end('Invalid origin');}
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>32000){res.writeHead(413);return res.end();}}
   const body=JSON.parse(raw);
   if((!body.prompt&&!body.event)||typeof body.existing!=='boolean'||(body.prompt&&(typeof body.prompt!=='string'||body.prompt.length>1500))||(body.event&&!validateAction(body.event))){res.writeHead(400);return res.end('Invalid request');}
   if(active>=2){res.writeHead(429);return res.end('Agent is busy. Try again shortly.');}
   active++;const controller=new AbortController();res.on('close',()=>{if(!res.writableEnded)controller.abort();});
   res.writeHead(200,{'Content-Type':'application/x-ndjson','Cache-Control':'no-store'});res.write(JSON.stringify({status:'thinking'})+'\n');
   try{for await(const message of generate(body,controller.signal))res.write(JSON.stringify(message)+'\n');res.write(JSON.stringify({status:'complete'})+'\n');}catch(e){if(!res.destroyed)res.write(JSON.stringify({error:e.name==='TimeoutError'?'Proxy request timed out.':e.message})+'\n');}finally{active--;res.end();}return;
  }
  const files={'/':'index.html','/app.js':'app.js','/walkthrough.js':'walkthrough.js','/style.css':'style.css','/filterTagParams.js':'filterTagParams.js'};
  if(req.method!=='GET'||!files[url.pathname]){res.writeHead(404);return res.end('Not found');}
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',url.pathname.endsWith('.js')?'text/javascript':url.pathname.endsWith('.css')?'text/css':'text/html');res.end(await readFile(new URL('./public/'+files[url.pathname],import.meta.url)));
 }catch{if(!res.headersSent)res.writeHead(400);res.end('Invalid request');}
});
server.listen(Number(process.env.PORT)||3000,'127.0.0.1',()=>console.log(`A2UI demo: http://localhost:${process.env.PORT||3000}`));
