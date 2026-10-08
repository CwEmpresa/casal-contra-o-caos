import {clamp} from '/shared/geometry.js';
export class Controls{
 constructor({canvas,stick,knob,action,onAction}){
  this.canvas=canvas;this.knob=knob;this.vector={x:0,y:0};this.keys=new Set();this.stickPointer=null;this.lookPointer=null;this.active=false;this.yaw=0;this.pitch=0;this.sensitivity=.0031;
  const stickUpdate=e=>{const r=stick.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,n=Math.max(1,Math.hypot(x,y)/36);this.vector={x:x/n/36,y:y/n/36};knob.style.transform=`translate(${x/n}px,${y/n}px)`;};
  stick.addEventListener('pointerdown',e=>{if(!this.active)return;e.preventDefault();e.stopPropagation();this.stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);stickUpdate(e);});
  stick.addEventListener('pointermove',e=>{if(e.pointerId===this.stickPointer)stickUpdate(e);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,e=>{if(e.pointerId===this.stickPointer){this.stickPointer=null;this.vector={x:0,y:0};knob.style.transform='translate(0,0)';}});
  canvas.addEventListener('pointerdown',e=>{if(!this.active)return;e.preventDefault();if(e.pointerType==='mouse'&&document.pointerLockElement!==canvas){canvas.requestPointerLock?.()?.catch?.(()=>{});}this.lookPointer=e.pointerId;this.lastX=e.clientX;this.lastY=e.clientY;try{canvas.setPointerCapture(e.pointerId);}catch{}});
  canvas.addEventListener('pointermove',e=>{if(!this.active||document.pointerLockElement===canvas)return;if(e.pointerId===this.lookPointer){this.look(e.clientX-this.lastX,e.clientY-this.lastY,e.pointerType==='mouse'?1:1.2);this.lastX=e.clientX;this.lastY=e.clientY;}});
  document.addEventListener('mousemove',e=>{if(this.active&&document.pointerLockElement===canvas)this.look(e.movementX,e.movementY);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(e.pointerId===this.lookPointer)this.lookPointer=null;});
  action.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(this.active)onAction();});
  window.addEventListener('keydown',e=>{if(!this.active||/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName))return;const key=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e',' '].includes(key))e.preventDefault();this.keys.add(key);if((key==='e'||key===' ')&&!e.repeat)onAction();});
  window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>this.reset());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.reset();});
 }
 look(dx,dy,factor=1){this.yaw-=dx*this.sensitivity*factor;this.pitch=clamp(this.pitch-dy*this.sensitivity*factor,-1.05,1.05);}
 reset(){this.keys.clear();this.vector={x:0,y:0};this.stickPointer=this.lookPointer=null;this.knob.style.transform='translate(0,0)';}
 read(dt=0){if(!this.active)return {x:0,y:0,yaw:this.yaw,pitch:this.pitch};if(this.keys.has('arrowleft'))this.yaw+=dt*1.7;if(this.keys.has('arrowright'))this.yaw-=dt*1.7;
  let {x,y}=this.vector;if(this.stickPointer===null){x=Number(this.keys.has('d'))-Number(this.keys.has('a'));y=Number(this.keys.has('s')||this.keys.has('arrowdown'))-Number(this.keys.has('w')||this.keys.has('arrowup'));}
  const n=Math.max(1,Math.hypot(x,y));x/=n;y/=n;return {x:Math.cos(this.yaw)*x+Math.sin(this.yaw)*y,y:-Math.sin(this.yaw)*x+Math.cos(this.yaw)*y,yaw:this.yaw,pitch:this.pitch};
 }
 unlock(){if(document.pointerLockElement)document.exitPointerLock();this.reset();}
}
