import * as T from '/vendor/three.module.js';
import {SUPERMARKET as L,PRODUCTS,SECTORS} from '/shared/levels.js';
import {Prediction} from '/shared/prediction.js';
import {createMarket,batchStatic,disposeOwned,makeAvatar,animateAvatar,makeProduct,worldUniforms,box,shape,material} from './models.js';
export class Renderer{
 constructor(canvas,controls,{onError=()=>{},onFrame=()=>{}}={}){
  Object.assign(this,{canvas,controls,onFrame,state:null,me:null,round:null,active:false,last:0,lastRender:0,lastUI:0,comfort:true,lightOn:true,quality:'auto',renderScale:1});
  this.mobile=matchMedia('(pointer:coarse)').matches;this.prediction=new Prediction(L);this.offset=new T.Vector2();this.remotePosition=new T.Vector3();
  this.scene=new T.Scene();this.scene.background=new T.Color('#638695');this.camera=new T.PerspectiveCamera(73,1,.09,48);this.camera.rotation.order='YXZ';this.scene.add(this.camera);
  try{this.renderer=new T.WebGLRenderer({canvas,antialias:!this.mobile,alpha:false,powerPreference:'high-performance'});}catch{onError('O 3D não iniciou. Este aparelho precisa de WebGL 2.');return;}
  this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.shadowMap.enabled=false;
  this.scene.add(new T.HemisphereLight('#e5f6ff','#778f9e',2));const sun=new T.DirectionalLight('#fff2d9',2);sun.position.set(-4,10,7);this.scene.add(sun);
  this.avatar=makeAvatar(1);this.scene.add(this.avatar);
  this.hand=new T.Group();shape(this.hand,'cylinder',[.07,.28,.07],[.24,-.28,-.42],'#edbf9e',[1.2,0,0]);shape(this.hand,'cylinder',[.11,.22,.11],[.24,-.23,-.55],'#4a7386',[Math.PI/2,0,0]);shape(this.hand,'cylinder',[.11,.03,.11],[.24,-.23,-.67],material('#ffeda7',0,true),[Math.PI/2,0,0]);this.camera.add(this.hand);
  this.held=new T.Group();this.held.position.set(-.25,-.37,-.65);this.held.scale.setScalar(.75);this.camera.add(this.held);
  this.cargo=new T.Group();this.cargo.position.set(L.belt.x,1.13,L.belt.y);this.scene.add(this.cargo);
  this.highlight=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(2.26,2.3,1.17)),new T.LineBasicMaterial({color:'#a0ffeb',transparent:true,opacity:.9}));this.highlight.visible=false;this.scene.add(this.highlight);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.active=false;controls.active=false;controls.reset();onError('O navegador interrompeu o 3D. Recarregue para retomar a sala.');});
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();requestAnimationFrame(t=>this.frame(t));
 }
 get local(){return this.prediction.local;}
 resize(){if(!this.renderer)return;const {width,height}=this.canvas.getBoundingClientRect();if(width<=0||height<=0)return;const dpr=Math.min(devicePixelRatio||1,this.mobile?1:1.5)*(this.quality==='eco'?.75:this.renderScale),key=`${width}:${height}:${dpr}`;if(this.sizeKey===key)return;this.sizeKey=key;this.renderer.setPixelRatio(dpr);this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();}
 setQuality(value){this.quality=value;this.renderScale=1;this.resize();}
 setActive(active){if(this.active===active)return;this.active=active;this.last=0;if(active)this.resize();}
 preview(){} // Menus do not spend battery rendering a 3D background.
 setState(g,id){if(!this.renderer)return;const fresh=this.round!==g.round||this.me!==id;this.state=g;this.me=id;const p=g.players.find(v=>v.id===id);if(!p)return;
  if(fresh){this.round=g.round;if(this.world){this.scene.remove(this.world);disposeOwned(this.world);}const market=createMarket(g.stock);this.world=batchStatic(market.root);disposeOwned(market.root);this.scene.add(this.world);this.holding=undefined;this.cargoKey='';this.handoff=-1;}
  const old=this.local?{x:this.local.x+this.offset.x,y:this.local.y+this.offset.y}:null;
  const reset=this.prediction.accept(p,`${g.round}:${g.handoff}`,g.paused);
  if(reset||this.handoff!==g.handoff){this.controls.reset();this.controls.yaw=p.yaw;this.controls.pitch=p.pitch;this.offset.set(0,0);this.handoff=g.handoff;}
  else if(old){this.offset.set(old.x-this.local.x,old.y-this.local.y);if(this.offset.length()>1)this.offset.set(0,0);}
  if(this.holding!==p.holding){this.holding=p.holding;disposeOwned(this.held);this.held.clear();if(p.holding){const product=makeProduct(p.holding),merged=batchStatic(product,{chunked:false});disposeOwned(product);this.held.add(merged);}}
  const key=(g.pending?.item||'')+':'+g.pending?.status;if(key!==this.cargoKey){this.cargoKey=key;disposeOwned(this.cargo);this.cargo.clear();if(g.pending){const product=g.pending.item?makeProduct(g.pending.item):new T.Group();if(!g.pending.item)box(product,[.4,.32,.4],[0,.16,0],'#d9ba8d');this.cargo.add(batchStatic(product,{chunked:false}));disposeOwned(product);}}
 }
 setHighlight(shelf){this.highlight.visible=!!shelf;if(shelf){this.highlight.position.set(shelf.x,1.16,shelf.y);this.highlight.rotation.y=shelf.rotation;this.highlight.scale.z=shelf.sector==='D'?1.62:1;}}
 drainInputs(){return this.prediction.drain();}
 frame(t){requestAnimationFrame(v=>this.frame(v));if(!this.renderer||!this.active||document.hidden){this.last=t;return;}const dt=Math.min(.1,(t-this.last)/1000||1/60);this.last=t;const g=this.state;if(!g||!this.local)return;
  const input=this.controls.read(dt);if(g.status==='playing'&&!g.paused)this.prediction.advance(dt,input);
  this.offset.multiplyScalar(Math.exp(-dt*18));this.camera.position.set(this.local.x+this.offset.x,1.65,this.local.y+this.offset.y);this.camera.rotation.set(this.controls.pitch,this.controls.yaw,0,'YXZ');
  if(t-this.lastUI>100){this.lastUI=t;this.onFrame({local:this.local,input,camera:this.camera});}
  const fps=this.mobile||this.quality==='eco'?30:60;if(t-this.lastRender<1000/fps-1)return;const elapsed=t-this.lastRender;this.lastRender=t;
  // Reduce resolution on sustained slow rendering; never rebuild the drawing buffer per snapshot.
  if(this.mobile&&this.quality==='auto'){this.slowFrames=elapsed>49?(this.slowFrames||0)+1:Math.max(0,(this.slowFrames||0)-1);if(this.slowFrames>45&&this.renderScale>.75){this.renderScale-=.125;this.slowFrames=0;this.resize();}}
  const other=g.players.find(v=>v.id!==this.me);if(other){this.avatar.position.lerp(this.remotePosition.set(other.x,0,other.y),Math.min(1,elapsed/90));this.avatar.rotation.y=other.yaw;animateAvatar(this.avatar,other,t/1000);}
  worldUniforms.power.value=g.power==='belt'?5:SECTORS.findIndex(s=>s.id===g.power)+1;worldUniforms.blackout.value=g.event?1:0;worldUniforms.torch.value=this.lightOn?1:0;worldUniforms.eye.value.copy(this.camera.position);this.camera.getWorldDirection(worldUniforms.look.value);
  const bob=this.comfort?0:Math.sin(t*.008)*Math.min(.012,Math.hypot(this.local.vx,this.local.vy)*.004);this.hand.position.y=bob;this.held.position.y=-.37+bob;
  this.renderer.render(this.scene,this.camera);
 }
}
