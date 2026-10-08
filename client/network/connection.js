export class Connection extends EventTarget{
 constructor(){super();this.ws=null;this.retry=0;this.timer=null;this.stopped=false;try{this.session=JSON.parse(sessionStorage.getItem('chaos-session'));}catch{this.session=null;}}
 emit(type,detail){this.dispatchEvent(new CustomEvent(type,{detail}));}
 connect(){
  this.stopped=false;this.emit('status','connecting');
  this.ws=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`);
  this.ws.onopen=()=>{this.retry=0;this.emit('status','online');if(this.session)this.send({type:'resume',...this.session});};
  this.ws.onmessage=event=>{let m;try{m=JSON.parse(event.data);}catch{return;}
   if(m.type==='session'){this.session={code:m.code,id:m.id,token:m.token};sessionStorage.setItem('chaos-session',JSON.stringify(this.session));}
   if(m.type==='ended'||m.code==='expired')this.clear();
   this.emit(m.type,m);
  };
  this.ws.onclose=event=>{if(this.stopped)return;if(event.code===4001){this.clear();this.emit('ended',{message:'Esta partida foi aberta em outra aba.'});this.stopped=true;return;}
   this.emit('status','offline');clearTimeout(this.timer);this.timer=setTimeout(()=>this.connect(),Math.min(5000,500*2**this.retry++));
  };
  this.ws.onerror=()=>{};
 }
 send(data){if(this.ws?.readyState===WebSocket.OPEN){this.ws.send(JSON.stringify(data));return true;}return false;}
 clear(){this.session=null;sessionStorage.removeItem('chaos-session');}
 leave(){this.send({type:'leave'});this.clear();}
}
