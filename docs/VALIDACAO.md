# Validação v3

Data: 7 de outubro de 2026. Ambiente: Node.js 24.19.0.

## Executado

`npm test`: **15 testes aprovados**.

- Partida completa: seis entregas por movimentação física com colisões, código lido na porta, expositor energizado, saída de emergência, símbolo local da carga, rota escolhida pela central, troca de postos, confirmação em dupla e saída.
- Projeção privada: pedidos futuros e códigos internos ausentes dos snapshots; leituras limitadas ao papel, proximidade e olhar; tabela só na central.
- Permissões e comandos inválidos: papel, distância do console, pedido desatualizado e circuito inexistente.
- Energia única, colisão com grade fechada, duração da abertura, saída interna e proteção contra fechamento sobre jogador.
- Variante errada, rota errada e tempo de esteira esgotado; carga recuperável sem avanço indevido.
- Coleta permitida apenas ao Comprador com energia no setor correto.
- Sobrecarga, código local de rearme, permissão do Operador e resfriamento automático.
- Rádio: tamanho, intervalo por remetente, histórico e pausa durante desconexão.
- Confirmações de caixa dentro da janela, rejeição de confirmação expirada, pausa e derrota por tempo.
- Movimento finito, vetores normalizados, paredes, ausência de atravessamento de grade, isolamento físico da central e acesso a todos os expositores. Cem listas sorteadas sem itens inexistentes/repetidos e tabelas completas.
- Geometria de 16 variantes e do cenário com matrizes finitas; agrupamento em instâncias reduz os objetos desenhados e mantém menos de 350 grupos/meshes estáticos. Isso não mede FPS.
- Animação básica de caminhada e de produto na mão.
- WebSockets reais: criar/entrar, rejeitar terceiro jogador, início pelo anfitrião, snapshots privados, comandos, rádio, movimento, desconexão, reconexão, token inválido, replay e encerramento.
- HTTP: cliente, módulos Three, healthcheck, arquivos internos e traversal bloqueados; origem WebSocket externa rejeitada.
- Interface: inicialização do módulo real sobre adaptador de DOM, correspondência dos IDs do HTML, botões da central, rádio, texto sem injeção HTML, troca de papel, leituras e resultado. Renderizador/controles são substituídos por adaptadores nesse teste.

`npm run check`: módulos JavaScript verificados com `node --check`.

O problema de passagem estreita causado pelo painel de rearme foi detectado no teste de acesso físico. O painel foi reposicionado junto à parede do cruzamento; acesso e partida completa passaram após a correção.

## Limites desta verificação

**Não houve execução de WebGL em navegador real nesta sessão.** Os testes do DOM e dos modelos não executam layout CSS, shaders, texturas na GPU, sombras, pointer lock ou multitouch. A iluminação foi alterada no código e os modelos foram validados estruturalmente, mas ainda é necessário jogar em aparelhos reais para avaliar a aparência, a fluidez e a legibilidade final.

Verificar com duas pessoas: iluminação, leitura de embalagens, controles simultâneos em celular, painel em retrato/paisagem, teclado virtual, áudio Safari e reconexão entre redes. A dificuldade inicial (10 minutos, seis entregas, portas de 20/14 segundos) é um ponto de partida sem balanceamento por playtest humano.

O iniciador de porta não mudou nesta versão. Na v2, foi exercitado em Linux com uma porta ocupada: escolheu outra porta e respondeu 200 em `/health`. O `.bat` não foi executado em Windows neste ambiente.

Não houve teste de carga nem publicação do servidor. Salas continuam em memória de uma instância. O pacote é código executável localmente; consulte `PUBLICAR.md` para hospedá-lo.
