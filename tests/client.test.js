import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGame,viewFor,command,radio} from '../server/game.js';
// A DOM adapter exercises real UI handlers and snapshots. It does not render WebGL or CSS.
class Element{
 constructor(id='',tagName='DIV'){Object.assign(this,{id,tagName,children:[],dataset:{},style:{},value:'',hidden:false,disabled:false,open:false,checked:true,textContent:'',scrollHeight:0,scrollTop:0});const set=new Set();this.classList={toggle:(v,force)=>{const add=force??!set.has(v);if(add)set.add(v);else set.delete(v);return add;},contains:v=>set.has(v)};}
 append(...children){this.children.push(...children);}replaceChildren(...children){this.children=[...children];}addEventListener(){}setAttribute(k,v){this[k]=v;}focus(){document.activeElement=this;}blur(){document.activeElement=document.body;}showModal(){this.open=true;}close(){this.open=false;}
 set innerHTML(v){throw new Error('Unexpected HTML injection');}
}
const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
test('client initializes all real HTML controls and drives central/radio UI through handoff and results',async()=>{
 const html=await readFile(new URL('../client/index.html',import.meta.url),'utf8'),elements=new Map([...html.matchAll(/<([\w-]+)[^>]*\sid="([^"]+)"/g)].map(m=>[m[2],new Element(m[2],m[1].toUpperCase())]));
 globalThis.document={body:new Element(),activeElement:null,getElementById:id=>{assert.ok(elements.has(id),'HTML element '+id);return elements.get(id);},createElement:tag=>new Element('',tag.toUpperCase()),createElementNS:(ns,tag)=>new Element('',tag.toUpperCase()),addEventListener(){},querySelectorAll:()=>['home','join','lobby','play','result'].map(id=>elements.get(id))};document.activeElement=document.body;elements.get('graphics-error').hidden=true;
 const windowHandlers={};globalThis.window={addEventListener:(type,fn)=>windowHandlers[type]=fn,scrollTo(){}};globalThis.innerWidth=844;globalThis.innerHeight=390;globalThis.localStorage={getItem:()=>null,setItem(){}};globalThis.matchMedia=()=>({matches:true});
 const originalSetInterval=globalThis.setInterval;globalThis.setInterval=()=>0;globalThis.__ui={};
 const mock=data(`export class Connection extends EventTarget { constructor(){super();this.sent=[];this.session={id:'one'};globalThis.__ui.net=this;}send(m){this.sent.push(m);return true;}connect(){}leave(){} }
 export class Renderer { constructor(c,controls,o){this.controls=controls;this.state=null;this.local={x:4,y:28};this.options=o;this.prediction={seq:0};globalThis.__ui.renderer=this;}preview(){}setActive(){}setQuality(){}setHighlight(){}drainInputs(){return [];}setState(g,id){this.state=g;const p=g.players.find(p=>p.id===id);this.controls.yaw=p.yaw;this.local={x:p.x,y:p.y};} }
 export class Controls { constructor(o){this.yaw=0;this.options=o;globalThis.__ui.controls=this;}read(){return {x:0,y:0};}reset(){}unlock(){} }
 export class Sounds { constructor(){this.enabled=true;}unlock(){}play(){}toggle(){} }`);
 try{
  let source=await readFile(new URL('../client/main.js',import.meta.url),'utf8');for(const path of ['./network/connection.js','./game/renderer.js','./game/controls.js','./game/audio.js'])source=source.replace(JSON.stringify(path),JSON.stringify(mock)).replace("'"+path+"'",JSON.stringify(mock));for(const file of ['levels','geometry'])source=source.replace("'/shared/"+file+".js'",JSON.stringify(new URL('../shared/'+file+'.js',import.meta.url).href));
  try{await import(data(source));}catch(e){throw new Error(e.message);}
  const {net,renderer}=globalThis.__ui,el=id=>elements.get(id),emit=(type,detail)=>net.dispatchEvent(new CustomEvent(type,{detail})),g=createGame([{id:'one',name:'Ana'},{id:'two',name:'Leo'}]);
  const snapshot=()=>emit('state',{room:{code:'ABCDE',host:'one',players:g.players,game:viewFor(g,net.session.id)}});emit('status','online');snapshot();assert.equal(el('intro-dialog').open,true);el('ready-button').onclick();assert.equal(el('intro-dialog').open,false);assert.deepEqual(net.sent.at(-1),{type:'view',ready:true});
  assert.equal(el('operator-tools').hidden,false);assert.ok(el('order-description').textContent.length>10);assert.equal(el('power-buttons').children.length,6);assert.equal(el('route-map').children.length,4);
  el('share-order').onclick();assert.equal(net.sent.at(-1).action,'brief');el('power-buttons').children[0].onclick();assert.deepEqual(net.sent.at(-1),{type:'command',action:'power',stage:0,sector:'A'});el('gate-code').value='123';el('gate-form').onsubmit({preventDefault(){}});assert.equal(net.sent.at(-1).code,'123');
  el('radio-input').value='Código A: 123';el('radio-form').onsubmit({preventDefault(){}});assert.equal(net.sent.at(-1).type,'radio');assert.equal(el('radio-input').value,'');
  radio(g,'two','<img src=x onerror=alert(1)>');snapshot();assert.equal(el('radio-log').children[0].children[1].textContent,'<img src=x onerror=alert(1)>');
  g.stage=3;g.handoff++;snapshot();el('ready-button').onclick();assert.equal(el('operator-tools').hidden,true);assert.equal(el('shopper-tools').hidden,false);assert.match(el('role-badge').textContent,/COMPRADOR/);
  Object.assign(g.players[0],{x:12.2,y:3.7,yaw:0});snapshot();globalThis.__ui.controls.yaw=0;renderer.options.onFrame();assert.equal(el('share-reading').hidden,false);el('share-reading').onclick();assert.match(net.sent.at(-1).text,/Setor A/);assert.ok(el('target-label').textContent.includes('código'));globalThis.innerWidth=390;globalThis.innerHeight=844;windowHandlers.resize();assert.equal(el('rotate-overlay').hidden,false);assert.deepEqual(net.sent.at(-1),{type:'view',ready:false});globalThis.innerWidth=844;globalThis.innerHeight=390;windowHandlers.resize();assert.equal(el('rotate-overlay').hidden,true);assert.deepEqual(net.sent.at(-1),{type:'view',ready:true});
  g.stage=6;g.status='won';g.result={won:true,score:12000,time:250,errors:0,events:1,stars:3};snapshot();assert.equal(el('result-title').textContent,'Compra concluída!');assert.equal(el('result-items').children.length,6);
 }finally{globalThis.setInterval=originalSetInterval;}
});
