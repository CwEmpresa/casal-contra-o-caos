import test from 'node:test';import assert from 'node:assert/strict';
import {Prediction} from '../shared/prediction.js';import {SUPERMARKET as L} from '../shared/levels.js';import {createGame,queueInputs,tick,setReady,viewFor} from '../server/game.js';import {STEP,distance} from '../shared/geometry.js';
const people=[{id:'one',name:'Ana'},{id:'two',name:'Leo'}];
test('prediction replays unacknowledged input with 200 ms latency, without pulling the player backwards',()=>{
 const g=createGame(people),p=g.players[1];p.x=15;p.y=18;const pred=new Prediction(L);pred.accept(p,g.handoff);let packet=[],snapshots=[],worstCorrection=0;
 for(let frame=0;frame<240;frame++){
  pred.advance(STEP,{x:0,y:-1,yaw:0,pitch:0});
  if(frame%3===2)packet.push({at:frame+6,inputs:pred.drain()});
  for(const m of packet.filter(m=>m.at===frame))queueInputs(g,p.id,m.inputs,g.handoff);
  tick(g,STEP);
  if(frame%4===0)snapshots.push({at:frame+6,p:{...p}});
  for(const m of snapshots.filter(m=>m.at===frame)){const before={...pred.local};pred.accept(m.p,g.handoff);worstCorrection=Math.max(worstCorrection,distance(before,pred.local));}
 }
 assert.ok(worstCorrection<1e-8,`position drift ${worstCorrection}`);assert.ok(pred.pending.length<25);assert.ok(pred.local.y<6);
});
test('input batches are bounded, sanitized and limited by elapsed server time',()=>{
 const g=createGame(people),p=g.players[1],start={...p};queueInputs(g,p.id,Array.from({length:13},(_,i)=>({seq:i+1,x:1,y:0,yaw:0,pitch:0})),g.handoff);assert.equal(p.queue.length,0);
 queueInputs(g,p.id,[{seq:1,x:Infinity,y:0,yaw:0,pitch:0}],g.handoff);assert.equal(p.queue.length,0);
 for(let i=0;i<10;i++)queueInputs(g,p.id,Array.from({length:12},(_,j)=>({seq:i*12+j+1,x:1000,y:0,yaw:0,pitch:0})),g.handoff);
 tick(g,.1);assert.ok(distance(start,p)<.33);assert.equal(p.seq,6);assert.ok(p.queue.length<=120);
 const view=viewFor(g,p.id);for(const key of ['queue','credit','lastQueued','batch'])assert.equal(key in view.players[1],false);
});
test('portrait/background readiness pauses both clocks and discards queued movement',()=>{
 const g=createGame(people),p=g.players[1];queueInputs(g,p.id,[{seq:1,x:1,y:0,yaw:0,pitch:0}],g.handoff);setReady(g,p.id,false);const before=JSON.stringify([g.time,g.elapsed,p.x,p.y]);tick(g,10);assert.equal(JSON.stringify([g.time,g.elapsed,p.x,p.y]),before);assert.equal(p.queue.length,0);assert.equal(viewFor(g,'one').paused,true);
 queueInputs(g,p.id,[{seq:2,x:1,y:0,yaw:0,pitch:0}],g.handoff);assert.equal(p.queue.length,0);setReady(g,p.id,true);tick(g,STEP);assert.equal(p.x,JSON.parse(before)[2]);assert.equal(viewFor(g,'one').paused,false);
});
