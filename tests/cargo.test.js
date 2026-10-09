import test from 'node:test';
import assert from 'node:assert/strict';
import {cargoGuidance} from '../shared/cargo.js';
test('conveyor always explains blocked routes and preserves the correct recovery for each rejection',()=>{
 const g={pending:{status:'waiting',remaining:25},power:'B',paused:false,event:null};
 assert.equal(cargoGuidance(g).canPower,true);assert.equal(cargoGuidance(g).canRoute,false);assert.match(cargoGuidance(g).detail,/Ligar esteira/);
 g.power='belt';assert.equal(cargoGuidance(g).canRoute,true);assert.equal(cargoGuidance(g).canPower,false);
 g.event={type:'overload'};assert.equal(cargoGuidance(g).canRoute,false);assert.match(cargoGuidance(g).detail,/Rearme/);g.event=null;
 g.paused=true;assert.equal(cargoGuidance(g).canRoute,false);assert.equal(cargoGuidance(g).kind,'paused');g.paused=false;
 g.pending.status='rejected';g.pending.remaining=0;assert.match(cargoGuidance(g).detail,/prazo.*esgotou/);assert.equal(cargoGuidance(g).canRoute,false);assert.equal(cargoGuidance(g).canPower,false);
 for(const reason of ['timeout','route','product']){g.pending.reason=reason;const help=cargoGuidance(g);assert.match(help.shopper,/Retire a carga/);assert.equal(help.canRoute,false);assert.equal(help.canPower,false);if(reason==='product')assert.match(help.shopper,/prateleira/);else assert.match(help.shopper,/deposite novamente/);}
 g.pending=null;assert.equal(cargoGuidance(g).kind,'idle');
});
