# Arquitetura v4.0.1

## Simulação e previsão

HTTP nativo + ws na mesma origem. Loop do servidor a 30 Hz; snapshots privados a 15 Hz. Comandos de movimento são simulados em passos de 1/60 s, compartilhando `stepPlayer` e as colisões estáticas. Um orçamento de tempo do servidor limita o quanto cada jogador pode simular. Filas limitadas e parâmetros finitos impedem acelerar a simulação enviando comandos extras.

O cliente guarda comandos não confirmados em `shared/prediction.js`. Cada snapshot confirma o último `seq` **processado**. A previsão parte da posição recebida e reaplica os comandos restantes. Um pequeno deslocamento visual suaviza correções residuais; não há mais a aproximação repetida à posição atrasada do servidor. Entradas são enviadas em lotes, normalmente a cada 50 ms, com até 12 comandos por mensagem. A interação aguarda o `afterSeq` correspondente antes de avaliar posição e direção.

Mudanças de posto incrementam `handoff`. Pausas descartam filas e velocidades, confirmando as sequências descartadas. O estado privado da fila não integra snapshots. A direção é normalizada e o ângulo vertical limitado. O protocolo `input` legado permanece para ferramentas/testes; o cliente v4 usa `inputs`.

## Planta e cooperação

`shared/levels.js` contém catálogo e planta 28 × 28. Corredores abertos, 16 expositores de produtos e gôndolas complementares. Obstáculos são pré-calculados por nível, sem reconstruir listas em cada subpasso. Expositores rotacionados têm dimensões e posição de aproximação próprias. A central é isolada; comandos exigem operador próximo ao console.

O campo interno `gates` agora contém os temporizadores de retirada, junto aos terminais de setor. Não integra colisões nem representa grades. Pegar requer o setor energizado e a retirada liberada. Em 40/30 s ela vence, mas a circulação segue livre.

O operador transmite explicitamente `brief`: setor e descrição tornam-se `sharedBrief`. O comprador recebe uma indicação de direção ao terminal conhecido. O destino do produto correto não é revelado por marcador.

## Informação privada

| Informação | Operador | Comprador |
| --- | --- | --- |
| Pedido atual | Descrição e setor | Descrição e setor após transmissão |
| Pedidos futuros | Ocultos | Ocultos |
| Código do terminal | Não recebe automaticamente | Proximidade e olhar para o terminal |
| Tabela de rotas | Recebe | Oculta |
| Símbolo da carga | Não recebe automaticamente | Proximidade da esteira |
| Código de rearme | Não recebe automaticamente | Proximidade do painel durante a falha |
| Produto escolhido | ID oculto | Próprio item/carga |
| Rádio e entregas aceitas | Compartilhados | Compartilhados |

`viewFor` exclui lista futura, credenciais, tabela bruta e símbolo interno antes de projetar por papel. Rádio usa texto, nunca HTML. A cooperação pressupõe que a dupla não tente obter o estado do servidor nem contornar o jogo.

## Mensagens

- Sala: `create`, `join`, `resume`, `start`, `replay`, `leave`.
- `view {ready}`: orientação/visibilidade e confirmação inicial do posto. Um jogador indisponível pausa simulação e relógios dos dois.
- `inputs {handoff, inputs:[{seq,x,y,yaw,pitch}]}`: passos de movimento fixos, validados e limitados pelo tempo.
- `interact {afterSeq}`: resolve ação contextual após os comandos pertinentes.
- `command {stage,action,...}`: somente operador próximo ao console; rejeita pedido desatualizado.
- Ações de central: `brief`, `power {sector}`, `gate {code}`, `reset {code}`, `route {route}`, `checkout`.
- `radio {text}`: até 140 caracteres, 0,7 s por remetente, histórico de oito mensagens.

Erros tiram 12 s. Rejeições distinguem produto e rota; o comprador pode recuperar a carga e tentar novamente. Após três entregas, troca de postos; depois de seis, confirmações em até quatro segundos e saída física.

`pending.reason` informa timeout, route ou product, sem expor a resposta do pedido. `shared/cargo.js` transforma estado da esteira em instrução para cada posto e condição de seleção. A interface reúne status, prazo, ativação de energia e escolhas clicáveis por símbolo no começo do painel. A validação autoritativa da rota continua exigindo carga esperando e esteira energizada.

## Renderização

Formas procedurais com geometria compartilhada, embalagens distintas e bordas arredondadas. Na construção do cenário, cores são convertidas em atributos de vértice e geometria agrupada por célula espacial de 7 m. Os textos usam um atlas 2048 × 2048 compartilhado. São 33 lotes estáticos na loja completa, contra 205 da v3. Partes animadas do personagem são agrupadas separadamente. A geometria do mundo é descartada ao reconstruir a rodada.

Um shader simples calcula luz direcional/ambiente, energia por região e cone de lanterna. A central tem brilho independente das falhas da loja. Não há shadow maps, pós-processamento nem dezenas de luzes pontuais. Sombreamento de contato simplificado é geometria estática. Os monitores da central são cenográficos, sem câmeras de renderização extras.

Celular: alvo de 30 FPS, pixel ratio máximo 1. Automático reduz resolução em degraus até 0,75 se houver quadros demorados persistentes. Econômico usa 0,75 e 30 FPS. Computador: alvo de 60 FPS e densidade máxima 1,5. O tamanho do drawing buffer só muda quando dimensões ou resolução mudam. Menus, página oculta e retrato não renderizam continuamente o mundo. Elementos de alvo são atualizados no máximo a cada 100 ms entre snapshots; textos inalterados não são reescritos.

A orientação é bloqueada na interface. Fullscreen/orientation lock é tentado por gesto do usuário quando suportado, com bloqueio visual como alternativa. Diálogos nativos também são escondidos durante a exigência de rotação. O teclado de códigos é interno para não reduzir a área útil de jogo. Inputs normais permanecem no nome, código da sala e rádio.

## Operação

Servidor único; sessões por aba, com credenciais aleatórias e snapshots sem tokens. Heartbeat detecta conexão morta; retomada por até dois minutos. Salas se perdem no reinício. Limites de 300 salas/1.000 sockets não são uma capacidade comprovada por teste de carga. Não há armazenamento compartilhado, múltiplas instâncias, voz nem dependência externa de assets.
