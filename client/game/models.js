import * as T from '/vendor/three.module.js';
import {PRODUCTS,SECTORS,SUPERMARKET as L} from '/shared/levels.js';
const geometries={box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,12,8),cylinder:new T.CylinderGeometry(.5,.5,1,12),cone:new T.CylinderGeometry(.05,.5,1,12),torus:new T.TorusGeometry(.5,.14,6,12)};
const materials=new Map(),labelCache=new Map(),planeCache=new Map();
export function material(color,metal=0,emissive=false){const key=color+':'+metal+':'+emissive;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:metal?.4:.85,metalness:metal,emissive:emissive?color:0,emissiveIntensity:emissive?.55:0}));return materials.get(key);}
export function shape(parent,type,size,pos,color,rotation=null,metal=0){const mesh=new T.Mesh(geometries[type],typeof color==='object'?color:material(color,metal));mesh.scale.set(...size);mesh.position.set(...pos);if(rotation)mesh.rotation.set(...rotation);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
export const box=(p,size,pos,color,rot=null,metal=0)=>shape(p,'box',size,pos,color,rot,metal);
export function label(parent,text,width,height,pos,{background='#23494a',color='#f9ead3',font=48,rotation=0,cached=false,lit=false}={}){
 const key=[text,width,height,background,color,font,lit].join('|');let mat=cached?labelCache.get(key):null;
 if(!mat){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=Math.max(96,Math.round(512*height/width));const c=canvas.getContext('2d');c.fillStyle=background;c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.font=`800 ${font}px sans-serif`;c.fillText(text,256,canvas.height/2,480);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 mat=lit?new T.MeshStandardMaterial({map:texture,roughness:.8}):new T.MeshBasicMaterial({map:texture});mat.userData.owned=!cached;if(cached)labelCache.set(key,mat);}
 const geoKey=width+':'+height;if(cached&&!planeCache.has(geoKey))planeCache.set(geoKey,new T.PlaneGeometry(width,height));
 const mesh=new T.Mesh(cached?planeCache.get(geoKey):new T.PlaneGeometry(width,height),mat);mesh.position.set(...pos);mesh.rotation.y=rotation;mesh.userData.owned=!cached;parent.add(mesh);return mesh;
}
export function makeProduct(id){
 const item=PRODUCTS.find(p=>p.id===id);if(!item)return new T.Group();id=item.base;
 const g=new T.Group();
 if(id==='milk'){
  box(g,[.24,.4,.19],[0,.2,0],'#e6eee4');box(g,[.245,.14,.196],[0,.16,0],item.color);shape(g,'cone',[.24,.12,.2],[0,.46,0],'#dbe9d9');shape(g,'cylinder',[.07,.035,.07],[.06,.49,0],'#5599a9');
 }else if(id==='bread'){
  shape(g,'sphere',[.18,.13,.35],[0,.13,0],item.color);for(let i=0;i<3;i++)box(g,[.23,.012,.035],[0,.245,-.16+i*.14],'#edbc78',[0,0,.08]);
 }else if(id==='eggs'){
  box(g,[.43,.065,.28],[0,.032,0],'#a49c7c');for(let x=0;x<3;x++)for(let z=0;z<2;z++)shape(g,'sphere',[.056,.083,.056],[-.14+x*.14,.095,-.075+z*.15],item.id==='eggs-farm'?'#ba8d62':'#f3e5c9');
 }else if(id==='coffee'){
  shape(g,'cylinder',[.25,.35,.25],[0,.2,0],item.color);shape(g,'cylinder',[.265,.04,.265],[0,.39,0],'#322f32');box(g,[.19,.16,.015],[0,.21,.129],'#cb9869');shape(g,'sphere',[.043,.029,.01],[0,.215,.144],'#4b3027',[0,0,.4]);
 }else if(id==='rice'){
  box(g,[.35,.43,.18],[0,.23,0],'#d8debc');box(g,[.35,.11,.19],[0,.28,0],item.color);box(g,[.31,.045,.18],[0,.465,0],'#b7c99e');
 }else if(id==='apple'){
  shape(g,'sphere',[.16,.145,.145],[0,.16,0],item.color);shape(g,'sphere',[.07,.105,.13],[.1,.16,0],item.color);shape(g,'cylinder',[.023,.12,.023],[0,.34,0],'#6a4831',[0,0,.12]);shape(g,'sphere',[.09,.017,.035],[.07,.32,0],'#6f9653',[0,0,.3]);
 }else if(id==='cheese'){
  shape(g,'cylinder',[.4,.17,.4],[0,.09,0],'#e7b34a');shape(g,'cylinder',[.405,.028,.405],[0,.175,0],item.color);for(const [x,z]of [[-.07,.03],[.08,-.06],[.04,.1]])shape(g,'sphere',[.027,.01,.028],[x,.194,z],'#b28637');
 }else if(id==='carrot'){
  shape(g,'cone',[.14,.46,.14],[0,.24,0],'#df7d31',[0,0,Math.PI]);for(let i=-1;i<=1;i++)shape(g,'sphere',[.026,.16,.018],[i*.035,.56,0],'#548751',[0,0,i*.3]);
 }
 const flat=['bread','eggs','apple','cheese'].includes(id),y=flat ? .12 : .27,z=id==='apple' ? .19 : id==='eggs' ? .15 : id==='cheese' ? .205 : .145;
 label(g,item.variant.toUpperCase(),.25,.085,[0,y,z],{background:item.color,color:'#152b30',font:48,cached:true,lit:true});
 label(g,item.amount+' '+(item.mark==='CÍRCULO'?'●':'▲'),.25,.065,[0,y-.077,z+.001],{background:'#e9e2ca',color:'#152b30',font:54,cached:true,lit:true});
 if(item.id==='carrot-baby')g.scale.set(.8,.68,.8);
 if(item.id==='cheese-aged')g.scale.setScalar(.83);
 return g;
}
function shelfProducts(root,id,levels=2){
 for(let row=0;row<levels;row++)for(let i=0;i<4;i++){const p=makeProduct(id);p.position.set(-.76+i*.5,.38+row*.63,.08);root.add(p);}
}
function frame(root,color,height=1.9){
 for(const x of [-1.05,1.05])for(const z of [-.48,.48])box(root,[.07,height,.07],[x,height/2,z],color);
 for(const y of [.3,.93,1.57])box(root,[2.14,.06,1],[0,y,0],color);
}
export function fixture(item,index){
 const g=new T.Group(),dark='#33464a',wood='#926544';
 if(item.fixture==='fridge'){
  box(g,[2.2,2.28,.12],[0,1.14,-.48],'#466b71');for(const x of [-1.04,1.04])box(g,[.12,2.28,1.05],[x,1.14,0],'#d3e0db');box(g,[2.2,.12,1.05],[0,2.24,0],'#d3e0db');
  for(const y of [.31,.95,1.57])box(g,[2.04,.055,.95],[0,y,.12],'#c1d9d5');
  for(const x of [-.98,.98])box(g,[.035,1.85,.04],[x,1.23,.59],material('#9be2e5',0,true));
  shelfProducts(g,item.id,3);
 }else if(item.fixture==='bakery'){
  frame(g,wood,1.87);box(g,[2.1,1.65,.08],[0,.98,-.48],'#a4754f');shelfProducts(g,item.id,2);
  for(const y of [.34,.98])box(g,[2.06,.17,.08],[0,y,.51],'#b38b5e');
  box(g,[2.35,.1,1.2],[0,2.02,0],'#ad7551');for(let i=0;i<8;i++)box(g,[.29,.15,.28],[-1.015+i*.29,1.97,.58],i%2?'#e9c78e':'#9f4e3e');
 }else if(item.fixture==='fruit'||item.fixture==='vegetables'){
  box(g,[2.15,.73,.95],[0,.365,0],'#735640');
  for(let i=0;i<2;i++){box(g,[1.02,.18,.91],[-.55+i*1.1,.85,0],'#b18e5d',[.12,0,0]);for(let j=0;j<3;j++)box(g,[.09,.3,.95],[-.99+i*1.1+j*.45,.94,0],'#8e704a');}
  for(let i=0;i<8;i++){const p=makeProduct(item.id);p.position.set(-.83+(i%4)*.54,.98,-.25+Math.floor(i/4)*.45);if(item.id==='carrot'){p.rotation.z=1.1;p.scale.setScalar(.85);}g.add(p);}
 }else if(item.fixture==='deli'){
  box(g,[2.2,.82,1.02],[0,.41,0],'#586d70');box(g,[2.25,.07,1.07],[0,.86,0],'#d7d3b8');
  for(const x of [-1.05,1.05])box(g,[.04,.59,.94],[x,1.2,0],'#789e9b');box(g,[2.14,.04,.96],[0,1.48,0],'#88afab');
  for(let i=0;i<5;i++){const p=makeProduct(item.id);p.position.set(-.8+i*.4,.93,.07);g.add(p);}
  box(g,[.4,.22,.32],[.66,1.63,-.12],'#344a4a');
 }else if(item.fixture==='sacks'){
  frame(g,'#5b7165',1.85);box(g,[2.1,1.8,.06],[0,.95,-.49],'#354c45');shelfProducts(g,item.id,2);
  for(const x of [-.65,0,.65]){shape(g,'cylinder',[.55,.55,.48],[x,.29,.53],'#c3b892');shape(g,'sphere',[.24,.04,.2],[x,.59,.53],'#e8e1c3');}
 }else if(item.fixture==='coffee'){
  frame(g,dark,1.9);box(g,[2.13,1.86,.09],[0,.97,-.5],'#463732');shelfProducts(g,item.id,2);
  box(g,[.5,.35,.43],[.5,1.83,0],'#35494a');shape(g,'cylinder',[.25,.22,.25],[.5,2.1,0],'#80543a');
 }else{
  frame(g,'#6d8276',1.85);box(g,[2.1,1.6,.075],[0,.95,-.5],'#c1be9c');shelfProducts(g,item.id,2);
 }
 const high=['fruit','vegetables'].includes(item.fixture)?1.65:item.fixture==='deli'?1.9:2.44;
 label(g,(item.name+' / '+item.variant).toUpperCase(),1.9,.31,[0,high,.56],{background:item.color,color:'#263739',font:38});
 label(g,`${item.sku}  |  ${item.amount}  |  ${item.mark}`,1.75,.15,[0,.18,.57],{background:'#283e3e',color:'#d7d9c2',font:35});
 // Readable labels on the reverse side as well.
 label(g,(item.name+' / '+item.variant).toUpperCase(),1.9,.31,[0,high,-.58],{background:item.color,color:'#263739',font:38,rotation:Math.PI});
 return g;
}
function floorTexture(){const cv=document.createElement('canvas');cv.width=cv.height=256;const c=cv.getContext('2d');c.fillStyle='#8c9b91';c.fillRect(0,0,256,256);c.fillStyle='#a6aea0';c.fillRect(0,0,128,128);c.fillRect(128,128,128,128);c.strokeStyle='#758780';c.lineWidth=2;c.strokeRect(0,0,128,128);c.strokeRect(128,128,128,128);c.strokeRect(128,0,128,128);c.strokeRect(0,128,128,128);const t=new T.CanvasTexture(cv);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(8,7.5);t.colorSpace=T.SRGBColorSpace;return t;}
export function createMarket(stock){
 const g=new T.Group(),floorMat=new T.MeshStandardMaterial({map:floorTexture(),roughness:.88});floorMat.userData.owned=true;
 box(g,[L.width,.14,L.height],[L.width/2,-.09,L.height/2],floorMat);
 const wall='#344c50';for(const x of [0,L.width])box(g,[.18,3.8,L.height],[x,1.9,L.height/2],wall);for(const z of [0,L.height])box(g,[L.width,3.8,.18],[L.width/2,1.9,z],wall);
 box(g,[L.width,.12,L.height],[L.width/2,3.85,L.height/2],'#17252a');
 for(const w of L.walls){box(g,[w.w,3.65,w.h],[w.x,1.825,w.y],'#32464b');box(g,[w.w+.025,.13,w.h+.025],[w.x,.33,w.y],'#59706b');}
 // Beams, ducts and electrical conduits give corridors depth without adding clutter.
 for(const z of [2,10,14,22,28]){box(g,[28,.16,.18],[14,3.6,z],'#202e34');box(g,[27,.13,.25],[14,3.4,z+.3],'#465859');}
 for(const x of [13.65,14.35])box(g,[.055,.055,28],[x,3.18,15],'#657a76');
 const lights=[];
 for(const s of SECTORS){
  for(const z of [s.y+2,s.y+7.7]){const x=s.x+6.5;box(g,[3,.09,.4],[x,3.42,z],'#17282f');box(g,[2.7,.03,.25],[x,3.36,z],material(s.color,0,true));lights.push({x,y:3,z,sector:s.id,color:s.color});}
  const inward=s.x===0?Math.PI/2:-Math.PI/2,edge=s.gate.x,plateX=edge+(s.x===0?.14:-.14);
  label(g,`${s.id} / ${s.name.toUpperCase()}`,2.15,.38,[plateX,2.95,s.gate.y],{background:'#152b32',color:s.color,font:36,rotation:inward});
  for(const dz of [-1.37,1.37])box(g,[.26,2.8,.1],[edge,1.4,s.gate.y+dz],'#697c78');
  box(g,[.3,.17,2.8],[edge,2.83,s.gate.y],material(s.color,0,true));
  // Gate number is also readable from within the sector.
  label(g,`${s.id} / SAÍDA INTERNA [E]`,1.9,.25,[edge+(s.x===0?-.15:.15),2.92,s.gate.y],{background:'#17352c',color:'#bdd9a1',font:34,rotation:-inward});
  for(let k=0;k<2;k++){const z=s.y+3.8+k*4;label(g,`CORREDOR ${String(SECTORS.indexOf(s)*2+k+1).padStart(2,'0')}`,2.6,.4,[s.x+6.5,2.97,z+1.3],{background:'#233c42',color:s.color,font:40});}
 }
 stock.forEach((id,i)=>{const item=PRODUCTS.find(p=>p.id===id),f=fixture(item,i),s=L.shelves[i];f.position.set(s.x,0,s.y);g.add(f);});
 // A protected operator room, with tactile switches, rack and four monitors.
 box(g,[5,.9,.8],[4,.45,26.4],'#223d47');box(g,[5.1,.1,1],[4,.94,26.4],'#546764');
 for(let i=0;i<4;i++){const x=2.15+i*1.22;box(g,[1.05,.73,.13],[x,1.52,26.12],'#182c33');label(g,`${SECTORS[i].id} / ${SECTORS[i].name}`, .94,.51,[x,1.53,26.2],{background:'#10282f',color:SECTORS[i].color,font:42});box(g,[.08,.3,.1],[x,1.09,26.12],'#536967');
  for(let j=0;j<3;j++){box(g,[.11,.055,.16],[x-.28+j*.23,1.02,26.65],j===0?'#cc9d54':'#678580');}}
 label(g,'CENTRAL / TURNO NOTURNO',5,.45,[4,2.75,25.15],{background:'#183239',color:'#b4c8ba',font:38});
 box(g,[1.2,2.5,.6],[.8,1.25,26.6],'#1e333d');for(let y=.4;y<2.4;y+=.24){box(g,[1,.06,.03],[.8,y,26.92],'#728385');box(g,[.045,.04,.04],[1.13,y+.06,26.94],material('#78d4bb',0,true));}
 label(g,'RÁDIO • ENERGIA • PORTAS',3.8,.25,[4,2.21,25.15],{background:'#223942',color:'#7ca5a5',font:30});
 // Main sorting conveyor, numbered routes, scanner and dispatch crates.
 box(g,[5,1,1],[19,.5,26],'#355158');box(g,[5.12,.08,1.1],[19,1.03,26],'#728882');box(g,[4.8,.04,.88],[19,1.095,26],'#182b32');
 for(let i=0;i<28;i++)box(g,[.02,.009,.88],[16.65+i*.17,1.121,26],'#657573');
 for(const x of [17,21])for(const z of [25.43,26.57])box(g,[.11,.86,.11],[x,.43,z],'#3b5256');
 for(const x of [18.6,19.4])box(g,[.1,.8,.1],[x,1.5,26.05],'#82928a');box(g,[.95,.1,.12],[19,1.9,26.05],'#cfa662');
 label(g,'TRIAGEM / INFORME O SÍMBOLO',4,.43,[19,2.66,26],{background:'#283d3e',color:'#d8b677',font:34});
 for(let i=0;i<4;i++){box(g,[.85,.75,.75],[23.7+(i%2)*1.05,.375,24.1+Math.floor(i/2)],'#8b7658');label(g,['FRIO','SECO','FRESCO','FRÁGIL'][i],.7,.25,[23.7+(i%2)*1.05,.5,24.49+Math.floor(i/2)],{background:'#4d5146',font:62});}
 box(g,[1.2,.9,.7],[22.5,.45,28],'#395b51');box(g,[.58,.36,.15],[22.5,1.13,28],'#1b3839');label(g,'CONFIRMAR',.55,.23,[22.5,1.15,27.9],{rotation:Math.PI,background:'#3b7159',font:55});
 label(g,'CAIXA / CONFIRMAÇÃO EM DUPLA',3.2,.35,[22.5,2.4,28.5],{rotation:Math.PI,background:'#21443d',color:'#d6c997',font:33});
 // Relay on the central crossing. Its changing code is private to the shopper.
 box(g,[.45,1.4,.38],[L.relay.x,.7,L.relay.y],'#465c60');box(g,[.52,.5,.4],[L.relay.x,1.55,L.relay.y],'#3a4f51');label(g,'REARME',.43,.15,[L.relay.x,1.59,L.relay.y+.21],{background:'#d1a666',color:'#253536',font:67});
 for(const z of [2,10,14,22,28]){box(g,[.08,.12,.18],[13.27,.2,z],material('#ce6150',0,true));box(g,[.08,.12,.18],[14.73,.2,z],material('#ce6150',0,true));}
 box(g,[1.7,2.7,.07],[26.5,1.35,29.88],'#28554c');for(const x of [25.62,27.38])box(g,[.1,2.8,.12],[x,1.4,29.8],material('#8ec79d',0,true));
 label(g,'SAÍDA',1.5,.33,[26.5,3.05,29.76],{background:'#3b7857',color:'#d6efca',rotation:Math.PI,font:72});
 label(g,'MERCADO DA MEIA-NOITE',6,.5,[14,3.1,.13],{color:'#c5ad7a',background:'#1a3036',font:43});
 return {root:g,lights};
}
export function makeGate(sector){const g=new T.Group();g.position.set(sector.gate.x,0,sector.gate.y);
 for(let y=.3;y<2.7;y+=.22)box(g,[.12,.085,2.5],[0,y,0],'#82948f');for(const z of [-1.17,0,1.17])box(g,[.13,2.65,.065],[0,1.35,z],'#506869');return g;}
export function makeCart(){
 const g=new T.Group(),metal=material('#9aaea7',.65);
 for(const x of [-.35,.35])for(const z of [-.44,.44]){shape(g,'cylinder',[.15,.07,.15],[x,.12,z],'#263337',[0,0,Math.PI/2]);box(g,[.04,.35,.04],[x,.3,z],metal);}
 box(g,[.8,.055,.93],[0,.52,0],metal);
 for(const x of [-.41,.41]){box(g,[.035,.03,1],[x,.94,0],metal);for(let i=0;i<8;i++)box(g,[.035,.38,.02],[x,.74,-.46+i*.13],metal);}
 for(const z of [-.49,.49]){box(g,[.84,.025,.025],[0,.94,z],metal);for(let i=0;i<7;i++)box(g,[.018,.39,.018],[-.38+i*.125,.74,z],metal);}
 for(const x of [-.4,.4])box(g,[.04,.4,.04],[x,.85,.55],metal,[.3,0,0]);box(g,[.9,.065,.075],[0,1.07,.61],'#cd9a60');return g;
}
export function makeAvatar(index){
 const root=new T.Group(),body=new T.Group();root.add(body);const skin=index?'#bc805f':'#deb292',shirt=index?'#df9671':'#68a89f',hair=index?'#513b33':'#333a3b';
 const torso=shape(body,'sphere',[.27,.39,.17],[0,1.06,0],shirt);box(body,[.42,.36,.25],[0,.84,0],shirt);shape(body,'cylinder',[.16,.13,.16],[0,1.46,0],skin);
 shape(body,'sphere',[.215,.26,.2],[0,1.7,0],skin);shape(body,'sphere',[.222,.15,.205],[0,1.86,.025],hair);
 if(index){shape(body,'sphere',[.15,.21,.13],[.2,1.75,.12],hair);shape(body,'sphere',[.14,.14,.14],[.21,1.95,.08],hair);}
 for(const x of [-.077,.077]){shape(body,'sphere',[.022,.028,.01],[x,1.73,-.19],'#293d3b');shape(body,'sphere',[.04,.024,.012],[x*1.5,1.64,-.177],'#c18072');}
 shape(body,'sphere',[.04,.025,.025],[0,1.61,-.192],'#a77564');
 const arms=[],legs=[];
 for(const side of [-1,1]){const arm=new T.Group();arm.position.set(side*.3,1.28,0);shape(arm,'cylinder',[.17,.35,.17],[0,-.14,0],shirt);shape(arm,'cylinder',[.13,.26,.13],[0,-.42,0],skin);shape(arm,'sphere',[.075,.092,.07],[0,-.56,0],skin);body.add(arm);arms.push(arm);
 const leg=new T.Group();leg.position.set(side*.13,.75,0);shape(leg,'cylinder',[.18,.58,.18],[0,-.27,0],'#344955');box(leg,[.21,.13,.33],[0,-.6,-.05],'#dbd5bf');body.add(leg);legs.push(leg);}
 root.userData={body,arms,legs};return root;
}
export function animateAvatar(root,p,t){
 const {arms,legs,body}=root.userData,speed=Math.hypot(p.vx,p.vy),swing=Math.sin(t*9)*Math.min(.65,speed*.23);body.position.y=speed>.1?Math.abs(Math.sin(t*9))*.027:0;
 legs[0].rotation.x=swing;legs[1].rotation.x=-swing;arms[0].rotation.set(-swing*.5,0,0);arms[1].rotation.set(swing*.5,0,0);
 if(p.holding){arms[1].rotation.x=-1.1;arms[1].rotation.z=.1;}
 const wiggle=Math.sin(t*5)*.22;
 if(p.gesture==='eat'){arms[1].rotation.x=-2.2+wiggle;arms[1].rotation.z=.28;}
 if(p.gesture==='drink'){arms[1].rotation.x=-2.6+wiggle*.4;arms[1].rotation.z=.2;body.rotation.x=-.06;}
 else body.rotation.x=0;
 if(p.gesture==='stir'){arms[0].rotation.x=-1.3;arms[1].rotation.x=-1.1+wiggle;arms[1].rotation.z=Math.cos(t*5)*.25;}
 if(p.gesture==='peel'){arms[0].rotation.x=-1.25;arms[1].rotation.x=-1.3+wiggle;arms[1].rotation.z=.45;}
 if(p.gesture==='smell'){arms[0].rotation.x=-2.6+wiggle*.1;arms[0].rotation.z=-.3;}
 if(p.gesture==='crack'){arms[0].rotation.x=arms[1].rotation.x=-1.25;arms[0].rotation.z=-.3-wiggle;arms[1].rotation.z=.3+wiggle;}
 arms.forEach(arm=>arm.rotation.x*=-1);
}
// Repeated geometry/material pairs become instanced draw calls for mobile GPUs.
export function batchStatic(root){
 root.updateMatrixWorld(true);const groups=new Map();root.traverse(node=>{if(!node.isMesh)return;const key=node.geometry.uuid+node.material.uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(node);});
 const result=new T.Group();for(const nodes of groups.values()){if(nodes.length<2){const m=nodes[0];const clone=new T.Mesh(m.geometry,m.material);clone.matrix.copy(m.matrixWorld);clone.matrix.decompose(clone.position,clone.quaternion,clone.scale);clone.castShadow=m.castShadow;clone.receiveShadow=m.receiveShadow;clone.userData={...m.userData};result.add(clone);continue;}const instance=new T.InstancedMesh(nodes[0].geometry,nodes[0].material,nodes.length);nodes.forEach((m,i)=>instance.setMatrixAt(i,m.matrixWorld));instance.castShadow=true;instance.receiveShadow=true;instance.computeBoundingSphere();result.add(instance);}
 return result;
}
export function disposeOwned(root){root.traverse(node=>{if(node.material?.userData?.owned){node.material.map?.dispose();node.material.dispose();}if(node.userData.owned)node.geometry.dispose();if(node.isInstancedMesh)node.dispose();});}
