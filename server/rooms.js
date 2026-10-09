import {randomBytes,randomInt} from 'node:crypto';
import {createGame,interact,setInput,tick,viewFor,command,radio,queueInputs,setReady} from './game.js';
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export class Rooms{
 constructor({maxRooms=300,reconnectMs=120000,now=()=>Date.now()}={}){this.rooms=new Map();this.maxRooms=maxRooms;this.reconnectMs=reconnectMs;this.now=now;}
 code(){let code;do{code=Array.from({length:5},()=>ALPHABET[randomInt(ALPHABET.length)]).join('');}while(this.rooms.has(code));return code;}
 send(ws,data){if(ws.readyState===1&&ws.bufferedAmount<128000)ws.send(JSON.stringify(data));}
 error(ws,message,code='invalid'){this.send(ws,{type:'error',message,code});}
 snapshot(room,viewerId){return {code:room.code,host:room.players[0]?.id,round:room.round,players:room.players.map(({id,name,ws})=>({id,name,connected:ws?.readyState===1})),game:viewFor(room.game,viewerId)};}
 broadcast(room){room.players.forEach(p=>{if(p.ws)this.send(p.ws,{type:'state',room:this.snapshot(room,p.id)});});}
 bind(room,p,ws){p.ws=ws;p.disconnectedAt=null;p.lastInput=this.now();ws.roomCode=room.code;ws.playerId=p.id;room.updated=this.now();if(room.game){const gp=room.game.players.find(v=>v.id===p.id);gp.connected=true;setReady(room.game,p.id,false);gp.input={x:0,y:0};}this.send(ws,{type:'session',code:room.code,id:p.id,token:p.token});this.broadcast(room);}
 handle(ws,m){
  if(!m||typeof m!=='object')return;
  const current=this.rooms.get(ws.roomCode);
  if(m.type==='ping'){this.send(ws,{type:'pong',at:m.at});return;}
  if(m.type==='resume'){
   if(current)return;
   const room=this.rooms.get(String(m.code||'').toUpperCase());
   const p=room?.players.find(v=>v.token===m.token&&typeof m.token==='string');
   if(!p||p.disconnectedAt&&this.now()-p.disconnectedAt>this.reconnectMs){this.error(ws,'Sua sala expirou. Crie uma nova partida.','expired');return;}
   if(p.ws&&p.ws!==ws){p.ws.roomCode=null;p.ws.close(4001,'Sessão retomada em outra aba');}
   this.bind(room,p,ws);return;
  }
  if(m.type==='create'||m.type==='join'){
   if(current){this.error(ws,'Você já está em uma sala.');return;}
   let room;
   if(m.type==='create'){
    if(this.rooms.size>=this.maxRooms){this.error(ws,'Servidor cheio. Tente novamente em instantes.');return;}
    room={code:this.code(),players:[],game:null,round:0,updated:this.now()};this.rooms.set(room.code,room);
   }else{
    room=this.rooms.get(String(m.code||'').trim().toUpperCase());
    if(!room){this.error(ws,'Sala não encontrada. Confira o código.');return;}
    if(room.players.length>=2){this.error(ws,'Esta sala já tem duas pessoas.');return;}
   }
   const name=String(m.name||'').trim().slice(0,18)||`Jogador ${room.players.length+1}`;
   const p={id:randomBytes(8).toString('hex'),token:randomBytes(24).toString('hex'),name,ws:null,lastAction:0};room.players.push(p);this.bind(room,p,ws);return;
  }
  if(!current)return;
  const p=current.players.find(v=>v.id===ws.playerId&&v.ws===ws);if(!p)return;
  if(m.type==='leave'){
   current.players.forEach(v=>{if(v.ws){this.send(v.ws,{type:'ended',message:'A sala foi encerrada. Vocês podem criar outra.'});v.ws.roomCode=null;}});this.rooms.delete(current.code);return;
  }
  if(m.type==='start'||m.type==='replay'){
   if(p!==current.players[0]){this.error(ws,'Quem criou a sala inicia a partida.');return;}
   if(current.players.length!==2||current.players.some(v=>v.ws?.readyState!==1)){this.error(ws,'Espere seu parceiro se conectar.');return;}
   if(current.game?.status==='playing')return;
   current.round++;current.game=createGame(current.players,current.round);this.broadcast(current);return;
  }
  if(m.type==='view'){p.ready=m.ready===true;if(current.game){setReady(current.game,p.id,p.ready);this.broadcast(current);}return;}
  if(m.type==='inputs'){queueInputs(current.game,p.id,m.inputs,m.handoff);p.lastInput=this.now();}
  if(m.type==='input'){setInput(current.game,p.id,m.x,m.y,m.yaw,m.pitch,m.seq);p.lastInput=this.now();}
  if(m.type==='command'){const error=command(current.game,p.id,m);if(error)this.error(ws,error);else this.broadcast(current);}
  if(m.type==='radio'){const error=radio(current.game,p.id,m.text);if(error)this.error(ws,error);else this.broadcast(current);}
  if(m.type==='interact'&&current.game&&this.now()-p.lastAction>=220){p.lastAction=this.now();const gp=current.game.players.find(v=>v.id===p.id);if(Number.isSafeInteger(m.afterSeq)&&m.afterSeq>gp.seq&&m.afterSeq<=gp.lastQueued){p.pendingAction={seq:m.afterSeq,handoff:current.game.handoff};}else{interact(current.game,p.id);this.broadcast(current);}}
 }
 disconnect(ws){
  const room=this.rooms.get(ws.roomCode),p=room?.players.find(v=>v.id===ws.playerId&&v.ws===ws);if(!p)return;
  p.ws=null;p.disconnectedAt=this.now();room.updated=this.now();
  if(room.game){const gp=room.game.players.find(v=>v.id===p.id);gp.connected=false;setReady(room.game,p.id,false);gp.input={x:0,y:0};gp.vx=gp.vy=0;}
  this.broadcast(room);
 }
 step(dt){
  for(const room of this.rooms.values()){
   const expired=room.players.some(p=>p.disconnectedAt&&this.now()-p.disconnectedAt>this.reconnectMs);
   if(expired||(!room.game&&this.now()-room.updated>1800000)){
    room.players.forEach(p=>{if(p.ws){this.send(p.ws,{type:'ended',message:'Sala expirada. Crie outra para jogar novamente.'});p.ws.roomCode=null;}});this.rooms.delete(room.code);continue;
   }
   if(room.game){room.players.forEach(p=>{if(this.now()-p.lastInput>350)setInput(room.game,p.id,0,0);});tick(room.game,dt);for(const p of room.players){if(p.pendingAction){const gp=room.game.players.find(v=>v.id===p.id);if(p.pendingAction.handoff!==room.game.handoff)p.pendingAction=null;else if(gp.seq>=p.pendingAction.seq){p.pendingAction=null;interact(room.game,p.id);}}}}
  }
 }
}
