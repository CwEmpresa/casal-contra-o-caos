import test from 'node:test';import assert from 'node:assert/strict';import WebSocket from 'ws';import {createServer} from '../server/index.js';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function peer(url){const ws=new WebSocket(url),messages=[];ws.on('message',data=>messages.push(JSON.parse(data)));await new Promise((ok,no)=>{ws.once('open',ok);ws.once('error',no);});return {ws,messages,send:m=>ws.send(JSON.stringify(m)),wait:async predicate=>{for(let i=0;i<100;i++){const found=messages.find(predicate);if(found)return found;await sleep(20);}throw new Error('Timed out waiting for network message');}};}
test('real WebSockets: create/join, third player refusal, movement, host-only start, reconnect, replay and privacy',async()=>{
 const app=createServer();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const url=`ws://127.0.0.1:${app.server.address().port}/ws`;
 try{
  const a=await peer(url);a.send({type:'create',name:'Ana'});const sa=await a.wait(m=>m.type==='session');
  const b=await peer(url);b.send({type:'join',code:sa.code,name:'Leo'});const sb=await b.wait(m=>m.type==='session');
  const c=await peer(url);c.send({type:'join',code:sa.code,name:'Terceiro'});await c.wait(m=>m.type==='error'&&m.message.includes('duas'));
  b.send({type:'start'});await b.wait(m=>m.type==='error'&&m.message.includes('criou'));
  a.send({type:'start'});const start=await a.wait(m=>m.room?.game?.status==='playing');const original=start.room.game.players[0].x;
  const other=await b.wait(m=>m.room?.game?.status==='playing');assert.ok(start.room.game.order);assert.equal(other.room.game.order,null);assert.ok(!Object.hasOwn(other.room.game,'list'));assert.equal(other.room.game.routing,null);
  b.send({type:'command',action:'power',sector:'A',stage:0});await b.wait(m=>m.type==='error'&&m.message.includes('Somente'));
  a.send({type:'command',action:'power',sector:'A',stage:0});await b.wait(m=>m.room?.game?.power==='A');
  a.send({type:'radio',text:'Vá ao setor A e leia o código'});await b.wait(m=>m.room?.game?.radio.length===1);
  a.send({type:'input',x:1,y:0});await a.wait(m=>m.room?.game?.players[0].x>original+.1);
  assert.ok(!JSON.stringify(start).includes(sa.token));assert.ok(!JSON.stringify(start).includes(sb.token));
  b.ws.close();await a.wait(m=>m.room?.game?.players[1].connected===false);const paused=app.rooms.rooms.get(sa.code).game.time;await sleep(180);assert.equal(app.rooms.rooms.get(sa.code).game.time,paused);
  const d=await peer(url);d.send({type:'resume',code:sa.code,token:sb.token});const resumed=await d.wait(m=>m.type==='session');assert.equal(resumed.id,sb.id);await d.wait(m=>m.room?.game?.players.every(p=>p.connected));d.send({type:'view',ready:true});await d.wait(m=>m.room?.game?.players.every(p=>p.connected&&p.ready));
  const bad=await peer(url);bad.send({type:'resume',code:sa.code,token:'wrong'});await bad.wait(m=>m.code==='expired');
  // Deterministic clock expiry; clients still cannot set server time or result.
  app.rooms.rooms.get(sa.code).game.time=.01;await a.wait(m=>m.room?.game?.status==='lost');a.send({type:'replay'});await a.wait(m=>m.room?.game?.round===2&&m.room.game.status==='playing');
  a.send({type:'leave'});await d.wait(m=>m.type==='ended');assert.equal(app.rooms.rooms.size,0);
 }finally{await app.close();}
});
test('HTTP serves frontend/modules, rejects traversal and cross-origin WebSocket',async()=>{
 const app=createServer();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${app.server.address().port}`;
 try{for(const route of ['/','/main.js','/style.css','/shared/levels.js','/shared/prediction.js','/manifest.webmanifest','/vendor/three.module.js','/vendor/three.core.js','/game/models.js'])assert.equal((await fetch(base+route)).status,200);assert.equal((await fetch(base+'/shared/..%2fserver/index.js')).status,404);assert.equal((await fetch(base+'/server/index.js')).status,404);assert.equal((await fetch(base+'/health')).status,200);
 const denied=await new Promise(resolve=>{const ws=new WebSocket(base.replace('http','ws')+'/ws',{origin:'https://evil.example'});ws.on('error',()=>resolve(true));ws.on('open',()=>{ws.close();resolve(false);});});assert.equal(denied,true);
 }finally{await app.close();}
});
test('mobile protocol: queued movement precedes interaction, role privacy and portrait pause over real sockets',async()=>{
 const app=createServer();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const url=`ws://127.0.0.1:${app.server.address().port}/ws`;
 try{
  const a=await peer(url);a.send({type:'create',name:'Central'});const sa=await a.wait(m=>m.type==='session');const b=await peer(url);b.send({type:'join',code:sa.code,name:'Mercado'});const sb=await b.wait(m=>m.type==='session');a.send({type:'start'});await b.wait(m=>m.room?.game?.status==='playing');
  const g=app.rooms.rooms.get(sa.code).game,p=g.players.find(p=>p.id===sb.id);Object.assign(p,{x:3,y:2.55,yaw:Math.PI});
  a.send({type:'command',stage:0,action:'brief'});await b.wait(m=>m.room?.game?.sharedBrief);
  a.send({type:'command',stage:0,action:'power',sector:'A'});a.send({type:'command',stage:0,action:'gate',code:g.codes.A});await b.wait(m=>m.room?.game?.gates[0].remaining>0);
  b.send({type:'inputs',handoff:g.handoff,inputs:[{seq:1,x:0,y:0,yaw:0,pitch:0},{seq:2,x:0,y:0,yaw:0,pitch:0}]});b.send({type:'interact',afterSeq:2});await b.wait(m=>m.room?.game?.players.find(p=>p.id===sb.id)?.holding==='milk');
  const central=await a.wait(m=>m.room?.game?.players.find(p=>p.id===sb.id)?.seq===2);assert.equal(central.room.game.players.find(p=>p.id===sb.id).holding,null);
  b.send({type:'view',ready:false});await a.wait(m=>m.room?.game?.paused);const clock=g.time;await sleep(150);assert.equal(g.time,clock);b.send({type:'view',ready:true});await b.wait(m=>m.room?.game?.time<clock);
 }finally{await app.close();}
});
