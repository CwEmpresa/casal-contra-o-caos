import {Connection} from './network/connection.js';
import {Renderer} from './game/renderer.js';
import {Controls} from './game/controls.js';
import {Sounds} from './game/audio.js';
import {PRODUCTS,SECTORS,ROUTES,SUPERMARKET as L} from '/shared/levels.js';
import {actionFor,distance} from '/shared/geometry.js';
const $=id=>document.getElementById(id),net=new Connection(),sound=new Sounds(),mobile=matchMedia('(pointer:coarse)').matches;
const setText=(id,value)=>{const el=$(id),text=String(value??'');if(el.textContent!==text)el.textContent=text;};
const item=id=>PRODUCTS.find(p=>p.id===id),time=n=>`${Math.floor(n/60).toString().padStart(2,'0')}:${Math.floor(n%60).toString().padStart(2,'0')}`;
let lastSentInput=0;
let room=null,screenName='home',online=false,lastNotice=-1,lastRole='',radioSeq=-1,routeKey='',ackEpoch='',lastReady=null,toastTimer,noticeUntil=0,keypadTarget=null,keypadValue='';
const typing=()=>/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName),portrait=()=>mobile&&innerHeight>innerWidth;
const dialogs=['help-dialog','intro-dialog','radio-dialog','keypad-dialog','map-dialog'];
function toast(message){setText('toast',message);$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function send(m){sound.unlock();if(!net.send(m))toast('Conectando ao servidor. Tente novamente em instantes.');}
function cmd(action,data={}){send({type:'command',action,stage:room?.game?.stage,...data});}
function shareReading(){const o=room?.game?.observation;if(o)send({type:'radio',text:o.text});}
function flushInput(){let inputs;while((inputs=renderer.drainInputs()).length){if(net.send({type:'inputs',inputs,handoff:room.game.handoff}))lastSentInput=inputs.at(-1).seq;}}
function interact(){const g=room?.game,p=g?.players.find(v=>v.id===net.session?.id);if(!g||!p)return;const a=actionFor(g,{...p,...renderer.local,yaw:controls.yaw},L);if(a?.type==='console'){panel(true);return;}if(a?.type==='read'){shareReading();return;}sound.unlock();flushInput();net.send({type:'interact',afterSeq:lastSentInput});}
const controls=new Controls({canvas:$('game-canvas'),stick:$('joystick'),knob:$('knob'),action:$('interact'),onAction:interact});
const renderer=new Renderer($('game-canvas'),controls,{onError:message=>{setText('graphics-error',message);$('graphics-error').hidden=false;queueMicrotask(updateControls);},onFrame:()=>{if(screenName==='play')renderTarget();}});
function epoch(){return room?.game?`${room.game.round}:${room.game.handoff}`:'';}
function syncView(){const ready=!portrait()&&!document.hidden&&(screenName!=='play'||ackEpoch===epoch())&&$('graphics-error').hidden;if(net.session&&lastReady!==ready){lastReady=ready;net.send({type:'view',ready});}}
function updateControls(){const blocked=portrait()||document.hidden||dialogs.some(id=>$(id).open)||!$('mission-panel').hidden||typing();controls.active=screenName==='play'&&online&&room?.game?.status==='playing'&&!room.game.paused&&!blocked&&$('graphics-error').hidden;renderer.setActive(screenName==='play'&&!portrait()&&!document.hidden&&$('graphics-error').hidden);$('rotate-overlay').hidden=!portrait();document.body.classList.toggle('portrait',portrait());if(!controls.active)controls.reset();syncView();}
function show(next){if(screenName===next)return;screenName=next;document.querySelectorAll('.screen').forEach(el=>el.hidden=el.id!==next);document.body.classList.toggle('in-game',next==='play');controls.unlock();updateControls();}
function panel(open){$('mission-panel').hidden=!open;document.body.classList.toggle('panel-open',open);if(open)controls.unlock();updateControls();}
function openDialog(id){controls.unlock();if(!$(id).open)$(id).showModal();updateControls();}
function closeDialog(id){$(id).close();updateControls();}
for(const id of dialogs)$(id).addEventListener('close',updateControls);
$('intro-dialog').addEventListener('cancel',e=>e.preventDefault());
window.addEventListener('resize',updateControls);window.addEventListener('orientationchange',()=>setTimeout(updateControls,100));document.addEventListener('visibilitychange',updateControls);document.addEventListener('focusin',updateControls);document.addEventListener('focusout',()=>setTimeout(updateControls,0));
setInterval(()=>{if(screenName==='play'&&online&&!portrait()&&!document.hidden)flushInput();},50);
async function fullscreen(){sound.unlock();try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();await window.screen.orientation?.lock?.('landscape');}catch{/* Rotation overlay remains the portable fallback, including iOS Safari. */}}
$('fullscreen').onclick=$('game-fullscreen').onclick=fullscreen;
$('name').value=localStorage.getItem('chaos-name')||'';
function getName(){const name=$('name').value.trim()||'Meu amor';localStorage.setItem('chaos-name',name);return name;}
$('create').onclick=()=>send({type:'create',name:getName()});$('open-join').onclick=()=>{getName();show('join');$('code').focus();};$('back').onclick=()=>show('home');
$('join-form').onsubmit=e=>{e.preventDefault();send({type:'join',name:getName(),code:$('code').value.toUpperCase().trim()});};$('start').onclick=()=>send({type:'start'});$('replay').onclick=()=>{ackEpoch='';send({type:'replay'});};
function leave(){net.leave();room=null;lastNotice=-1;lastRole=routeKey=ackEpoch='';lastReady=null;radioSeq=-1;for(const id of dialogs)$(id).close();show('home');}
$('leave-lobby').onclick=$('leave-result').onclick=$('leave-game').onclick=leave;
$('copy-code').onclick=async()=>{try{await navigator.clipboard.writeText(room.code);toast('Código copiado. Envie para seu par.');}catch{toast(`Compartilhe o código ${room.code}`);}};
$('sound').onclick=()=>{sound.toggle();setText('sound',sound.enabled?'♪':'♫̸');};
$('help').onclick=$('menu-button').onclick=()=>{$('leave-game').hidden=screenName!=='play';openDialog('help-dialog');};$('close-help').onclick=$('got-it').onclick=()=>closeDialog('help-dialog');
$('comfort').onchange=()=>renderer.comfort=$('comfort').checked;
$('quality').value=localStorage.getItem('chaos-quality')||'auto';renderer.setQuality($('quality').value);$('quality').onchange=()=>{renderer.setQuality($('quality').value);localStorage.setItem('chaos-quality',$('quality').value);};
$('flashlight').onclick=()=>{renderer.lightOn=!renderer.lightOn;$('flashlight').classList.toggle('selected',renderer.lightOn);};
$('collapse-panel').onclick=()=>panel(false);$('clues-button').onclick=()=>panel($('mission-panel').hidden);
$('radio-button').onclick=()=>openDialog('radio-dialog');$('close-radio').onclick=()=>closeDialog('radio-dialog');
$('radio-form').onsubmit=e=>{e.preventDefault();const text=$('radio-input').value.trim();if(text){send({type:'radio',text});$('radio-input').value='';$('radio-input').blur();}};
$('share-order').onclick=()=>cmd('brief');$('share-reading').onclick=shareReading;
$('gate-form').onsubmit=e=>{e.preventDefault();if(/^\d{3}$/.test($('gate-code').value))cmd('gate',{code:$('gate-code').value});else openKeypad('gate-code');};
$('reset-form').onsubmit=e=>{e.preventDefault();if(/^\d{3}$/.test($('reset-code').value))cmd('reset',{code:$('reset-code').value});else openKeypad('reset-code');};
$('confirm-checkout').onclick=()=>cmd('checkout');
function openKeypad(id){keypadTarget=id;keypadValue='';setText('keypad-value','···');openDialog('keypad-dialog');}
for(const id of ['gate-code','reset-code'])$(id).onclick=()=>openKeypad(id);
function key(value){if(value==='⌫')keypadValue=keypadValue.slice(0,-1);else if(value==='OK'){if(keypadValue.length!==3)return;$(keypadTarget).value=keypadValue;closeDialog('keypad-dialog');cmd(keypadTarget==='gate-code'?'gate':'reset',{code:keypadValue});return;}else if(keypadValue.length<3)keypadValue+=value;setText('keypad-value',keypadValue.padEnd(3,'·'));}
for(const value of ['1','2','3','4','5','6','7','8','9','⌫','0','OK']){const b=document.createElement('button');b.textContent=value;b.onclick=()=>key(value);if(value==='OK')b.className='primary';$('keypad').append(b);}
$('close-keypad').onclick=()=>closeDialog('keypad-dialog');
window.addEventListener('keydown',e=>{if($('keypad-dialog').open){if(/^\d$/.test(e.key)){e.preventDefault();key(e.key);}if(e.key==='Backspace'){e.preventDefault();key('⌫');}if(e.key==='Enter'){e.preventDefault();key('OK');}return;}if(screenName!=='play'||typing()||dialogs.some(id=>$(id).open))return;if(e.key==='Tab'){e.preventDefault();panel($('mission-panel').hidden);}if(e.key.toLowerCase()==='f')$('flashlight').click();});
for(const s of [...SECTORS,{id:'belt',name:'Esteira'},{id:null,name:'Desligar'}]){const b=document.createElement('button');b.textContent=s.id&&s.id!=='belt'?`${s.id} · ${s.name}`:s.name;b.dataset.sector=s.id??'off';b.onclick=()=>cmd('power',{sector:s.id});$('power-buttons').append(b);}
for(const route of ROUTES){const b=document.createElement('button');b.textContent=route;b.onclick=()=>cmd('route',{route});$('route-buttons').append(b);}
function mapRect(o,fill){const r=document.createElementNS('http://www.w3.org/2000/svg','rect');for(const [k,v]of Object.entries({x:o.x-o.w/2,y:o.y-o.h/2,width:o.w,height:o.h,fill,rx:.12}))r.setAttribute(k,v);$('map-fixtures').append(r);}
for(const shelf of L.shelves)mapRect(shelf,SECTORS.find(s=>s.id===shelf.sector).color);
for(const o of [...L.decor,...L.walls,...L.obstacles.slice(L.decor.length+4)])mapRect(o,'#7a98a1');
for(const s of SECTORS)mapRect({...s.gate,w:.9,h:.9},s.color);
function openMap(){const p=renderer.local;if(p){$('map-you').setAttribute('cx',p.x);$('map-you').setAttribute('cy',p.y);}openDialog('map-dialog');}
$('map-button').onclick=$('open-map').onclick=openMap;$('close-map').onclick=()=>closeDialog('map-dialog');
$('ready-button').onclick=()=>{ackEpoch=epoch();closeDialog('intro-dialog');};
function renderLobby(){setText('room-code',room.code);$('players').replaceChildren();for(let i=0;i<2;i++){const p=room.players[i],el=document.createElement('div'),name=document.createElement('strong'),status=document.createElement('small');el.className='player-card';name.textContent=p?.name||'Seu parceiro';status.textContent=p?(p.connected?'CONECTADO':'RECONECTANDO'):'AGUARDANDO';el.append(name,status);$('players').append(el);}const ready=room.players.length===2&&room.players.every(p=>p.connected),host=net.session?.id===room.host;$('start').disabled=!ready||!host||!online;setText('start',host?'Começar o turno →':'Seu par vai iniciar');setText('lobby-status',ready?'Dupla conectada. Prontos para a compra?':'Esperando seu parceiro…');}
function roleIntro(g,operator){const steps=operator?['Transmita o pedido. Ligue o setor indicado para seu par.','Peça o código do terminal. Digite para liberar os produtos.','Na esteira: peça o símbolo, ligue a esteira e escolha a rota da tabela.']:['Receba o pedido. Siga até o terminal do setor e transmita seu código.','Espere a liberação. Compare variante, quantidade e selo antes de pegar.','Leve à esteira, deposite e transmita o símbolo para a central.'];setText('intro-turn',g.stage>=3?'TROCA DE TURNO • AGORA É COM VOCÊ':'PRIMEIRO TURNO • CONHEÇA SEU POSTO');setText('intro-title',operator?'Você está na central.':'Você está no supermercado.');$('intro-steps').replaceChildren(...steps.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));openDialog('intro-dialog');}
function objectiveFor(g,p){const op=g.role.operator===p.id,brief=op?g.order:g.sharedBrief,sector=SECTORS.find(s=>s.id===brief?.sector),access=g.gates.find(s=>s.id===sector?.id)?.remaining||0;
 if(g.checkedOut)return {text:op?'Pagamento aceito. Seu par precisa chegar à saída.':'Leve o recibo até a saída verde.',phase:4,target:op?null:L.exit,label:'Saída'};
 if(g.stage>=g.total)return {text:op?'Combine com seu par e confirme o pagamento em até 4 segundos.':'Vá ao caixa. Combine e confirme junto com a central.',phase:4,target:op?null:L.checkout,label:'Caixa'};
 if(g.event)return {text:op?'Peça o código de rearme e digite para religar a energia.':'Leia e transmita o código do painel de rearme.',phase:1,target:op?null:L.relay,label:'Rearme'};
 if(g.pending)return {text:op?(g.pending.status==='rejected'?'Seu par precisa retirar a carga devolvida.':'Peça o símbolo. Ligue a esteira e escolha a rota correspondente.'):(g.pending.status==='rejected'?'Retire a carga devolvida. Confira a mensagem do erro.':'Leia o símbolo da carga e transmita para a central.'),phase:3,target:op?null:L.belt,label:'Esteira'};
 if(p.holding)return p.correction?{text:'Devolva o produto na prateleira e escolha a variante do pedido.',phase:2,target:L.shelves[g.stock.indexOf(p.holding)]?.approach,label:'Devolver produto'}:{text:'Leve o produto à esteira, na frente do mercado.',phase:3,target:L.belt,label:'Esteira'};
 if(!g.sharedBrief)return {text:op?'Leia o pedido abaixo e toque em “Transmitir pedido”.':'Aguarde a central transmitir o primeiro pedido.',phase:0};
 if(op)return {text:access>0?'Acesso liberado. Ajude seu par a conferir a embalagem.':`Ligue o setor ${sector.id}, peça o código e libere os produtos.`,phase:access>0?2:1};
 return {text:access>0?`Setor ${sector.id} liberado por ${Math.ceil(access)} s. Compare e pegue a embalagem.`:`Vá ao terminal ${sector.id} · ${sector.name}. Leia e transmita o código.`,phase:access>0?2:1,target:access>0?null:sector.gate,label:`${sector.id} · ${sector.name}`};
}
function renderTarget(){const g=room?.game,local=renderer.local;if(!g||!local)return;const p={...g.players.find(p=>p.id===net.session?.id),...local,yaw:controls.yaw},op=g.role.operator===p.id,a=actionFor(g,p,L),o=g.observation,objective=objectiveFor(g,p);let text=a?.label||'',detail='';
 if(a?.type==='pickup'||a?.type==='return'){const product=item(g.stock[a.shelf]);detail=`${product.name} ${product.variant} · ${product.amount} · ${product.mark}`;text=a.type==='pickup'?'Pegar esta embalagem':'Devolver produto';renderer.setHighlight(L.shelves[a.shelf]);}else renderer.setHighlight(null);
 if(a?.type==='read'&&o){text=o.text;detail='SÓ VOCÊ CONSEGUE LER AQUI';}
 $('context-card').hidden=op||!a;setText('target-label',text);setText('product-detail',detail);$('share-reading').hidden=a?.type!=='read'||!o;$('crosshair').classList.toggle('ready',!!a);
 setText('action-label',a?.type==='read'?'TRANSMITIR':a?.type==='pickup'?'PEGAR':a?.type==='deposit'?'DEPOSITAR':a?.type==='recover'?'RETIRAR':'INTERAGIR');
 setText('mission-step',objective.text);for(const [i,el]of [...$('phase-track').children].entries()){el.classList.toggle('active',i===objective.phase);el.classList.toggle('done',i<objective.phase);}
 let waypoint='';if(objective.target){const d=distance(p,objective.target),angle=Math.atan2(-(objective.target.x-p.x),-(objective.target.y-p.y))-controls.yaw,turn=Math.atan2(Math.sin(angle),Math.cos(angle));waypoint=`${Math.abs(turn)<.5?'↑':Math.abs(turn)>2.5?'↶':turn>0?'←':'→'} ${objective.label} · ${Math.round(d)} m`;}
 setText('waypoint',waypoint);$('notice').style.opacity=Date.now()<noticeUntil?'1':'0';
}
function renderGame(){const g=room.game,p=g.players.find(p=>p.id===net.session.id),operator=g.role.operator===p.id;renderer.setState(g,net.session.id);document.body.classList.toggle('operator',operator);
 const roleKey=`${g.round}:${g.handoff}:${operator}`;if(lastRole!==roleKey){lastRole=roleKey;for(const id of dialogs)$(id).close();panel(operator);setText('clues-button',operator?'Central':'Pedido');roleIntro(g,operator);}
 setText('role-badge',operator?'CENTRAL DE CONTROLE':'COMPRADOR · NO MERCADO');setText('objective',g.stage>=g.total?'Compras separadas':`Entrega ${g.stage+1} / ${g.total} · turno ${g.stage<3?'1':'2'}`);setText('timer',time(Math.ceil(g.time)));$('timer').classList.toggle('urgent',g.time<30);
 $('operator-tools').hidden=!operator;$('shopper-tools').hidden=operator;setText('panel-title',operator?'CENTRAL DE CONTROLE':'SEU PEDIDO');
 setText('power-status',`${g.event?'SOBRECARGA':g.power?'ENERGIA '+(g.power==='belt'?'ESTEIRA':g.power):'ENERGIA DESLIGADA'} · ${Math.round(g.heat)}% CALOR`);
 setText('order-sector',g.order?`${g.order.sector} · ${SECTORS.find(s=>s.id===g.order.sector).name.toUpperCase()}`:'LISTA CONCLUÍDA');setText('order-description',g.order?.description||'Confirmem o pagamento juntos e levem o recibo à saída.');$('share-order').hidden=!g.order;setText('share-order',g.sharedBrief?'Reenviar pedido ↗':'Transmitir pedido ↗');
 setText('shopper-order',g.sharedBrief?.description||'A central ainda não transmitiu o pedido. Peça ao seu par para tocar em “Transmitir pedido”.');setText('operator-hint',g.pending?'Só seu par vê o símbolo na esteira. A tabela muda em cada entrega.':'Só seu par vê o código no mercado. O acesso dura 40 s no primeiro turno e 30 s no segundo.');
 for(const b of $('power-buttons').children){const selected=(g.power??'off')===b.dataset.sector;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));b.disabled=!!g.event&&b.dataset.sector!=='off';}
 $('energy-section').hidden=g.stage>=g.total;$('gate-section').hidden=!!g.pending||!!g.event||g.stage>=g.total;$('reset-section').hidden=!g.event;$('route-section').hidden=!g.pending||!!g.event;
 const access=g.gates.find(v=>v.id===g.order?.sector);setText('gate-status',access?.remaining>0?`Setor ${access.id}: retirada liberada por ${Math.ceil(access.remaining)} s`:'Os corredores são livres. O código libera a retirada.');
 const routing=JSON.stringify([g.round,g.stage,g.routing]);if(routeKey!==routing){routeKey=routing;$('gate-code').value=$('reset-code').value='';$('route-map').replaceChildren();for(const [symbol,route]of Object.entries(g.routing||{})){const el=document.createElement('span');el.textContent=`${symbol} → ${route}`;$('route-map').append(el);}}
 for(const b of $('route-buttons').children)b.disabled=g.pending?.status!=='waiting'||g.power!=='belt';$('confirm-checkout').hidden=g.stage<g.total||g.checkedOut;const remaining=g.checkoutReady[p.id];setText('confirm-checkout',remaining>0?`Confirmado • ${Math.ceil(remaining)} s`:'Confirmar pagamento • 4 s');
 if(radioSeq!==g.radioSeq){radioSeq=g.radioSeq;$('radio-log').replaceChildren();for(const m of g.radio){const row=document.createElement('div'),name=document.createElement('b'),text=document.createElement('span');if(m.by===p.id)row.className='mine';name.textContent=g.players.find(p=>p.id===m.by)?.name||'Seu par';text.textContent=m.text;row.append(name,text);$('radio-log').append(row);}$('radio-log').scrollTop=$('radio-log').scrollHeight;const last=g.radio.at(-1);setText('latest-radio',last?`${g.players.find(p=>p.id===last.by)?.name}: ${last.text}`:'');if(last?.by!==p.id&&last){sound.play('hint');toast(last.text);}}
 $('event').hidden=!g.event;if(g.event)setText('event',`⚡ Sobrecarga · ${Math.ceil(g.event.remaining)} s · rearme junto à central`);
 if(g.noticeSeq!==lastNotice){lastNotice=g.noticeSeq;setText('notice',g.notice);noticeUntil=Date.now()+6500;sound.play(g.sound);if(operator&&g.sound==='error')toast(g.notice);}
 const held=item(p.holding);setText('hand-text',held?`${held.icon} ${held.name} ${held.variant} · ${held.amount}`:operator?'Seu par depende das suas instruções':'Mãos livres · confira os rótulos');
 const paused=!online||g.paused;$('pause').hidden=!paused||ackEpoch!==epoch();setText('pause-message',!online||g.players.some(p=>!p.connected)?'Conexão interrompida. A sala espera a reconexão.':'Seu par precisa ficar pronto, voltar à aba ou girar o celular para a horizontal.');updateControls();renderTarget();
}
function renderResult(){for(const id of dialogs)$(id).close();const r=room.game.result;setText('result-title',r.won?'Compra concluída!':'O mercado fechou!');setText('result-stars',r.won?'★'.repeat(r.stars)+'☆'.repeat(3-r.stars):'↻');setText('result-message',r.won?'Seis entregas. Dois postos. Um time.':'Conversem, confiram as embalagens e tentem mais uma vez.');setText('score',r.score.toLocaleString('pt-BR'));setText('result-time',time(r.time));setText('result-errors',r.errors);setText('result-events',r.events);$('replay').disabled=room.host!==net.session.id||!online||room.players.some(p=>!p.connected);$('result-items').replaceChildren(...r.answers.map(id=>{const el=document.createElement('span');el.textContent=item(id).icon;el.title=item(id).name;if(!room.game.collected.includes(id))el.className='missing';return el;}));}
net.addEventListener('status',({detail})=>{online=detail==='online';setText('connection',online?'ONLINE':detail==='connecting'?'CONECTANDO':'RECONECTANDO');$('connection').classList.toggle('online',online);$('create').disabled=!online;if(!online){controls.reset();lastReady=null;if(screenName==='play')$('pause').hidden=false;}updateControls();});
net.addEventListener('session',()=>{lastReady=null;syncView();});
net.addEventListener('state',({detail})=>{room=detail.room;if(!room.game){show('lobby');renderLobby();return;}if(room.game.status==='playing'){show('play');renderGame();}else{show('result');renderResult();}});
net.addEventListener('error',({detail})=>{toast(detail.message);if(detail.code==='expired'){room=null;ackEpoch=lastRole='';show('home');}});net.addEventListener('ended',({detail})=>{room=null;ackEpoch=lastRole='';for(const id of dialogs)$(id).close();show('home');toast(detail.message);});
updateControls();net.connect();
