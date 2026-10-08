import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {WebSocketServer} from 'ws';
import {Rooms} from './rooms.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json'};
export function createServer(options={}){
 const rooms=new Rooms(options);
 const server=http.createServer(async(req,res)=>{
  if(req.url==='/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,rooms:rooms.rooms.size}));return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  try{
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const vendor=['/vendor/three.module.js','/vendor/three.core.js'].includes(pathname);
   const shared=pathname.startsWith('/shared/');
   const base=vendor?path.join(root,'node_modules/three/build'):path.join(root,shared?'shared':'client');
   const relative=vendor?pathname.slice(7):shared?pathname.slice(7):pathname;
   const target=path.resolve(base,'.'+(relative==='/'?'/index.html':relative));
   if(!target.startsWith(base+path.sep))throw new Error('Invalid path');
   const bytes=await readFile(target);
   res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws: wss:; manifest-src 'self'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:bytes);
  }catch{res.writeHead(404);res.end('Não encontrado');}
 });
 const wss=new WebSocketServer({noServer:true,maxPayload:2048,perMessageDeflate:false});
 server.on('upgrade',(req,socket,head)=>{
  const origin=req.headers.origin;
  const expected=process.env.ALLOWED_ORIGIN;
  let valid=!origin;try{if(origin)valid=expected?origin===expected:new URL(origin).host===req.headers.host;}catch{valid=false;}
  if(req.url!=='/ws'||!valid||wss.clients.size>=1000){socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');socket.destroy();return;}
  wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));
 });
 wss.on('connection',ws=>{
  ws.alive=true;ws.tokens=90;ws.refill=Date.now();
  ws.on('pong',()=>ws.alive=true);
  ws.on('message',data=>{
   const now=Date.now();ws.tokens=Math.min(90,ws.tokens+(now-ws.refill)*.06);ws.refill=now;
   if(--ws.tokens<0){ws.close(1008,'Muitas mensagens');return;}
   try{rooms.handle(ws,JSON.parse(data.toString()));}catch{rooms.error(ws,'Mensagem inválida.');}
  });
  ws.on('close',()=>rooms.disconnect(ws));ws.on('error',()=>{});
 });
 let last=performance.now(),frame=0;
 const loop=setInterval(()=>{const now=performance.now();rooms.step(Math.min(.1,(now-last)/1000));last=now;if(++frame%2===0)for(const room of rooms.rooms.values())rooms.broadcast(room);},1000/30);
 const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}},10000);
 return {server,rooms,wss,close:()=>new Promise(resolve=>{clearInterval(loop);clearInterval(heartbeat);for(const ws of wss.clients)ws.terminate();wss.close();server.close(resolve);})};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const app=createServer();const port=Number(process.env.PORT||3001);app.server.listen(port,'0.0.0.0',()=>console.log(`Casal Contra o Caos em http://localhost:${port}`));
 app.server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`A porta ${port} já está em uso. Feche a janela antiga do jogo ou use outra porta com PORT.`:error.message);process.exit(1);});
 for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>app.close().then(()=>process.exit(0)));
}
