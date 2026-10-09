// Shared presentation of the existing conveyor rules. Never reveals a cargo symbol or item ID.
export function cargoGuidance(g){
 const pending=g.pending;
 if(!pending)return {kind:'idle',title:'Aguardando uma carga.',detail:'O comprador precisa depositar o produto na esteira.',canRoute:false,canPower:false};
 const rejected=pending.status==='rejected',reason=pending.reason||(rejected&&pending.remaining<=0?'timeout':null);
 if(rejected){
  const product=reason==='product';
  const cause=({timeout:'O prazo da carga esgotou.',route:'A rota escolhida estava incorreta.',product:'O produto não corresponde ao pedido.'})[reason]||'A carga precisa ser conferida.';
  return {kind:'rejected',title:'Carga devolvida — rotas bloqueadas',detail:`${cause} ${product?'O comprador deve retirar a carga, devolver o produto na prateleira e escolher a embalagem do pedido.':'O comprador deve retirar a carga com a mão/E e depositá-la novamente. Depois, ligue a esteira e escolha a rota.'}`,operator:product?'Peça ao seu par para retirar a carga e trocar o produto.':'Peça ao seu par para retirar a carga e depositá-la novamente.',shopper:product?'Retire a carga, devolva na prateleira e escolha o produto do pedido.':'Retire a carga com a mão/E e depois deposite novamente.',canRoute:false,canPower:false};
 }
 if(g.paused)return {kind:'paused',title:'Partida pausada',detail:'Aguarde os dois jogadores ficarem prontos para continuar.',operator:'Aguarde seu par ficar pronto para continuar.',shopper:'Aguarde seu par ficar pronto para continuar.',canRoute:false,canPower:false};
 if(g.event)return {kind:'overload',title:'Esteira sem energia — sobrecarga',detail:'Rearme o circuito com o código do comprador ou aguarde o resfriamento. Depois, ligue a esteira.',operator:'Peça o código de rearme e digite para religar a energia.',shopper:'Leia e transmita o código do painel de rearme.',canRoute:false,canPower:false};
 if(g.power!=='belt')return {kind:'power',title:'Falta ligar a esteira',detail:'Toque em “Ligar esteira” abaixo. Depois, selecione o símbolo que seu par leu na carga.',operator:'Toque em “Ligar esteira” e selecione o símbolo informado pelo seu par.',shopper:'Transmita o símbolo e peça à central para ligar a esteira.',canRoute:false,canPower:true};
 return {kind:'ready',title:'Esteira ligada — escolha o símbolo',detail:'Peça o símbolo ao comprador e toque no botão correspondente abaixo para encaminhar a carga.',operator:'Selecione o símbolo que seu par leu na carga para encaminhá-la.',shopper:'Leia o símbolo da carga e transmita para a central.',canRoute:true,canPower:false};
}
