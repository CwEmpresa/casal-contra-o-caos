# Casal Contra o Caos · v4.0 — Mercado da Meia-noite

Cooperativo online para duas pessoas, em **3D e primeira pessoa**, preparado para celular na horizontal. Um jogador opera a central; o outro busca os produtos. São seis entregas, dez minutos e troca de postos depois da terceira entrega.

## O que mudou nesta versão

- Mercado aberto de 28 × 28: frios e padaria ao fundo, hortifrúti à esquerda, gôndolas paralelas de mercearia, esteira e caixas na frente. Oito corredores sinalizados, mapa e indicação de direção.
- Circulação livre: os códigos liberam a **retirada dos produtos**, por 40 s no primeiro turno e 30 s no segundo. Não há grades prendendo o comprador em salas.
- Central com iluminação própria, inclusive durante sobrecargas; painel claro e comandos apresentados conforme a etapa.
- Visual cartoon com bordas arredondadas, produtos distintos, rótulos, prateleiras abastecidas nas duas faces da mercearia e cores por setor. Personagens simples.
- Tela horizontal obrigatória no celular. O jogo pausa para a dupla quando um aparelho fica na vertical ou a página vai para segundo plano.
- HUD para paisagem, controles de toque separados, rádio e mapa em painéis próprios. Teclado numérico do jogo para os códigos.
- Introdução curta por posto; o relógio espera ambos confirmarem que estão prontos. Pedido só chega ao comprador quando a central o transmite.
- Desenho estático agrupado em 33 lotes, contra 205 na v3; um atlas para os rótulos, sem sombras dinâmicas nem várias luzes pontuais. Isso reduz trabalho gráfico, mas não mede FPS.
- No celular: alvo de 30 FPS, densidade de pixels limitada a 1, redução automática de resolução quando há lentidão sustentada e modo Econômico. Computador: alvo de 60 FPS, densidade máxima 1,5.
- Movimento previsto localmente, com confirmação dos comandos pelo servidor e reaplicação dos comandos ainda pendentes. O tamanho da tela só é recalculado quando necessário.

## Abrir no computador

1. Instale Node.js 22 ou superior: https://nodejs.org/ . Validado com Node 24.19.0.
2. Extraia **todo o ZIP em uma pasta nova**. Não misture versões.
3. Abra `INICIAR_JOGO.bat` dentro da pasta `casal-contra-o-caos`.
4. O iniciador instala dependências, inicia este jogo e abre a porta correta. Começa em 3001 e procura outra até 3020 se necessário.
5. Mantenha a janela aberta. `Ctrl+C` encerra o servidor.

A tela inicial da v4 diz **“Uma compra. Dois postos. Só juntos.”** e **“EDIÇÃO 04”**. Se aparecer outro projeto, confira o endereço exibido no terminal e a pasta de onde abriu o iniciador.

No terminal, macOS ou Linux:

```bash
npm ci
npm run play
```

Abra o endereço mostrado. `npm start` usa 3001 sem procurar outra porta. `npm run dev` reinicia o servidor quando o código muda.

## Conectar os dois celulares

- Uma pessoa cria a sala. A outra abre **o mesmo endereço**, toca em “Entrar com código” e informa os cinco caracteres.
- No mesmo Wi-Fi, use o IP do computador e a porta, por exemplo `http://192.168.1.20:3001`. O computador precisa permanecer ligado e aceitar Node no firewall da rede privada.
- Em redes diferentes, publique este servidor conforme `docs/PUBLICAR.md`. `localhost` em outro aparelho não aponta para o seu computador.
- Girem os dois aparelhos. Se a rotação automática do sistema estiver desligada, habilitem-na. O botão ⛶ tenta abrir tela cheia e bloquear a orientação quando o navegador permite. Nos demais casos, a tela vertical continua bloqueada pelo jogo.
- Teste em abas no mesmo computador pode pausar ao alternar abas, pois segundo plano pausa o jogo. Para testar simultaneamente, use dois aparelhos ou duas janelas visíveis. Evite “Duplicar aba”, que pode copiar a sessão.

O pacote contém código, não uma publicação automática. O projeto mantém o servidor Node/WebSocket na mesma origem.

## Cada entrega, passo a passo

| Etapa | Central | Comprador no mercado |
| --- | --- | --- |
| 1. Pedido | Leia a descrição e toque em **Transmitir pedido**. | Leia o pedido e siga a indicação até o terminal do setor. |
| 2. Liberação | Ligue o setor. Peça o código, toque no campo numérico e digite os três números. | Aproxime-se do terminal, olhe para ele e toque em **Transmitir leitura**. |
| 3. Escolha | Ajude a conferir variante, quantidade e selo. Mantenha o setor ligado. | Com a retirada liberada, compare as embalagens e pegue a correta. |
| 4. Esteira | Espere o símbolo. Ligue **Esteira**, consulte a tabela símbolo → rota e toque no destino. | Leve à esteira na frente da loja. Deposite, leia o símbolo e transmita. |
| 5. Próximo pedido | Transmita a nova descrição. | Busque o próximo produto. Códigos e tabela mudam. |

Depois da terceira entrega, os postos trocam automaticamente e a explicação do novo papel aparece. Depois da sexta, o comprador vai ao **caixa**, e os dois confirmam, cada um no seu posto, dentro de quatro segundos. Por fim, o comprador vai à **saída verde** e interage.

A rota correta é a indicada pela tabela do símbolo, não pela categoria do alimento. O carrinho é cenográfico; as compras são transportadas nas mãos e pela esteira. Há 16 produtos, com duas variantes em cada uma das oito famílias. Mímica e limite de três dicas não fazem parte deste modo.

## Dificuldade e recuperação

- Apenas um circuito funciona por vez: A, B, C, D ou esteira. Energia ligada aumenta o calor em 0,75 ponto/s; desligada resfria 3,2 pontos/s.
- As sobrecargas periódicas começam depois da primeira entrega. O comprador lê o **painel de rearme junto à central**, e o operador digita seu código. Também é possível esperar os 18 s de resfriamento automático.
- A carga deve ser encaminhada em 45 s no primeiro turno ou 32 s no segundo.
- Erros de código, produto, rota e prazo da esteira descontam 12 s. A mensagem distingue rota incorreta de produto fora do pedido.
- Uma carga devolvida pode ser retirada. Se a rota estava errada, deposite novamente; se o produto estava errado, devolva na prateleira e escolha a embalagem pedida.
- Se o acesso aos produtos vencer, peça nova liberação com o código do terminal. Os corredores continuam livres.

## Controles

| Ação | Computador | Celular na horizontal |
| --- | --- | --- |
| Andar | WASD ou ↑/↓ | Direcional à esquerda |
| Olhar | Mouse / arraste, ou ←/→ | Arraste o cenário |
| Pegar, depositar, confirmar | E ou espaço | Botão da mão |
| Transmitir leitura local | E ou botão na tela | Mão ou “Transmitir leitura” |
| Pedido / central | Tab | Pedido / Central |
| Conversar | Botão Rádio | Botão Rádio |
| Mapa | Botão Mapa | Botão Mapa |
| Soltar mouse | Esc | — |
| Lanterna | F | ☼ |

Feche o painel para caminhar. Abra-o novamente pelo botão Central/Pedido. No menu, escolha **Econômico** se precisar reduzir mais a resolução; a câmera estável já vem ligada. O rádio é texto; vocês também podem conversar em chamada separada. O jogo não captura microfone.

## Verificação e limites

```bash
npm test
npm run check
```

Veja `docs/VALIDACAO.md` para os testes executados. Há testes de partida completa, rede real, privacidade, pausa por orientação, previsão com atraso e geometria. O cenário também foi inspecionado por renderização fora do navegador. **FPS, layout CSS e multitouch ainda precisam ser conferidos nos aparelhos reais.** Requer WebGL 2; não há garantia para todo celular.

Servidor de uma única instância, salas em memória e reconexão por até dois minutos. Reiniciar o servidor encerra as salas. Não há banco de dados, chat de voz, jogo offline ou múltiplas fases. O manifesto define a orientação da aplicação; o multiplayer depende de conexão.

Pontuação: `entregas × 1200 + segundos restantes × 8 + rearmes × 150 − erros × 250`.
