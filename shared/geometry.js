export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function roles(g){const operator=g.players[(g.round-1+(g.stage>=3?1:0))%2],shopper=g.players.find(p=>p.id!==operator.id);return {operator:operator.id,shopper:shopper.id};}
export function inside(p,s){return p.x>s.x&&p.x<s.x+s.w&&p.y>s.y&&p.y<s.y+s.h;}
export function collides(x,y,level,state={},r=.27){
 if(x<r||y<r||x>level.width-r||y>level.height-r)return true;
 const obstacles=[...level.shelves.map(s=>({...s,...level.shelfSize})),...level.walls,...level.obstacles,...(state.gates||[]).filter(g=>g.remaining<=0)];
 return obstacles.some(o=>Math.abs(x-o.x)<o.w/2+r&&Math.abs(y-o.y)<o.h/2+r);
}
export function move(entity,dx,dy,level,state={}){
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.15));
 for(let i=0;i<steps;i++){if(!collides(entity.x+dx/steps,entity.y,level,state))entity.x+=dx/steps;if(!collides(entity.x,entity.y+dy/steps,level,state))entity.y+=dy/steps;}
}
export function facing(p,target,r=1.9){const d=distance(p,target);return d<r&&(d<.5||((-Math.sin(p.yaw||0)*(target.x-p.x)-Math.cos(p.yaw||0)*(target.y-p.y))/d)>.4);}
export function nearestShelf(p,level,r=1.85){let best=-1,d=r;level.shelves.forEach((s,i)=>{const n=distance(p,s);if(n<d&&facing(p,s,r)){best=i;d=n;}});return best;}
export function actionFor(g,p,level){
 if(g.status!=='playing')return null;
 if(roles(g).operator===p.id)return facing(p,level.console,3)?{type:'console',label:'Abrir central de controle'}:null;
 if(g.checkedOut&&facing(p,level.exit,2))return {type:'exit',label:'Concluir a compra'};
 if(g.stage>=g.total&&facing(p,level.checkout,1.9))return {type:'checkout',label:'Confirmar compra com a central (4 s)'};
 const gate=(g.gates||[]).find(v=>facing(p,v,1.9));
 if(gate){const sector=g.sectors?.find(s=>s.id===gate.id);if(sector&&inside(p,sector))return {type:'egress',gate:gate.id,label:'Acionar saída de emergência'};return {type:'read',label:'Leia o código e avise a central'};}
 if(facing(p,level.relay,1.7)&&g.event)return {type:'read',label:'Leia o código de rearme e avise a central'};
 if(facing(p,level.belt,1.95)){if(p.holding&&!g.pending)return {type:'deposit',label:'Colocar carga na esteira'};if(!p.holding&&g.pending?.status==='rejected')return {type:'recover',label:'Retirar carga devolvida'};if(g.pending)return {type:'read',label:'Informe o símbolo da carga à central'};}
 const shelf=nearestShelf(p,level);if(shelf>=0)return p.holding?{type:'return',shelf,label:'Devolver produto'}:{type:'pickup',shelf,label:'Pegar produto'};
 return null;
}
