import {Connection} from './network/connection.js';
import {Renderer} from './game/renderer.js';
import {Controls} from './game/controls.js';
import {Sounds} from './game/audio.js';
import {PRODUCTS,SECTORS,ROUTES,SUPERMARKET as L} from '/shared/levels.js';
import {actionFor,distance,nearestShelf} from '/shared/geometry.js';
const $=id=>document.getElementById(id),net=new Connection(),sound=new Sounds();
let room=null,screen='home',online=false,lastNotice=-1,lastPhase='',lastRole='',radioSignature='',seq=0,toastTimer,oldSecond=-1,routingSignature='';
const time=n=>`${Math.floor(n/60).toString().padStart(2,'0')}:${Math.floor(n%60).toString().padStart(2,'0')}`;
const item=id=>PRODUCTS.find(p=>p.id===id),typing=()=>/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4200);}
function send(data){sound.unlock();if(!net.send(data))toast('Conectando ao servidor. Tente novamente em instantes.');}
function cmd(action,data={}){send({type:'command',action,stage:room?.game?.stage,...data});}
const controls=new Controls({canvas:$('game-canvas'),stick:$('joystick'),knob:$('knob'),action:$('interact'),onAction:()=>{
 const g=room?.game,p=g?.players.find(v=>v.id===net.session?.id);if(!g||!p)return;const a=actionFor(g,{...p,...renderer.local,yaw:controls.yaw},L);if(a?.type==='console'){collapse(false);return;}
 sound.unlock();net.send({type:'input',...controls.read(),seq:seq++});net.send({type:'interact'});
}});
const renderer=new Renderer($('game-canvas'),controls,{onError:message=>{$('graphics-error').textContent=message;$('graphics-error').hidden=false;},onFrame:()=>{if(screen==='play')renderTarget();}});renderer.preview();
for(const id of ['game-canvas','joystick','interact'])$(id).addEventListener('pointerdown',()=>{if(screen==='play'&&typing()){document.activeElement.blur();updateControls();}},true);
function updateControls(){controls.active=screen==='play'&&online&&room?.game?.status==='playing'&&room.players.every(p=>p.connected)&&!$('help-dialog').open&&!typing()&&$('graphics-error').hidden;}
function show(next){if(screen===next)return;screen=next;document.querySelectorAll('.screen').forEach(el=>el.hidden=el.id!==next);document.body.classList.toggle('in-game',next==='play');controls.unlock();renderer.setActive(next==='play'||renderer.state?.status==='preview');updateControls();if(next!=='play')window.scrollTo(0,0);}
setInterval(()=>{updateControls();if(screen==='play'&&online)net.send({type:'input',...controls.read(),seq:seq++});},50);
document.addEventListener('visibilitychange',()=>{if(document.hidden){controls.reset();net.send({type:'input',x:0,y:0});}});
document.addEventListener('focusin',()=>{if(typing()){controls.reset();net.send({type:'input',x:0,y:0});}updateControls();});document.addEventListener('focusout',()=>setTimeout(updateControls,0));
$('name').value=localStorage.getItem('chaos-name')||'';
function getName(){const name=$('name').value.trim()||'Meu amor';localStorage.setItem('chaos-name',name);return name;}
$('create').onclick=()=>send({type:'create',name:getName()});$('open-join').onclick=()=>{getName();show('join');$('code').focus();};$('back').onclick=()=>show('home');
$('join-form').onsubmit=e=>{e.preventDefault();send({type:'join',name:getName(),code:$('code').value.toUpperCase().trim()});};$('start').onclick=()=>send({type:'start'});$('replay').onclick=()=>send({type:'replay'});
function leave(){net.leave();room=null;lastNotice=-1;lastPhase=lastRole=radioSignature=routingSignature='';$('help-dialog').close();show('home');renderer.round=null;renderer.preview();}
$('leave-lobby').onclick=$('leave-result').onclick=$('leave-game').onclick=leave;
$('copy-code').onclick=async()=>{try{await navigator.clipboard.writeText(room.code);toast('Código copiado. Envie para seu par.');}catch{toast(`Compartilhe o código ${room.code}`);}};
function updateSound(){$('sound').textContent=sound.enabled?'♪':'♫̸';$('sound').title=sound.enabled?'Som ligado':'Som desligado';}$('sound').onclick=()=>{sound.toggle();updateSound();sound.play('click');};updateSound();
function openHelp(){controls.unlock();net.send({type:'input',x:0,y:0});$('leave-game').hidden=screen!=='play';$('help-dialog').showModal();updateControls();}
$('help').onclick=$('menu-button').onclick=openHelp;$('close-help').onclick=$('got-it').onclick=()=>{sound.unlock();$('help-dialog').close();updateControls();};$('help-dialog').addEventListener('close',updateControls);$('comfort').onchange=()=>renderer.comfort=$('comfort').checked;
$('flashlight').onclick=()=>{sound.unlock();renderer.lightOn=!renderer.lightOn;$('flashlight').classList.toggle('off',!renderer.lightOn);$('flashlight').setAttribute('aria-pressed',String(renderer.lightOn));};
function collapse(force){const closed=force??!$('mission-panel').classList.contains('collapsed');$('mission-panel').classList.toggle('collapsed',closed);$('collapse-panel').textContent=closed?'+':'−';if(!closed)controls.unlock();if(typing())document.activeElement.blur();updateControls();}
$('collapse-panel').onclick=()=>collapse();$('clues-button').onclick=()=>collapse();window.addEventListener('keydown',e=>{if(screen!=='play'||typing()||$('help-dialog').open)return;if(e.key==='Tab'){e.preventDefault();collapse(false);$('radio-input').focus();}if(e.key.toLowerCase()==='f')$('flashlight').click();});
$('radio-form').onsubmit=e=>{e.preventDefault();const text=$('radio-input').value.trim();if(text){send({type:'radio',text});$('radio-input').value='';}};
$('share-order').onclick=()=>{const o=room?.game?.order;if(o)send({type:'radio',text:`Setor ${o.sector}: ${o.description}`});};
$('share-reading').onclick=()=>{const o=room?.game?.observation;if(o)send({type:'radio',text:o.text});};
$('gate-form').onsubmit=e=>{e.preventDefault();cmd('gate',{code:$('gate-code').value});};$('reset-form').onsubmit=e=>{e.preventDefault();cmd('reset',{code:$('reset-code').value});};$('confirm-checkout').onclick=()=>cmd('checkout');
for(const s of [...SECTORS,{id:'belt',name:'Esteira'},{id:null,name:'Desligar'}]){const b=document.createElement('button');b.textContent=s.id&&s.id!=='belt'?`${s.id} · ${s.name}`:s.name;b.dataset.sector=s.id??'off';b.onclick=()=>cmd('power',{sector:s.id});$('power-buttons').append(b);}
for(const route of ROUTES){const b=document.createElement('button');b.textContent=route;b.onclick=()=>cmd('route',{route});$('route-buttons').append(b);}
function renderLobby(){
 $('room-code').textContent=room.code;$('players').replaceChildren();for(let i=0;i<2;i++){const p=room.players[i],el=document.createElement('div');el.className='player-card';const initial=document.createElement('span');initial.textContent=p?.name?.slice(0,1).toUpperCase()||'?';const name=document.createElement('strong');name.textContent=p?.name||'Seu parceiro';const status=document.createElement('small');status.textContent=p?(p.connected?'CONECTADO':'RECONECTANDO'):'AGUARDANDO';el.append(initial,name,status);$('players').append(el);}
 const ready=room.players.length===2&&room.players.every(p=>p.connected),host=net.session?.id===room.host;$('start').disabled=!ready||!host||!online;$('start').textContent=host?'COMEÇAR O TURNO →':'SEU PAR VAI INICIAR A MISSÃO';$('lobby-status').textContent=ready?'Parceiro conectado. Comuniquem tudo pelo rádio do jogo.':'Esperando seu parceiro…';
}
function renderPanel(g){
 const operator=g.role.operator===net.session.id,newRole=`${g.round}:${g.role.operator}`;
 if(lastRole!==newRole){lastRole=newRole;collapse(false);$('mission-panel').scrollTop=0;}
 document.body.classList.toggle('operator',operator);$('role-badge').textContent=operator?'OPERADOR / CENTRAL':'COMPRADOR / NO MERCADO';$('panel-title').textContent=operator?'CENTRAL + RÁDIO':'MISSÃO + RÁDIO';$('operator-tools').hidden=!operator;$('shopper-tools').hidden=operator;
 $('mission-step').textContent=g.checkedOut?'Pagamento aceito. Comprador: siga à saída verde.':g.stage>=g.total?'Confirmem no caixa e na central dentro de 4 segundos.':g.pending?`Carga ${g.pending.status==='rejected'?'devolvida: retire da esteira':'aguardando rota'} · ${Math.ceil(g.pending.remaining)} s`:operator?'Transmita o pedido. Energize o setor e peça o código da porta.':'Peça o pedido à central. Compare variante, quantidade e selo.';
 if(operator){$('order-sector').textContent=g.order?`SETOR ${g.order.sector}`:'LISTA CONCLUÍDA';$('order-description').textContent=g.order?.description||'Autorize o pagamento junto com seu parceiro.';$('share-order').disabled=!g.order;
  for(const b of $('power-buttons').children){const active=(g.power??'off')===b.dataset.sector;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));b.disabled=Boolean(g.event)&&b.dataset.sector!=='off';}
  $('gate-status').textContent=g.gates.map(v=>`${v.id}: ${v.remaining>0?Math.ceil(v.remaining)+'s':'fechada'}`).join(' · ');$('reset-section').hidden=!g.event;
  const signature=JSON.stringify([g.stage,g.routing]);if(routingSignature!==signature){routingSignature=signature;$('gate-code').value='';$('route-map').replaceChildren();for(const [symbol,route]of Object.entries(g.routing||{})){const row=document.createElement('span');row.textContent=`${symbol} → ${route}`;$('route-map').append(row);}}
  for(const b of $('route-buttons').children)b.disabled=g.pending?.status!=='waiting'||g.power!=='belt';$('confirm-checkout').hidden=g.stage<g.total||g.checkedOut;
  const own=g.checkoutReady[net.session.id];if(own>0)$('confirm-checkout').textContent=`CONFIRMADO / ${Math.ceil(own)} s`;
  else $('confirm-checkout').textContent='CONFIRMAR PAGAMENTO / 4 s';
 }
 const radioKey=JSON.stringify(g.radio);if(radioSignature!==radioKey){radioSignature=radioKey;$('radio-log').replaceChildren();for(const m of g.radio){const row=document.createElement('div'),name=document.createElement('b'),text=document.createElement('span');row.className=m.by===net.session.id?'mine':'';name.textContent=(g.players.find(p=>p.id===m.by)?.name||'Parceiro')+': ';text.textContent=m.text;row.append(name,text);$('radio-log').append(row);}$('radio-log').scrollTop=$('radio-log').scrollHeight;const last=g.radio.at(-1);if(last?.by!==net.session.id&&last){sound.play('hint');toast(last.text);}}
 $('power-status').textContent=`${g.event?'⚡ SOBRECARGA':g.power?'ENERGIA / '+(g.power==='belt'?'ESTEIRA':g.power):'ENERGIA DESLIGADA'} · CALOR ${Math.round(g.heat)}%`;
 $('observation').hidden=!g.observation;if(g.observation)$('observation-text').textContent=g.observation.text;
}
function renderTarget(){if(!room?.game||!renderer.local)return;const g=room.game,p={...g.players.find(p=>p.id===net.session?.id),...renderer.local,yaw:controls.yaw},a=actionFor(g,p,L),operator=g.role.operator===p.id;let text=a?.label||'';
 if(a?.type==='pickup'){const target=item(g.stock[a.shelf]);text=`Pegar ${target.name} ${target.variant}`;}
 $('target-label').hidden=!text;$('target-label').textContent=text?`${matchMedia('(pointer:coarse)').matches?'✋':'[E]'} ${text}`:'';$('crosshair').classList.toggle('ready',Boolean(a));$('action-label').textContent=a?.type==='deposit'?'DEPOSITAR':a?.type==='pickup'?'PEGAR':a?.type==='recover'?'RETIRAR':'INTERAGIR';
 const shelf=nearestShelf(p,L);$('product-detail').hidden=operator||shelf<0;if(!operator&&shelf>=0){const target=item(g.stock[shelf]);$('product-detail').textContent=`${target.sku} / ${target.name} ${target.variant} · ${target.amount} · selo ${target.mark}`;}
 const partner=g.players.find(v=>v.id!==p.id);if(partner)$('partner-marker').textContent=operator?`${partner.name} no mercado · ${distance(p,partner).toFixed(0)} m`:`${partner.name} na central`;
}
function renderGame(){
 const g=room.game,p=g.players.find(p=>p.id===net.session?.id);if(!p)return;renderer.setState(g,net.session.id);renderer.setActive(true);const paused=!online||room.players.some(p=>!p.connected);$('pause').hidden=!paused;updateControls();
 $('timer').textContent=time(Math.ceil(g.time));$('timer').classList.toggle('urgent',g.time<30);const second=Math.ceil(g.time);if(g.time<11&&oldSecond!==second&&!paused){oldSecond=second;sound.play('tick');}
 $('objective').textContent=g.checkedOut?'Recibo em mãos. Saída verde.':g.stage>=g.total?'Confirmem a compra em dupla.':`Entrega ${g.stage+1} de ${g.total} · Turno ${g.stage<3?'01':'02'}`;
 if($('progress-dots').dataset.count!==String(g.collected.length)){$('progress-dots').dataset.count=g.collected.length;$('progress-dots').replaceChildren();for(let i=0;i<g.total;i++){const el=document.createElement('span');el.className='progress-dot'+(i<g.collected.length?' done':'');$('progress-dots').append(el);}}
 renderPanel(g);$('event').hidden=!g.event;if(g.event)$('event').textContent=`⚡ SOBRECARGA · ${Math.ceil(g.event.remaining)}s · Rearme no cruzamento`;
 $('notice').textContent=g.notice;if(g.noticeSeq!==lastNotice){lastNotice=g.noticeSeq;sound.play(g.sound);}
 const held=item(p.holding),operator=g.role.operator===p.id;$('hand-icon').textContent=operator?'⌘':held?.icon||'☼';$('hand-text').textContent=held?`${held.name} ${held.variant} · ${held.amount}`:operator?'Posto: central de controle':'Lanterna pronta';$('partner-name').textContent=operator?'TAB abre controles e rádio.':'WASD anda · E interage · TAB rádio';
}
function renderResult(){const r=room.game.result,host=room.host===net.session?.id;$('result-title').textContent=r.won?'Compra concluída!':'O mercado fechou!';$('result-stars').textContent=r.won?'★'.repeat(r.stars)+'☆'.repeat(3-r.stars):'↻';$('result-message').textContent=r.won?'Seis entregas. Dois postos. Um time.':'Confiram os códigos e as embalagens. Mais uma tentativa?';$('score').textContent=r.score.toLocaleString('pt-BR');$('result-time').textContent=time(r.time);$('result-errors').textContent=r.errors;$('result-events').textContent=r.events;$('replay').disabled=!host||!online||room.players.some(p=>!p.connected);$('replay').textContent=host?'SÓ MAIS UMA ↻':'ESPERANDO QUEM CRIOU A SALA…';$('result-items').replaceChildren();r.answers.forEach(id=>{const el=document.createElement('span'),v=item(id);el.textContent=v.icon;el.title=v.name+' '+v.variant;if(!room.game.collected.includes(id))el.className='missing';$('result-items').append(el);});}
net.addEventListener('status',({detail})=>{online=detail==='online';$('connection').textContent=online?'ONLINE':detail==='connecting'?'CONECTANDO':'RECONECTANDO';$('connection').classList.toggle('online',online);$('create').disabled=!online;if(!online){controls.reset();if(screen==='play')$('pause').hidden=false;}updateControls();});net.addEventListener('session',()=>sound.unlock());
net.addEventListener('state',({detail})=>{room=detail.room;if(!room.game){show('lobby');renderLobby();return;}const phase=`${room.game.round}:${room.game.status}`;if(lastPhase!==phase){lastPhase=phase;lastNotice=-1;oldSecond=-1;controls.reset();}if(room.game.status==='playing'){show('play');renderGame();}else{show('result');renderResult();if(lastNotice!==room.game.noticeSeq){lastNotice=room.game.noticeSeq;sound.play(room.game.sound);}}});
net.addEventListener('error',({detail})=>{toast(detail.message);if(detail.code==='expired'){room=null;show('home');renderer.round=null;renderer.preview();}});net.addEventListener('ended',({detail})=>{room=null;show('home');renderer.round=null;renderer.preview();toast(detail.message);});net.connect();
