import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,interact,tick,setInput,beginEvent,command,radio,viewFor} from '../server/game.js';
import {SUPERMARKET as L,PRODUCTS,SECTORS,ROUTES,SYMBOLS} from '../shared/levels.js';
import {collides,distance,roles,inside,move} from '../shared/geometry.js';
const people=[{id:'one',name:'Ana'},{id:'two',name:'Leo'}];
const seeded=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function route(from,to,g){
 const step=.4,key=(x,y)=>`${x},${y}`,start=[Math.round(from.x/step),Math.round(from.y/step)],queue=[start],seen=new Map([[key(...start),null]]);let end;
 for(let i=0;i<queue.length;i++){const [x,y]=queue[i];if(Math.hypot(x*step-to.x,y*step-to.y)<.29){end=[x,y];break;}
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,k=key(xx,yy);if(!seen.has(k)&&!collides(xx*step,yy*step,L,g,.3)){seen.set(k,[x,y]);queue.push([xx,yy]);}}}
 assert.ok(end,`route from ${JSON.stringify(from)} to ${JSON.stringify(to)}`);const path=[];while(end){path.push({x:end[0]*step,y:end[1]*step});end=seen.get(key(...end));}return path.reverse();
}
function look(p,target){p.yaw=Math.atan2(-(target.x-p.x),-(target.y-p.y));}
function walk(g,id,target){const p=g.players.find(v=>v.id===id);for(const waypoint of route(p,target,g)){let n=0;while(distance(p,waypoint)>.12&&n++<180){const dx=waypoint.x-p.x,dy=waypoint.y-p.y,d=Math.hypot(dx,dy);setInput(g,p.id,dx/d,dy/d);tick(g,1/60,()=>.5);}assert.ok(n<180,`physical route stalled at ${p.x},${p.y} toward ${waypoint.x},${waypoint.y}`);}setInput(g,p.id,0,0);for(let i=0;i<12;i++)tick(g,1/60,()=>.5);look(p,target);}
const run=(g,action,rest={})=>command(g,roles(g).operator,{action,stage:g.stage,...rest});
function pickupOrder(g){
 const {shopper,operator}=roles(g),p=g.players.find(v=>v.id===shopper),order=viewFor(g,operator).order,target=PRODUCTS.find(v=>v.description===order.description),s=SECTORS.find(v=>v.id===order.sector);
 walk(g,shopper,{x:s.gate.x,y:s.gate.y+1.15});look(p,s.gate);const reading=viewFor(g,shopper).observation;assert.equal(reading.kind,'gate');
 assert.equal(run(g,'brief'),null);assert.equal(viewFor(g,shopper).sharedBrief.description,order.description);assert.equal(run(g,'power',{sector:s.id}),null);assert.equal(run(g,'gate',{code:reading.code}),null);
 const shelf=L.shelves[g.stock.indexOf(target.id)];walk(g,shopper,shelf.approach);look(p,shelf);interact(g,shopper);assert.equal(p.holding,target.id);
 run(g,'power',{sector:null});walk(g,shopper,{x:L.belt.x,y:L.belt.y-1.35});look(p,L.belt);interact(g,shopper);assert.equal(g.pending.item,target.id);return {shopper,operator};
}
test('complete cooperative mission by physical movement, private readings, six deliveries, handoff and synchronized checkout',()=>{
 const g=createGame(people,1,seeded(23));g.nextEvent=10000;const firstOperator=roles(g).operator;
 for(let turn=0;turn<6;turn++){
  const {shopper,operator}=pickupOrder(g),reading=viewFor(g,shopper).observation;assert.equal(reading.kind,'cargo');assert.equal(viewFor(g,operator).pending.item,undefined);
  assert.equal(run(g,'power',{sector:'belt'}),null);assert.equal(run(g,'route',{route:viewFor(g,operator).routing[reading.symbol]}),null);assert.equal(g.stage,turn+1);
  assert.equal(roles(g).operator,turn<2?firstOperator:people.find(v=>v.id!==firstOperator).id);
 }
 const shopper=g.players.find(v=>v.id===roles(g).shopper);walk(g,shopper.id,{x:L.checkout.x,y:L.checkout.y-.2});look(shopper,L.checkout);interact(g,shopper.id);run(g,'checkout');assert.equal(g.checkedOut,true);
 walk(g,shopper.id,{x:L.exit.x,y:L.exit.y-.3});look(shopper,L.exit);interact(g,shopper.id);assert.equal(g.status,'won');assert.equal(g.errors,0);assert.ok(g.players.every(p=>p.contribution===6));assert.ok(g.time>0);
});
test('privacy: future orders, gate codes and cargo symbol are role- and proximity-limited',()=>{
 const g=createGame(people),{operator,shopper}=roles(g),a=viewFor(g,operator),b=viewFor(g,shopper);
 for(const v of [a,b])for(const secret of ['list','codes','cargoSymbol','resetCode','routeMap','lastRadio','checkoutUntil'])assert.equal(Object.hasOwn(v,secret),false,secret);
 assert.ok(a.order.description);assert.equal(b.order,null);assert.equal(b.routing,null);assert.equal(a.observation,null);assert.equal(b.observation,null);assert.equal(Object.hasOwn(a.order,'id'),false);
 const p=g.players.find(p=>p.id===shopper);Object.assign(p,{x:SECTORS[0].gate.x,y:SECTORS[0].gate.y+1.1});look(p,SECTORS[0].gate);assert.equal(viewFor(g,shopper).observation.code,g.codes.A);assert.equal(viewFor(g,operator).observation,null);
 p.y=10;assert.equal(viewFor(g,shopper).observation,null);assert.equal(Object.hasOwn(a.players[0],'input'),false);
});
test('operator command permission, station distance, stale stage and invalid parameters',()=>{
 const g=createGame(people),{shopper,operator}=roles(g);assert.match(command(g,shopper,{action:'power',sector:'A',stage:0}),/Somente/);assert.match(command(g,operator,{action:'power',sector:'A',stage:3}),/mudou/);assert.match(run(g,'power',{sector:'bad'}),/desconhecido/);
 assert.match(run(g,'gate',{code:'123'}),/Ligue/);g.players.find(p=>p.id===operator).x=12;assert.match(run(g,'power',{sector:'A'}),/console/);assert.equal(g.power,null);
});
test('sector access needs power and a code, expires, and never traps shoppers in aisles',()=>{
 const g=createGame(people),p=g.players[1],s=L.shelves[0];run(g,'power',{sector:'A'});run(g,'gate',{code:'000'});assert.equal(g.errors,1);assert.equal(g.time,588);
 Object.assign(p,s.approach);look(p,s);interact(g,p.id);assert.equal(p.holding,null);
 run(g,'gate',{code:g.codes.A});interact(g,p.id);assert.equal(p.holding,'milk');interact(g,p.id);assert.equal(p.holding,null);
 for(let i=0;i<41;i++)tick(g,1);assert.equal(g.gates[0].remaining,0);interact(g,p.id);assert.equal(p.holding,null);
 for(const shelf of L.shelves)assert.ok(route(L.spawns[1],shelf.approach,g).length>0);
 run(g,'power',{sector:'B'});assert.equal(g.power,'B');
});
test('wrong variant, route and timed-out cargo are recoverable; none advance the order',()=>{
 const g=createGame(people,1,seeded(1));g.nextEvent=10000;const {shopper,operator}=pickupOrder(g),p=g.players.find(v=>v.id===shopper),good=g.pending.item;
 run(g,'power',{sector:'belt'});const correct=viewFor(g,operator).routing[viewFor(g,shopper).observation.symbol];const wrong=ROUTES.find(v=>v!==correct);run(g,'route',{route:wrong});assert.equal(g.stage,0);assert.equal(g.pending.status,'rejected');interact(g,shopper);assert.equal(p.holding,good);interact(g,shopper);
 g.pending.item=PRODUCTS.find(v=>v.base===PRODUCTS.find(x=>x.id===good).base&&v.id!==good).id;run(g,'route',{route:correct});assert.equal(g.stage,0);assert.equal(g.errors,2);interact(g,shopper);interact(g,shopper);g.pending.remaining=.1;tick(g,.2);assert.equal(g.pending.status,'rejected');assert.equal(g.errors,3);
});
test('products require correct sector power and only shopper can collect',()=>{
 const g=createGame(people),p=g.players.find(p=>p.id===roles(g).shopper),op=g.players.find(p=>p.id===roles(g).operator),s=L.shelves[0];Object.assign(p,{x:s.x,y:s.y+1.3});look(p,s);interact(g,p.id);assert.equal(p.holding,null);run(g,'power',{sector:'A'});run(g,'gate',{code:g.codes.A});interact(g,p.id);assert.equal(p.holding,'milk');Object.assign(op,{x:s.x,y:s.y+1.3});look(op,s);interact(g,op.id);assert.equal(op.holding,null);
});
test('overload requires a private relay reading and operator reset, or automatic cooldown',()=>{
 const g=createGame(people);run(g,'power',{sector:'A'});beginEvent(g);assert.equal(g.power,null);assert.match(run(g,'power',{sector:'A'}),/bloqueada/);const p=g.players.find(p=>p.id===roles(g).shopper);Object.assign(p,{x:L.relay.x,y:L.relay.y+1});look(p,L.relay);const code=viewFor(g,p.id).observation.code;assert.ok(code);assert.equal(run(g,'reset',{code}),null);assert.equal(g.event,null);assert.equal(g.eventCount,1);assert.equal(g.heat,20);
 beginEvent(g);tick(g,18);assert.equal(g.event,null);assert.equal(g.heat,25);g.stage=1;g.nextEvent=100;g.heat=99.9;run(g,'power',{sector:'D'});tick(g,.2);assert.equal(g.event.type,'overload');
});
test('radio sanitizes length, rate-limits messages, retains eight and pauses with disconnect',()=>{
 const g=createGame(people);assert.ok(radio(g,'one',''));assert.ok(radio(g,'one','x'.repeat(141)));assert.equal(radio(g,'one','A: 123'),null);assert.ok(radio(g,'one','spam'));for(let i=0;i<9;i++){tick(g,.8);assert.equal(radio(g,'two','Mensagem '+i),null);}assert.equal(g.radio.length,8);g.players[1].connected=false;assert.ok(radio(g,'one','pausado'));
});
test('checkout needs fresh confirmations at both posts; disconnected simulation and timers freeze',()=>{
 const g=createGame(people);g.stage=6;const shopper=g.players.find(p=>p.id===roles(g).shopper),op=g.players.find(p=>p.id===roles(g).operator);Object.assign(op,L.spawns[0]);Object.assign(shopper,{x:L.checkout.x,y:L.checkout.y-.4});look(shopper,L.checkout);
 run(g,'checkout');tick(g,4.1);interact(g,shopper.id);assert.equal(g.checkedOut,false);run(g,'checkout');assert.equal(g.checkedOut,true);
 beginEvent(g);const before=JSON.stringify(g);g.players[0].connected=false;const t=g.time;tick(g,3);assert.equal(g.time,t);g.players[0].connected=true;g.time=.1;tick(g,.2);assert.equal(g.status,'lost');assert.equal(viewFor(g,'one').result.answers.length,6);
});
test('finite movement, no tunneling, operator remains inside control room, every stock accessible with open gates',()=>{
 const g=createGame(people);g.nextEvent=10000;setInput(g,'one',10000,-10000,1000,100,5);assert.ok(Math.hypot(g.players[0].input.x,g.players[0].input.y)<=1.0001);assert.equal(g.players[0].pitch,1.05);for(let i=0;i<600;i++)tick(g,1/60);assert.ok(inside(g.players[0],{x:0,y:22,w:7,h:6}));setInput(g,'one',NaN,Infinity);assert.ok(Number.isFinite(g.players[0].input.x));
 const p={x:14,y:9};move(p,-20,0,L,g);assert.ok(p.x>13.3);for(const s of L.shelves)assert.ok(route(L.spawns[1],s.approach,g).length>0);
 for(let i=0;i<100;i++){const r=createGame(people,1+i%2,seeded(i));assert.equal(new Set(r.list).size,6);assert.ok(r.list.every(id=>r.stock.includes(id)));assert.equal(new Set(Object.values(r.routeMap)).size,4);assert.equal(Object.keys(r.codes).length,4);assert.equal(new Set(r.stock).size,16);}
});
