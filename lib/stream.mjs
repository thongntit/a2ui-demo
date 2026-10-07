// SSE framing is independent of TCP chunks; preserve split UTF-8 and multiline data.
export async function* parseSSE(chunks){
 const decoder=new TextDecoder();let pending='',data=[],size=0;
 const lineEvent=line=>{
  if(line===''){const result=data.length?data.join('\n'):null;data=[];return result;}
  if(line.startsWith('data:'))data.push(line.slice(5).replace(/^ /,''));
  return null;
 };
 for await(const bytes of chunks){
  pending+=typeof bytes==='string'?bytes:decoder.decode(bytes,{stream:true});
  size+=bytes.length;if(size>2_000_000)throw Error('Proxy response exceeded the demo limit');
  let end;while((end=pending.indexOf('\n'))!==-1){const line=pending.slice(0,end).replace(/\r$/,'');pending=pending.slice(end+1);const event=lineEvent(line);if(event!==null)yield event;}
 }
 pending+=decoder.decode();
 if(pending){const event=lineEvent(pending.replace(/\r$/,''));if(event!==null)yield event;}
 if(data.length)yield data.join('\n');
}

export async function* parseJSONLines(chunks){
 let pending='',size=0;
 for await(const text of chunks){
  pending+=text;size+=text.length;if(size>200_000)throw Error('A2UI output exceeded the demo limit');
  let end;while((end=pending.indexOf('\n'))!==-1){const line=pending.slice(0,end).trim();pending=pending.slice(end+1);if(line)yield JSON.parse(line);}
 }
 if(pending.trim())yield JSON.parse(pending);
}
