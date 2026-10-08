import {LEVELS,PRODUCTS,SECTORS,SYMBOLS,ROUTES} from '../shared/levels.js';
import {distance,move,roles,actionFor,clamp,facing} from '../shared/geometry.js';
const shuffle=(arr,rng)=>{const c=[...arr];for(let i=c.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[c[i],c[j]]=[c[j],c[i]];}return c;};
function credentials(g,rng=Math.random){g.codes=Object.fromEntries(SECTORS.map(s=>[s.id,String(Math.floor(rng()*900)+100)]));const routes=shuffle(ROUTES,rng);g.routeMap=Object.fromEntries(SYMBOLS.map((s,i)=>[s,routes[i]]));g.cargoSymbol=SYMBOLS[Math.floor(rng()*SYMBOLS.length)];}
function placeRoles(g){const role=roles(g),L=LEVELS[g.levelId];g.players.forEach(p=>{Object.assign(p,L.spawns[p.id===role.operator?0:1],{yaw:0,pitch:0,vx:0,vy:0,input:{x:0,y:0},holding:null});});g.handoff++;}
export function createGame(players,round=1,rng=Math.random,levelId='supermarket'){
 if(!LEVELS[levelId])throw new Error('Fase desconhecida');const sectors=shuffle(SECTORS,rng);const orderSectors=[...sectors,...sectors.slice(0,2)];const list=[];
 for(const s of orderSectors)list.push(shuffle(PRODUCTS.filter(p=>p.sector===s.id&&!list.includes(p.id)),rng)[0].id);
 const g={levelId,round,status:'playing',time:600,elapsed:0,errors:0,eventCount:0,cooperation:0,players:players.map(p=>({id:p.id,name:p.name,x:0,y:0,yaw:0,pitch:0,input:{x:0,y:0},vx:0,vy:0,holding:null,connected:true,contribution:0,seq:0})),
 list,total:6,stage:0,stock:PRODUCTS.map(p=>p.id),collected:[],power:null,heat:0,gates:SECTORS.map(s=>({id:s.id,...s.gate,remaining:0})),sectors:SECTORS,pending:null,radio:[],radioSeq:0,lastRadio:{},
 checkoutUntil:{},checkedOut:false,handoff:0,event:null,nextEvent:65,resetCode:'',notice:'Operador: leia o pedido e escolha um setor. Comprador: comunique o código da porta pelo rádio.',noticeSeq:1,sound:'start',result:null};
 credentials(g,rng);placeRoles(g);return g;
}
export function announce(g,text,sound='click'){g.notice=text;g.noticeSeq++;g.sound=sound;}
function fail(g,message){g.errors++;g.time=Math.max(0,g.time-12);announce(g,message+' −12 segundos.','error');}
const playable=g=>g?.status==='playing'&&g.players.every(p=>p.connected);
export function radio(g,id,text){if(!playable(g))return 'Aguarde a conexão do seu parceiro.';const message=String(text||'').trim().replace(/\s+/g,' ');if(!message||message.length>140)return 'Use de 1 a 140 caracteres.';if(g.elapsed-(g.lastRadio[id]??-10)<.7)return 'Espere um instante antes de transmitir novamente.';g.lastRadio[id]=g.elapsed;g.radio.push({id:++g.radioSeq,by:id,text:message});g.radio=g.radio.slice(-8);return null;}
export function observation(g,id){const p=g.players.find(p=>p.id===id),L=LEVELS[g.levelId];if(roles(g).shopper!==id)return null;
 const gate=g.gates.find(v=>facing(p,v,1.95));if(gate)return {kind:'gate',id:gate.id,code:g.codes[gate.id],text:`Porta ${gate.id} · código ${g.codes[gate.id]}`};
 if(g.event&&facing(p,L.relay,1.8))return {kind:'relay',code:g.resetCode,text:`Rearme elétrico · código ${g.resetCode}`};
 if(g.pending&&facing(p,L.belt,2))return {kind:'cargo',symbol:g.cargoSymbol,text:`Carga · símbolo ${g.cargoSymbol}`};return null;
}
// Explicit projection prevents future orders, door codes and cargo symbols leaking to the other role.
export function viewFor(g,id){
 if(!g)return null;const role=roles(g),operator=role.operator===id,target=PRODUCTS.find(p=>p.id===g.list[g.stage]);
 const {list,codes,routeMap,cargoSymbol,resetCode,lastRadio,checkoutUntil,...pub}=g;
 return {...pub,players:g.players.map(({input,holding,...p})=>({...p,holding:operator&&p.id!==id?null:holding})),role,
 pending:g.pending?{status:g.pending.status,remaining:g.pending.remaining,...(!operator?{item:g.pending.item}: {})}:null,
 order:operator&&target?{sector:target.sector,description:target.description}:null,routing:operator?routeMap:null,
 observation:observation(g,id),checkoutReady:Object.fromEntries(g.players.map(p=>[p.id,Math.max(0,(checkoutUntil[p.id]||0)-g.elapsed)])),result:g.result?{...g.result,answers:[...list]}:null};
}
export function command(g,id,m){
 if(!playable(g))return 'Aguarde a partida continuar.';const p=g.players.find(p=>p.id===id),L=LEVELS[g.levelId];
 if(roles(g).operator!==id)return 'Somente o Operador pode usar a central.';if(distance(p,L.console)>3)return 'Volte ao console da central.';
 if(m.stage!==g.stage)return 'O pedido mudou. Confira a central.';
 if(m.action==='power'){
  if(m.sector!==null&&!['A','B','C','D','belt'].includes(m.sector))return 'Circuito desconhecido.';
  if(g.event&&m.sector!==null)return 'Energia bloqueada: peça o código de rearme ao Comprador.';
  g.power=m.sector;announce(g,m.sector?`Circuito ${m.sector==='belt'?'ESTEIRA':m.sector} energizado. Os outros setores estão sem energia.`:'Energia desligada. O sistema está resfriando.');return null;
 }
 if(m.action==='gate'){
  const gate=g.gates.find(v=>v.id===g.power);if(!gate)return 'Energize primeiro o setor da porta.';
  if(String(m.code)!==g.codes[gate.id]){fail(g,'Código incorreto. Peça a leitura da placa da porta');return null;}
  gate.remaining=g.stage<3?20:14;g.cooperation++;announce(g,`Porta ${gate.id} liberada por ${gate.remaining}s. Por dentro, E aciona a saída de emergência.`,'success');return null;
 }
 if(m.action==='reset'){
  if(!g.event)return 'O circuito já está funcionando.';if(String(m.code)!==g.resetCode){fail(g,'Código de rearme incorreto');return null;}
  g.event=null;g.heat=20;g.eventCount++;g.nextEvent=60;announce(g,'Circuito rearmado em dupla. Selecione a energia novamente.','success');return null;
 }
 if(m.action==='route'){
  if(!g.pending||g.pending.status!=='waiting')return 'Aguarde uma carga na esteira.';
  if(g.power!=='belt'||g.event)return 'Energize a esteira antes de encaminhar a carga.';
  if(!ROUTES.includes(m.route))return 'Destino desconhecido.';
  if(m.route!==g.routeMap[g.cargoSymbol]||g.pending.item!==g.list[g.stage]){g.pending.status='rejected';fail(g,'Carga devolvida. Confiram embalagem, quantidade e rota');return null;}
  const shopper=g.players.find(p=>p.id===roles(g).shopper);shopper.contribution++;p.contribution++;g.collected.push(g.pending.item);g.pending=null;g.stage++;g.cooperation+=3;g.power=null;g.gates.forEach(v=>v.remaining=0);credentials(g);
  if(g.stage===3){placeRoles(g);announce(g,'Três entregas! Troca de turno: vocês trocaram de posto. Agora as portas ficam abertas por menos tempo.','deposit');}
  else if(g.stage===g.total)announce(g,'Seis entregas! Comprador: vá ao caixa. Operador: confirme junto, dentro de 4 segundos.','deposit');
  else announce(g,'Entrega aceita! Novo pedido e novos códigos.','deposit');return null;
 }
 if(m.action==='checkout')return checkout(g,p);
 return 'Comando desconhecido.';
}
function checkout(g,p){if(g.stage<g.total||g.checkedOut)return 'Complete as seis entregas primeiro.';g.checkoutUntil[p.id]=g.elapsed+4;
 if(g.players.every(v=>(g.checkoutUntil[v.id]||0)>g.elapsed)){g.checkedOut=true;g.cooperation+=2;announce(g,'Pagamento autorizado em dupla! Comprador: leve o recibo à saída verde.','success');}else announce(g,'Confirmação ativa por 4 segundos. Seu parceiro precisa confirmar agora.');return null;
}
export function interact(g,id){
 if(!playable(g))return;const p=g.players.find(p=>p.id===id);if(!p)return;const L=LEVELS[g.levelId],a=actionFor(g,p,L);if(!a)return;
 if(a.type==='pickup'){const sector=L.shelves[a.shelf].sector;if(g.power!==sector||g.event){announce(g,`Peça à central energia no setor ${sector} para liberar o expositor.`);return;}if(g.pending){announce(g,'Resolva a carga da esteira antes de buscar outro item.');return;}p.holding=g.stock[a.shelf];announce(g,'Confira variante, quantidade e selo. Leve o produto à esteira.','pickup');}
 if(a.type==='return'){p.holding=null;announce(g,'Produto devolvido.','pickup');}
 if(a.type==='egress'){g.gates.find(v=>v.id===a.gate).remaining=5;announce(g,'Saída de emergência aberta por 5 segundos.');}
 if(a.type==='deposit'){g.pending={item:p.holding,status:'waiting',remaining:g.stage<3?45:32};p.holding=null;announce(g,'Leia o símbolo da carga. A central precisa ligar a esteira e selecionar a rota.','pickup');}
 if(a.type==='recover'){p.holding=g.pending.item;g.pending=null;announce(g,'Carga recuperada. Troque o item ou deposite novamente para corrigir a rota.','pickup');}
 if(a.type==='checkout')checkout(g,p);
 if(a.type==='exit')finish(g,true);
}
export function beginEvent(g,type='overload',rng=Math.random){if(type!=='overload'||g.stage>=g.total)return;g.event={type:'overload',remaining:18};g.power=null;g.resetCode=String(Math.floor(rng()*900)+100);announce(g,'Sobrecarga! Leiam o código no painel do cruzamento central para rearmar. Ou aguardem 18s de resfriamento.','event');}
export function tick(g,dt,rng=Math.random){
 if(!playable(g))return;const L=LEVELS[g.levelId];g.elapsed+=dt;g.time=Math.max(0,g.time-dt);if(!g.time){finish(g,false);return;}
 for(const p of g.players){const speed=p.holding?2.7:3.2,blend=1-Math.exp(-dt*16);p.vx+=(p.input.x*speed-p.vx)*blend;p.vy+=(p.input.y*speed-p.vy)*blend;move(p,p.vx*dt,p.vy*dt,L,g);}
 for(const gate of g.gates){gate.remaining=Math.max(0,gate.remaining-dt);if(!gate.remaining&&g.players.some(p=>Math.abs(p.x-gate.x)<.5&&Math.abs(p.y-gate.y)<1.65))gate.remaining=.2;}
 if(g.pending?.status==='waiting'){g.pending.remaining=Math.max(0,g.pending.remaining-dt);if(!g.pending.remaining){g.pending.status='rejected';fail(g,'Tempo da esteira esgotado. Retire e deposite a carga novamente');}}
 g.heat=clamp(g.heat+dt*(g.power ? .75 : -3.2),0,100);
 if(g.event){g.event.remaining-=dt;if(g.event.remaining<=0){g.event=null;g.heat=25;g.nextEvent=65;announce(g,'Resfriamento concluído. A central pode religar a energia.');}}
 else if(g.stage<g.total){g.nextEvent-=dt;if(g.heat>=100||g.nextEvent<=0)beginEvent(g,'overload',rng);}
}
export function finish(g,won){if(g.status!=='playing')return;const score=Math.max(0,Math.round(g.collected.length*1200+g.time*8+g.eventCount*150-g.errors*250));g.status=won?'won':'lost';g.result={won,score,time:Math.floor(g.time),elapsed:Math.floor(g.elapsed),errors:g.errors,events:g.eventCount,cooperation:g.cooperation,stars:won?(score>=9800?3:score>=8000?2:1):0};announce(g,won?'Compra concluída em dupla!':'O mercado fechou!',won?'win':'lose');}
export function setInput(g,id,x,y,yaw,pitch,seq){const p=g?.players.find(p=>p.id===id);if(!p||!Number.isFinite(x)||!Number.isFinite(y))return;const n=Math.max(1,Math.hypot(x,y));p.input={x:x/n,y:y/n};if(Number.isFinite(yaw))p.yaw=((yaw+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;if(Number.isFinite(pitch))p.pitch=clamp(pitch,-1.05,1.05);if(Number.isSafeInteger(seq)&&seq>=0)p.seq=Math.max(p.seq,seq);}
