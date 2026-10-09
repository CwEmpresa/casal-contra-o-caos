import * as T from '/vendor/three.module.js';
import {PRODUCTS,SECTORS,SUPERMARKET as L} from '/shared/levels.js';
const geometries={box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,12,8),cylinder:new T.CylinderGeometry(.5,.5,1,12),cone:new T.CylinderGeometry(.05,.5,1,12),torus:new T.TorusGeometry(.5,.14,6,12)};
// Rounded carton/cabinet edges without subdivision modifiers at runtime.
const rounded=new T.BoxGeometry(1,1,1,3,3,3),rp=rounded.attributes.position,rn=rounded.attributes.normal;
for(let i=0;i<rp.count;i++){const point=new T.Vector3().fromBufferAttribute(rp,i),core=point.clone().clampScalar(-.43,.43),normal=point.clone().sub(core).normalize();point.copy(core).addScaledVector(normal,.07);rp.setXYZ(i,point.x,point.y,point.z);rn.setXYZ(i,normal.x,normal.y,normal.z);}geometries.rounded=rounded;
const materials=new Map(),labelCache=new Map(),planeCache=new Map();
export function material(color,metal=0,emissive=false){const key=color+':'+metal+':'+emissive;if(!materials.has(key))materials.set(key,new T.MeshLambertMaterial({color,emissive:emissive?color:0,emissiveIntensity:emissive?.55:0}));return materials.get(key);}
export function shape(parent,type,size,pos,color,rotation=null,metal=0){const mesh=new T.Mesh(geometries[type],typeof color==='object'?color:material(color,metal));mesh.scale.set(...size);mesh.position.set(...pos);if(rotation)mesh.rotation.set(...rotation);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
export const box=(p,size,pos,color,rot=null,metal=0)=>shape(p,size.every(v=>v>=.17)&&Math.max(...size)<=5.2?'rounded':'box',size,pos,color,rot,metal);
// One shared texture atlas replaces a separate GPU texture/material per label.
let atlas,atlasMaterial,atlasX=0,atlasY=0,atlasRow=0;
const atlasEntries=new Map();
function labelAtlas(){
 if(atlas)return;
 const cv=document.createElement('canvas');cv.width=cv.height=2048;
 atlas=new T.CanvasTexture(cv);atlas.colorSpace=T.SRGBColorSpace;
 atlasMaterial=new T.MeshBasicMaterial({map:atlas});
}
export function label(parent,text,width,height,pos,{background='#274a57',color='#f9f3df',rotation=0}={}){
 labelAtlas();const key=[text,width,height,background,color].join('|');let entry=atlasEntries.get(key);
 if(!entry){const w=256,h=Math.max(28,Math.min(140,Math.ceil(w*height/width)));
  if(atlasX+w>2048){atlasX=0;atlasY+=atlasRow;atlasRow=0;}
  if(atlasY+h>2048)throw new Error('Label atlas capacity exceeded');
  const c=atlas.image.getContext('2d');c.fillStyle=background;c.fillRect(atlasX,atlasY,w,h);c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.font=`800 ${Math.floor(h*.53)}px sans-serif`;c.fillText(text,atlasX+w/2,atlasY+h/2,w-14);
  entry={x:atlasX,y:atlasY,w,h};atlasEntries.set(key,entry);atlasX+=w;atlasRow=Math.max(atlasRow,h);atlas.needsUpdate=true;
 }
 const geo=new T.PlaneGeometry(width,height),uv=geo.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setXY(i,(entry.x+2+uv.getX(i)*(entry.w-4))/2048,1-(entry.y+entry.h-2-uv.getY(i)*(entry.h-4))/2048);
 const mesh=new T.Mesh(geo,atlasMaterial);mesh.position.set(...pos);mesh.rotation.y=rotation;mesh.userData.owned=true;parent.add(mesh);return mesh;
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
 if(['coffee','sacks'].includes(item.fixture)){for(let row=0;row<2;row++)for(let col=0;col<4;col++){const p=makeProduct(item.id);p.position.set(-.76+col*.5,.38+row*.63,-.72);p.rotation.y=Math.PI;g.add(p);}for(const y of [.3,.93])box(g,[2.12,.06,.48],[0,y,-.73],'#98b4ad');}
 const high=['fruit','vegetables'].includes(item.fixture)?1.65:item.fixture==='deli'?1.9:2.44;
 label(g,(item.name+' / '+item.variant).toUpperCase(),1.9,.31,[0,high,.56],{background:item.color,color:'#263739',font:38});
 label(g,`${item.sku}  |  ${item.amount}  |  ${item.mark}`,1.75,.15,[0,.18,.57],{background:'#283e3e',color:'#d7d9c2',font:35});
 // Readable labels on the reverse side as well.
 label(g,(item.name+' / '+item.variant).toUpperCase(),1.9,.31,[0,high,-.58],{background:item.color,color:'#263739',font:38,rotation:Math.PI});
 return g;
}
export function createMarket(stock){
 const g=new T.Group();
 box(g,[28,.12,28],[14,-.08,14],'#b5c7cc');
 // Oversized ceramic tiles: geometry, no texture upload or per-tile draw calls after merging.
 for(let x=0;x<28;x+=2)for(let z=0;z<28;z+=2)box(g,[1.97,.008,1.97],[x+1,-.01,z+1],(x+z)%4?'#ccd8d9':'#d8e1dd');
 for(const x of [0,28])box(g,[.2,3.7,28],[x,1.85,14],'#83aeb8');
 for(const z of [0,28])box(g,[28,3.7,.2],[14,1.85,z],'#83aeb8');
 for(const x of [0,28])box(g,[.23,.55,28],[x,.28,14],'#3b7889');
 box(g,[28,.15,28],[14,3.8,14],'#cad7d9');
 for(const z of [3.8,10.5,19.5,26.8]){
  box(g,[28,.18,.18],[14,3.55,z],'#77979e');
  for(const x of [4,14,24]){box(g,[2,.12,.35],[x,3.53,z],'#5b7680');box(g,[1.8,.03,.25],[x,3.45,z],material('#f7efc9',0,true));}
 }
 // A glazed, independently illuminated control booth at the front of the shop.
 for(const w of L.walls){box(g,[w.w,1.1,w.h],[w.x,.55,w.y],'#b7ddd6');box(g,[w.w,.12,w.h],[w.x,2.9,w.y],'#477784');
  const along=w.w>w.h;for(let v=-1;v<=1;v++)box(g,[along?.07:w.w,1.8,along?w.h:.07],[w.x+(along?v*2:0),2,w.y+(along?0:v*1.6)],'#477784');}
 label(g,'CENTRAL',3.7,.5,[3.5,3.05,22.15],{color:'#173e4c',background:'#c3eee0'});
 label(g,'CENTRAL • RÁDIO E ENERGIA',4.5,.35,[3.5,2.6,22.12],{color:'#e4ffeb',background:'#3c787a',rotation:Math.PI});
 box(g,[5,.9,.8],[3.5,.45,24.5],'#e7d9b4');box(g,[5.15,.11,1],[3.5,.98,24.5],'#52838c');
 for(let i=0;i<4;i++){const x=1.65+i*1.2;box(g,[1.03,.7,.13],[x,1.49,24.22],'#244857');label(g,`${SECTORS[i].id} / ${SECTORS[i].name}`, .94,.51,[x,1.51,24.3],{background:'#d4f1e5',color:'#184f62'});box(g,[.1,.27,.1],[x,1.08,24.22],'#6c9091');for(let j=0;j<3;j++)shape(g,'cylinder',[.13,.045,.13],[x-.25+j*.24,1.06,24.75],j?'#eef3c9':'#f5a875');}
 box(g,[1.2,2.2,.6],[.8,1.1,25],'#3d6876');for(let y=.4;y<2;y+=.28){box(g,[1,.06,.04],[.8,y,25.33],'#89bcb7');box(g,[.07,.06,.05],[1.12,y+.09,25.34],material('#adf7c0',0,true));}
 for(const sector of SECTORS){
  const {x,y}=sector.gate;box(g,[.48,1.15,.4],[x,.58,y],'#416b7b');box(g,[.56,.48,.43],[x,1.38,y],sector.color);
  label(g,`SETOR ${sector.id}`, .5,.18,[x,1.48,y+.223],{background:sector.color,color:'#163f4a'});
  label(g,'LER CÓDIGO',.48,.14,[x,1.25,y+.224],{background:'#284b5a',color:'#e7ffe8'});
  label(g,`${sector.id} • ${sector.name.toUpperCase()}`,3.2,.5,[x,2.85,y],{background:sector.color,color:'#254d57'});
  label(g,`${sector.id} • ${sector.name.toUpperCase()}`,3.2,.5,[x,2.85,y-.03],{rotation:Math.PI,background:sector.color,color:'#254d57'});
 }
 stock.forEach((id,i)=>{const spot=L.shelves[i];for(const [scale,color,height]of [[1.15,'#b5c5c5',.003],[1.06,'#9bb1b4',.006]])box(g,[spot.w*scale,.008,spot.h*scale],[spot.x,height,spot.y],color);const item=PRODUCTS.find(p=>p.id===id),f=fixture(item,i),s=L.shelves[i];f.position.set(s.x,0,s.y);f.rotation.y=s.rotation;g.add(f);});
 // Parallel grocery gondolas and stocked reverse faces establish a recognizable open floor plan.
 for(const s of L.decor){const f=new T.Group();frame(f,'#5b7f95');box(f,[2.1,1.8,.1],[0,1,-.45],'#a6bfd0');
  for(let row=0;row<3;row++)for(let col=0;col<5;col++){const x=-.8+col*.4;box(f,[.26,.38,.23],[x,.52+row*.63,.08],['#e4b889','#92cfc4','#e3a19b','#9fb7d7'][col%4]);box(f,[.2,.11,.015],[x,.52+row*.63,.204],'#f5efce');}
  label(f,'MERCEARIA',1.9,.25,[0,2.24,.55],{background:'#d9b3e6',color:'#384a59'});f.position.set(s.x,0,s.y);f.rotation.y=s.rotation;g.add(f);
 }
 for(const [n,x,z]of [[1,3,4.3],[2,9,4.3],[3,19,4.3],[4,24,11.5],[5,3,11],[6,7.5,11],[7,14.7,19],[8,20,19]])label(g,`${String(n).padStart(2,'0')}  ↓`,1,.42,[x,2.9,z],{background:'#3e667c',color:'#f3f5df'});
 // Produce sacks, rounded waste bins and end-cap details stay out of walking lanes.
 for(const x of [2,6]){shape(g,'cylinder',[.5,.65,.5],[x,.33,20],'#d6a977');shape(g,'sphere',[.23,.08,.22],[x,.67,20],'#eddec2');}
 for(const x of [8.6,27]){shape(g,'cylinder',[.55,.85,.55],[x,.43,25.7],'#58978d');shape(g,'torus',[.55,.55,.55],[x,.84,25.7],'#2e5967',[Math.PI/2,0,0]);}
 // Front checkout lane: arrival at the scanner on the left, payment and exit on the right.
 box(g,[5,1,1],[18.8,.5,23.7],'#78a8b4');box(g,[5.1,.08,1.1],[18.8,1.04,23.7],'#d1e0d9');box(g,[4.8,.04,.87],[18.8,1.1,23.7],'#354e60');
 for(let i=0;i<18;i++)box(g,[.022,.008,.87],[16.5+i*.26,1.125,23.7],'#668797');
 for(const x of [18.5,19.3])box(g,[.1,.75,.1],[x,1.5,23.7],'#92bac1');box(g,[.91,.1,.12],[18.9,1.9,23.7],'#f1bd70');
 label(g,'ESTEIRA • DEPOSITE E LEIA O SÍMBOLO',5,.43,[18.8,2.8,23.7],{rotation:Math.PI,background:'#f4c780',color:'#3a5460'});
 for(let i=0;i<4;i++){const x=24+(i%2),z=21.5+Math.floor(i/2);box(g,[.85,.72,.75],[x,.36,z],'#c89d76');label(g,['FRIO','SECO','FRESCO','FRÁGIL'][i],.72,.25,[x,.5,z-.38],{rotation:Math.PI,background:'#638b9b'});}
 box(g,[1.2,.9,.7],[23.5,.45,25.6],'#7eb9ad');box(g,[.58,.36,.14],[23.5,1.13,25.6],'#3e6976');label(g,'PAGAR',.5,.2,[23.5,1.16,25.51],{rotation:Math.PI,background:'#c8eed7',color:'#2b5f66'});
 label(g,'CAIXA',1.8,.45,[23.5,2.65,25.6],{rotation:Math.PI,background:'#9ee0c0',color:'#25565a'});
 box(g,[.52,1.6,.4],[L.relay.x,.8,L.relay.y],'#d9a275');label(g,'REARME',.5,.2,[L.relay.x,1.35,L.relay.y+.21],{background:'#fff0c4',color:'#6b534b'});
 box(g,[2.4,2.8,.09],[26.5,1.4,27.88],'#5e9f9d');for(const x of [25.3,26.5,27.7])box(g,[.07,2.8,.13],[x,1.4,27.8],'#bcddd5');
 label(g,'SAÍDA →',2.2,.45,[26.5,3.1,27.7],{background:'#aae6b9',color:'#2b6359',rotation:Math.PI});
 label(g,'MERCADO DA MEIA-NOITE',8,.55,[14,3.25,.13],{color:'#f5f3d9',background:'#4d8699'});
 const cart=makeCart();cart.position.set(L.cart.x,0,L.cart.y);g.add(cart);
 return {root:g,lights:[]};
}
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
 for(const part of [body,...arms,...legs]){const source=new T.Group();for(const child of [...part.children])if(child.isMesh)source.add(child);part.add(batchStatic(source,{chunked:false}));disposeOwned(source);}
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
// A small spatial batch per 7 m cell, vertex colors and one label atlas.
// Geometry is merged once per round, so adding shelf detail does not add draw calls.
export const worldUniforms={power:{value:0},blackout:{value:0},torch:{value:1},eye:{value:new T.Vector3()},look:{value:new T.Vector3(0,0,-1)}};
function mergedMaterial(map=null){return new T.ShaderMaterial({uniforms:{...worldUniforms,atlas:{value:map}},vertexShader:`
 attribute vec3 tint; attribute float glow;
 varying vec3 vColor; varying vec3 vPos; varying vec3 vNormal; varying vec2 vUv; varying float vGlow;
 void main(){vColor=tint;vGlow=glow;vUv=uv;vec4 world=modelMatrix*vec4(position,1.);vPos=world.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`,
 fragmentShader:`
 uniform sampler2D atlas;uniform float power;uniform float blackout;uniform float torch;uniform vec3 eye;uniform vec3 look;
 varying vec3 vColor;varying vec3 vPos;varying vec3 vNormal;varying vec2 vUv;varying float vGlow;
 void main(){
 float booth=step(vPos.x,7.)*step(22.,vPos.z);
 float sector=vPos.z<5.?(vPos.x<14.?1.:2.):(vPos.x>23.&&vPos.z<11.?2.:(vPos.x<9.&&vPos.z<21.?3.:(vPos.x>10.&&vPos.x<22.&&vPos.z<19.?4.:0.)));
 float powered=(1.-step(.4,abs(sector-power)))*step(.5,power)*(1.-blackout);
 vec3 delta=vPos-eye;float range=length(delta);
 float cone=smoothstep(.79,.97,dot(normalize(delta),look))*max(0.,1.-range/11.)*torch;
 float diffuse=.64+.36*max(0.,dot(normalize(vNormal),normalize(vec3(-.5,1.,.4))));
 float light=mix(.42-blackout*.18+powered*.42,1.1,booth)+cone*.8;
 vec3 base=vColor;
 #ifdef LABEL_MAP
 base*=texture2D(atlas,vUv).rgb;
 #endif
 gl_FragColor=vec4(base*mix(diffuse*light,1.,vGlow),1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,defines:map?{LABEL_MAP:1}:{},toneMapped:false});}
let solidBatchMaterial,labelBatchMaterial;
export function batchStatic(root,{chunked=true}={}){
 root.updateMatrixWorld(true);const batches=new Map(),normalMatrix=new T.Matrix3(),p=new T.Vector3(),n=new T.Vector3();
 root.traverse(mesh=>{if(!mesh.isMesh)return;const mapped=!!mesh.material.map,key=(mapped?'labels':'solid')+(chunked?':'+Math.floor(mesh.matrixWorld.elements[12]/7)+':'+Math.floor(mesh.matrixWorld.elements[14]/7):'');
  if(!batches.has(key))batches.set(key,{positions:[],normals:[],colors:[],uvs:[],glows:[],mapped});const b=batches.get(key),geo=mesh.geometry,index=geo.index,count=index?index.count:geo.attributes.position.count,color=mesh.material.color||new T.Color(1,1,1);normalMatrix.getNormalMatrix(mesh.matrixWorld);
  for(let i=0;i<count;i++){const j=index?index.getX(i):i;p.fromBufferAttribute(geo.attributes.position,j).applyMatrix4(mesh.matrixWorld);n.fromBufferAttribute(geo.attributes.normal,j).applyMatrix3(normalMatrix).normalize();b.positions.push(p.x,p.y,p.z);b.normals.push(n.x,n.y,n.z);b.colors.push(color.r,color.g,color.b);b.uvs.push(geo.attributes.uv?.getX(j)||0,geo.attributes.uv?.getY(j)||0);b.glows.push(mesh.material.emissive?.getHex()?1:0);}
 });
 solidBatchMaterial??=mergedMaterial();if(atlas)labelBatchMaterial??=mergedMaterial(atlas);
 const result=new T.Group();for(const b of batches.values()){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(b.positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(b.normals,3));geo.setAttribute('tint',new T.Float32BufferAttribute(b.colors,3));geo.setAttribute('uv',new T.Float32BufferAttribute(b.uvs,2));geo.setAttribute('glow',new T.Float32BufferAttribute(b.glows,1));geo.computeBoundingSphere();const mesh=new T.Mesh(geo,b.mapped?labelBatchMaterial:solidBatchMaterial);mesh.userData.owned=true;result.add(mesh);}return result;
}
export function disposeOwned(root){root.traverse(node=>{if(node.material?.userData?.owned){node.material.map?.dispose();node.material.dispose();}if(node.userData.owned)node.geometry.dispose();if(node.isInstancedMesh)node.dispose();});}
