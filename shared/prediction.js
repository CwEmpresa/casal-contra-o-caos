import {STEP,stepPlayer} from './geometry.js';
export class Prediction{
 constructor(level){this.level=level;this.pending=[];this.unsent=[];this.seq=0;this.epoch=null;this.local=null;this.accumulator=0;}
 accept(player,epoch,paused=false){
  if(this.epoch!==epoch||!this.local||paused){this.epoch=epoch;this.pending=[];this.unsent=[];this.seq=player.seq||0;this.accumulator=0;this.local={...player,vx:player.vx||0,vy:player.vy||0};return true;}
  this.pending=this.pending.filter(c=>c.seq>player.seq);this.seq=Math.max(this.seq,player.seq);
  this.local={...player};for(const input of this.pending)stepPlayer(this.local,input,this.level);
  return false;
 }
 advance(dt,input){if(!this.local)return;this.accumulator=Math.min(.1,this.accumulator+dt);
  while(this.accumulator>=STEP&&this.pending.length<180){const c={x:Math.round(input.x*10000)/10000,y:Math.round(input.y*10000)/10000,yaw:input.yaw,pitch:input.pitch,seq:++this.seq};const n=Math.max(1,Math.hypot(c.x,c.y));c.x/=n;c.y/=n;this.pending.push(c);this.unsent.push(c);stepPlayer(this.local,c,this.level);this.accumulator-=STEP;}
 }
 drain(){return this.unsent.splice(0,12);}
}
