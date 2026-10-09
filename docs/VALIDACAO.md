# Validação v4

8 de outubro de 2026. Node.js 24.19.0.

## Verificações executadas

`npm test`: 19 testes aprovados.

- Partida completa com seis entregas por movimentação física, colisões, leitura privada dos códigos e símbolos, energia, liberação dos produtos, troca de postos, pagamento sincronizado e saída.
- Acesso a todos os expositores na planta aberta, sem exigir abertura de grades; colisões de prateleiras rotacionadas e isolamento da central.
- Privacidade por papel/proximidade; permissões do console; rejeição de comandos inválidos e de pedido antigo.
- Temporizador de retirada; energia única; recuperação de produto, rota e prazo incorretos; sobrecarga e rearme.
- Rádio, confirmação de caixa, desconexão e fim de tempo.
- Movimento previsto com atraso simulado de 200 ms: reaplicação dos comandos não confirmados sem erro acumulado no cenário testado.
- Limites de lotes, normalização, rejeição de valores inválidos e orçamento de tempo contra aceleração por envio excessivo.
- Pausa por disponibilidade/orientação: relógios congelam e movimento pendente é descartado.
- WebSockets reais: criar/entrar/iniciar, rejeitar terceiro jogador, movimento, rádio, privacidade, reconexão, replay e encerramento.
- Protocolo mobile por WebSockets: entradas processadas antes da interação, coleta, ID oculto da central, pausa e retomada.
- HTTP e módulos locais; bloqueio de arquivos internos/traversal e rejeição de origem WebSocket externa.
- Módulo real da interface executado sobre adaptador de DOM: controles existentes no HTML, introdução por posto, envio de pedido, teclado/central, rádio sem interpretar HTML, troca de papel, leitura, retrato/paisagem e resultados. Renderizador e controles são substituídos por adaptadores nesse teste.
- Geometria finita para 16 variantes, cenário e animação de personagem.

`npm run check`: todos os módulos JavaScript com sintaxe válida.

## Orçamento gráfico e inspeção

Comparação pela geometria gerada com o mesmo Three.js instalado:

| Medida | v3 | v4 |
| --- | ---: | ---: |
| Grupos estáticos no cenário completo | 205 | 33 |
| Triângulos do cenário v4 | — | 82.768 |
| Texturas de rótulos na v4 | — | 1 atlas 2048² |
| Sombras dinâmicas | Lanterna | Nenhuma |

A contagem de grupos não equivale a FPS. A geometria é agrupada por área para permitir descarte fora da câmera. Personagem, mãos, carga e destaque adicionam desenhos dinâmicos.

Os dois shaders do cenário (cor e atlas) foram compilados e ligados em EGL/OpenGL Mesa 25.2.8, com rasterização por software llvmpipe. A geometria e o atlas reais foram renderizados em quatro vistas 844 × 390: entrada, corredor, frios e central. As imagens foram inspecionadas, incluindo rótulos e iluminação própria da central. Esse ensaio adapta o invólucro do shader para OpenGL e não executa a integração WebGL/Three.js no navegador.

## Limites

Não foi possível executar o navegador local: o download do Chromium retornou arquivos inválidos, e o navegador remoto não alcançou o servidor local. Portanto, **não houve medição de FPS em celular nem validação visual do layout CSS, pointer lock ou multitouch em navegador real**. O ensaio EGL confirma geometria/material fora do navegador; não substitui esse teste.

Antes de considerar a versão final para aparelhos: testar Android/Chrome e iPhone/Safari em paisagem, direcional e olhar simultâneos, interface da central com rolagem interna, rádio/teclado, rotação com diálogo aberto, tela cheia quando suportada e reconexão. Os alvos 30/60 FPS são limites de renderização, não garantias de desempenho. Use Econômico no menu se necessário.

A dificuldade (dez minutos, seis entregas, liberação 40/30 s) ainda exige avaliação da dupla. Não houve teste de carga, execução do iniciador Windows nem publicação de servidor nesta atualização. O pacote mantém a hospedagem Node/WebSocket descrita em PUBLICAR.md.
