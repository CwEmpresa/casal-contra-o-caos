import * as T from '/vendor/three.module.js';
import {SUPERMARKET as L,PRODUCTS,SECTORS} from '/shared/levels.js';
import {move,distance} from '/shared/geometry.js';
import {createMarket,batchStatic,disposeOwned,makeAvatar,animateAvatar,makeCart,makeProduct,makeGate,shape,box,material,label} from './models.js';
const lerpAngle=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
export class Renderer{
 constructor(canvas,controls,{onError=()=>{},onFrame=()=>{}}={}){
  Object.assign(this,{canvas,controls,onFrame,state:null,me:null,round:null,active:false,last:0,bob:0,comfort:true,lightOn:true});this.positions=new Map();
  this.scene=new T.Scene();this.scene.background=new T.Color('#081218');this.scene.fog=new T.FogExp2('#081218',.027);
  this.camera=new T.PerspectiveCamera(73,1,.07,65);this.camera.rotation.order='YXZ';this.scene.add(this.camera);
  try{this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}catch{onError('Não foi possível iniciar o 3D. Ative a aceleração gráfica do navegador e use um aparelho com WebGL 2.');return;}
  this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  this.ambient=new T.HemisphereLight('#aac9d8','#162326',.14);this.scene.add(this.ambient);this.key=new T.DirectionalLight('#8aabae',.06);this.key.position.set(4,8,10);this.scene.add(this.key);
  this.flash=new T.SpotLight('#fff0cd',35,9,.47,.55,1.6);this.flash.castShadow=true;this.flash.shadow.mapSize.set(1024,1024);this.flash.shadow.bias=-.0005;this.flash.shadow.normalBias=.025;this.flash.shadow.camera.near=.12;this.flash.shadow.camera.far=10;this.scene.add(this.flash,this.flash.target);
  this.partnerFlash=new T.SpotLight('#dbe8d4',18,8,.5,.8,1.6);this.scene.add(this.partnerFlash,this.partnerFlash.target);
  this.fill=new T.PointLight('#b2c9c3',.45,2.4,1.7);this.camera.add(this.fill);
  for(const [x,y,z,color,power]of [[4,2.3,27.4,'#72bad0',9],[26.4,2.4,28.8,'#69cc8b',6],[L.relay.x,1.7,L.relay.y+.5,'#e08459',1.5]]){const light=new T.PointLight(color,power,4.5,1.7);light.position.set(x,y,z);this.scene.add(light);}
  this.cart=makeCart();this.cart.position.set(L.cart.x,0,L.cart.y);this.scene.add(this.cart);this.cartGoods=new T.Group();this.cart.add(this.cartGoods);
  this.avatar=makeAvatar(1);this.scene.add(this.avatar);this.hand=new T.Group();this.camera.add(this.hand);
  shape(this.hand,'cylinder',[.085,.38,.085],[.22,-.31,-.32],'#deb292',[1.15,0,-.2]);shape(this.hand,'sphere',[.056,.075,.06],[.23,-.26,-.5],'#deb292');shape(this.hand,'cylinder',[.075,.24,.075],[.23,-.21,-.52],'#344e4e',[Math.PI/2,0,0]);shape(this.hand,'cylinder',[.105,.045,.105],[.23,-.21,-.65],material('#eee0af',0,true),[Math.PI/2,0,0]);
  this.held=new T.Group();this.camera.add(this.held);this.held.position.set(-.26,-.34,-.64);this.held.scale.setScalar(.8);
  this.cargo=new T.Group();this.cargo.position.set(L.belt.x,1.13,L.belt.y);this.scene.add(this.cargo);
  this.plate=new T.Group();this.scene.add(this.plate);this.ceilingLights=[];this.gateMeshes=SECTORS.map(s=>{const g=makeGate(s);this.scene.add(g);return g;});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.active=false;controls.active=false;controls.reset();onError('O navegador interrompeu o 3D. Recarregue esta página para retomar a sala.');});
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();requestAnimationFrame(t=>this.frame(t));
 }
 resize(){if(!this.renderer)return;const {width,height}=this.canvas.getBoundingClientRect();if(width<=0||height<=0)return;this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.fov=width<height?82:73;this.camera.updateProjectionMatrix();}
 setState(g,id){
  if(!this.renderer)return;const newRound=this.round!==g.round||this.me!==id;this.state=g;this.me=id;const p=g.players.find(v=>v.id===id);if(!p)return;
  if(newRound){
   this.round=g.round;this.positions.clear();if(this.world){this.scene.remove(this.world);disposeOwned(this.world);}const market=createMarket(g.stock);this.world=batchStatic(market.root);this.scene.add(this.world);
   this.ceilingLights.forEach(l=>{this.scene.remove(l);l.dispose();});this.ceilingLights=market.lights.map(({x,y,z,sector,color})=>{const l=new T.PointLight(color,0,9,1.7);l.userData.sector=sector;l.position.set(x,y,z);this.scene.add(l);return l;});
   this.scene.remove(this.avatar);this.avatar=makeAvatar(g.players.findIndex(v=>v.id!==id));this.scene.add(this.avatar);this.goodsCount=-1;this.holding=undefined;this.cargoKey='';this.plateKey='';this.handoff=-1;
  }
  if(newRound||this.handoff!==g.handoff){this.handoff=g.handoff;this.controls.reset();this.controls.yaw=p.yaw;this.controls.pitch=p.pitch;this.local={x:p.x,y:p.y,vx:0,vy:0};this.positions.clear();this.camera.position.set(p.x,1.65,p.y);}
  else if(this.local){const error=distance(this.local,p);if(error>1.15){this.local.x=p.x;this.local.y=p.y;}else{this.local.x+=(p.x-this.local.x)*.24;this.local.y+=(p.y-this.local.y)*.24;}}
  if(this.holding!==p.holding){this.holding=p.holding;this.held.clear();if(p.holding)this.held.add(makeProduct(p.holding));}
  if(this.goodsCount!==g.collected.length){this.goodsCount=g.collected.length;this.cartGoods.clear();g.collected.forEach((id,i)=>{const item=makeProduct(id);item.scale.multiplyScalar(.55);item.position.set((i%2)*.27-.13,.6,Math.floor(i/2)*.24-.27);this.cartGoods.add(item);});}
  if(this.cargoKey!==g.pending?.item+':'+g.pending?.status){this.cargoKey=g.pending?.item+':'+g.pending?.status;this.cargo.clear();if(g.pending){if(g.pending.item)this.cargo.add(makeProduct(g.pending.item));else box(this.cargo,[.4,.32,.4],[0,.16,0],'#9b8b69');}}
  const o=g.observation,plateKey=JSON.stringify(o);if(this.plateKey!==plateKey){this.plateKey=plateKey;disposeOwned(this.plate);this.plate.clear();if(o?.kind==='gate'){const gate=g.gates.find(v=>v.id===o.id),right=p.x>gate.x;label(this.plate,o.code,.8,.35,[gate.x+(right ? .16 : -.16),1.7,gate.y],{rotation:right?Math.PI/2:-Math.PI/2,color:'#f7d995',background:'#102329',font:110});}
   if(o?.kind==='relay'){label(this.plate,o.code,.43,.23,[L.relay.x,1.37,L.relay.y+(p.y>L.relay.y?.215:-.215)],{rotation:p.y>L.relay.y?0:Math.PI,font:100,color:'#e9c486',background:'#1d343b'});}
   if(o?.kind==='cargo'){label(this.plate,o.symbol,.55,.4,[18,1.7,p.y>26?26.36:25.64],{rotation:p.y>26?0:Math.PI,font:130,background:'#c6ac70',color:'#132a32'});}}
 }
 preview(){if(this.round!==null||!this.renderer)return;this.setState({round:0,handoff:0,status:'preview',stock:PRODUCTS.map(p=>p.id),players:[{id:'preview',x:10,y:10,yaw:0,pitch:0},{id:'partner',name:'Seu par',x:8,y:9,yaw:0,vx:0,vy:0}],collected:[],gates:SECTORS.map(s=>({id:s.id,remaining:10})),power:'A',pending:null,event:null},'preview');this.active=true;}
 setActive(active){this.active=active;if(active)this.resize();}
 frame(t){requestAnimationFrame(v=>this.frame(v));if(!this.renderer||!this.active||document.hidden){this.last=t;return;}const dt=Math.min(.05,(t-this.last)/1000||.016);this.last=t;const g=this.state;if(!g)return;const p=g.players.find(v=>v.id===this.me);if(!p)return;
  const input=this.controls.read(dt),paused=g.status!=='preview'&&g.players.some(p=>!p.connected);
  if(g.status==='preview'){this.camera.position.set(10.7,1.7,10.3);this.camera.rotation.set(-.03,.55+Math.sin(t*.00012)*.08,0,'YXZ');}
  else{if(!paused&&g.status==='playing'){const speed=p.holding?2.7:3.2,blend=1-Math.exp(-dt*16);this.local.vx+=(input.x*speed-this.local.vx)*blend;this.local.vy+=(input.y*speed-this.local.vy)*blend;move(this.local,this.local.vx*dt,this.local.vy*dt,L,g);}else this.local.vx=this.local.vy=0;
   const speed=Math.hypot(this.local.vx,this.local.vy);this.bob+=speed*dt*3.2;this.camera.position.set(this.local.x,1.65+(this.comfort?0:Math.sin(this.bob)*.012),this.local.y);this.camera.rotation.set(this.controls.pitch,this.controls.yaw,0,'YXZ');this.hand.position.y=Math.sin(this.bob)*Math.min(.01,speed*.004);this.held.rotation.z=Math.sin(this.bob)*.018;}
  const other=g.players.find(v=>v.id!==this.me);if(other){let pos=this.positions.get(other.id)||{x:other.x,y:other.y,yaw:other.yaw};const blend=1-Math.exp(-dt*14);pos.x+=(other.x-pos.x)*blend;pos.y+=(other.y-pos.y)*blend;pos.yaw=lerpAngle(pos.yaw,other.yaw||0,blend);this.positions.set(other.id,pos);this.avatar.position.set(pos.x,0,pos.y);this.avatar.rotation.y=pos.yaw;animateAvatar(this.avatar,other,t/1000);this.partnerFlash.position.set(pos.x,1.3,pos.y);this.partnerFlash.target.position.set(pos.x-Math.sin(pos.yaw)*4,1,pos.y-Math.cos(pos.yaw)*4);}
  this.gateMeshes.forEach((mesh,i)=>mesh.position.y=T.MathUtils.lerp(mesh.position.y,g.gates[i].remaining>0?2.85:0,dt*9));
  const blackout=Boolean(g.event);this.ambient.intensity=blackout ? .07 : .14;this.fill.intensity=blackout ? .28 : .45;this.ceilingLights.forEach(l=>l.intensity=T.MathUtils.lerp(l.intensity,!blackout&&g.power===l.userData.sector?17:0,dt*5));
  SECTORS.forEach(s=>material(s.color,0,true).emissiveIntensity=g.power===s.id&&!blackout ? .7 : .04);
  this.flash.intensity=this.lightOn?35:0;this.camera.getWorldDirection(this.direction||(this.direction=new T.Vector3()));this.flash.position.copy(this.camera.position);this.flash.position.y-=.13;this.flash.target.position.copy(this.camera.position).addScaledVector(this.direction,6);
  this.hand.visible=this.held.visible=g.status!=='preview';this.renderer.render(this.scene,this.camera);this.onFrame({camera:this.camera,local:this.local,other,input});
 }
}
