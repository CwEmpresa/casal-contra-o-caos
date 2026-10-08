# Arquitetura v3 — dois postos interdependentes

## Simulação e renderização

Node HTTP nativo + `ws` serve cliente, módulos locais do Three.js e WebSocket na mesma porta. Simulação autoritativa a 30 Hz, snapshots individuais a 15 Hz, renderização por `requestAnimationFrame`. O cliente antecipa a posição e usa as mesmas colisões do servidor; câmera responde localmente, parceiro usa interpolação. Regras, energia, relógio, permissões, pedidos e resultado pertencem ao servidor.

`shared/levels.js` define 16 produtos, quatro setores e oito corredores em uma planta 28 × 30. As famílias de produtos têm duas variantes: descrições dos pedidos exigem comparar variante, quantidade e selo. `shared/geometry.js` contém colisão em subpassos, direção de interação, papéis e ações disponíveis. Grades fechadas integram a colisão em ambos os lados.

Personagens não colidem entre si. As paredes isolam a central, e os comandos só são aceitos para o Operador a até três metros do console. Na terceira entrega, `placeRoles` troca os postos e incrementa `handoff`; o renderizador usa esse marcador para reposicionar a câmera e limpar o movimento previsto.

## Informação privada

O estado interno mantém `list`, `codes`, `routeMap`, `cargoSymbol` e `resetCode`. `viewFor` remove esses campos antes de criar a projeção por jogador:

| Informação | Operador | Comprador |
| --- | --- | --- |
| Pedido atual | Setor e descrição; sem ID da resposta | Não recebe |
| Pedidos futuros | Não recebe | Não recebe |
| Código da porta | Não recebe automaticamente | Recebe perto da porta e olhando para ela |
| Tabela símbolo → rota | Recebe | Não recebe |
| Símbolo da carga | Não recebe automaticamente | Recebe perto da esteira e olhando para ela |
| Código de rearme | Não recebe automaticamente | Recebe perto do painel durante a falha |
| Produto na mão / carga pendente | Identificador oculto | Recebe para representar a escolha |
| Rádio e entregas concluídas | Recebe | Recebe |

As descrições podem ser decifradas pelo Operador: a assimetria consiste no acesso físico e nas leituras locais do Comprador. Não é proteção contra duas pessoas compartilharem a mesma tela ou combinarem respostas fora do jogo.

## Protocolo de jogo

- `input {x,y,yaw,pitch,seq}`: direção normalizada, giro e inclinação limitada. `seq` é informativo; não há rollback determinístico.
- `interact`: ação determinada no servidor pela posição, papel e direção do jogador.
- `command {stage, action, ...}`: só o Operador próximo ao console. `stage` rejeita ações atrasadas de outro pedido.
- `power {sector}`: `A`, `B`, `C`, `D`, `belt` ou `null`; apenas um circuito.
- `gate {code}`: confere código do setor energizado; libera por 20/14 segundos.
- `route {route}`: exige esteira energizada, carga esperando, símbolo traduzido corretamente e produto certo.
- `reset {code}`: confere código de rearme da sobrecarga.
- `checkout`: confirmação temporária de quatro segundos; a confirmação do Comprador é acionada fisicamente no caixa.
- `radio {text}`: 1–140 caracteres, intervalo de 0,7 s por remetente; histórico de oito mensagens. Cliente usa `textContent`, não HTML.

Os nomes `power`, `gate`, `route`, `reset` e `checkout` são valores de `action` em mensagens `command`. Os envelopes de sala (`create`, `join`, `resume`, `start`, `replay`, `leave`) permanecem em `server/rooms.js`.

## Falhas recuperáveis

Carga rejeitada permanece na esteira e pode ser retirada. O prazo de triagem é 45/32 segundos. Cada erro tira 12 segundos e contabiliza penalidade na pontuação. Saída de emergência por dentro da grade funciona sem energia; a grade adia seu fechamento enquanto houver jogador na passagem. Desligar energia resfria, e sobrecarga pode ser rearmada em dupla ou esperar 18 segundos.

Após seis entregas, dois pulsos de confirmação dentro de quatro segundos autorizam a compra. Só então a interação física na saída encerra a missão.

## Modelos e iluminação

Modelos procedurais de baixo número de polígonos. Rótulos importantes têm texto, quantidade e selo redundante à cor. Cache de geometrias, materiais e rótulos dos produtos; objetos estáticos repetidos são agrupados em instâncias. Rótulos exclusivos do cenário são descartados ao trocar de partida. Lanternas, iluminação setorial e leituras locais são atualizadas sem reconstruir a loja a cada snapshot.

Densidade de pixels limitada a 1,5. Uma lanterna lança sombras; as luzes setoriais não. Isso reduz custo, mas a qualidade visual e eventuais vazamentos de luz ainda exigem inspeção em GPU real. O Operador tem uma central em primeira pessoa com painel de comandos; monitores do cenário são cenográficos, não feeds de câmera.

## Reconexão e operação

Credencial aleatória por aba, nunca publicada nos snapshots. Heartbeat detecta conexões mortas; depois da detecção, simulação pausa. Retomada por até dois minutos. Reinício do processo encerra salas.

Limites de proteção: 300 salas e 1.000 sockets, sem teste de carga que comprove essa capacidade. Múltiplas instâncias exigem roteamento e armazenamento compartilhado, não implementados. Não há banco, serviço de voz ou dependência de CDN.
