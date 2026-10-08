# Casal Contra o Caos · v3.0 — Mercado da Meia-noite

Cooperativo online para **duas pessoas, em 3D e primeira pessoa**. Um jogador é o **Comprador**, explorando o mercado com uma lanterna. O outro é o **Operador**, trabalhando na central: recebe pedidos, distribui energia, libera portas e escolhe rotas da esteira. Cada um tem informações que o outro precisa. Os postos trocam após três entregas.

## Abrir a versão nova no Windows

1. Instale Node.js **22 ou superior**: https://nodejs.org/ . Os testes desta versão usaram Node 24.19.0.
2. Extraia **todo o ZIP em uma pasta nova**. Não misture os arquivos com uma versão anterior.
3. Na pasta `casal-contra-o-caos`, abra **`INICIAR_JOGO.bat`**.
4. O iniciador instala as dependências, inicia este jogo e abre o endereço correto. A instalação precisa de internet.
5. A porta inicial é **3001**. Se estiver ocupada, ele procura uma livre até 3020 e abre o endereço correspondente.
6. Mantenha a janela aberta. `Ctrl+C` encerra o servidor.

O iniciador não encerra outros projetos nem abre a porta 3000. Para distinguir esta versão, a página inicial diz **“Você libera. Eu encontro.”** e **“EDIÇÃO NOTURNA / 03”**. Se aparecer a versão antiga, confira a pasta do iniciador e use `Ctrl+F5` no endereço exibido por ele.

## Terminal / macOS / Linux

Na pasta que contém `package.json`:

```bash
npm ci
npm run play
```

Use o endereço exato mostrado no terminal. No Linux, abra-o manualmente. `npm start` usa a porta 3001, mas não procura uma porta alternativa nem abre o navegador. Para desenvolvimento: `npm run dev`.

## Conectar a dupla

Uma pessoa cria a sala, a outra abre **o mesmo servidor**, escolhe entrar e informa o código de cinco caracteres. O anfitrião inicia quando ambos estiverem conectados.

- **Mesmo computador:** duas abas novas abertas manualmente, ou uma janela anônima. “Duplicar aba” pode copiar a credencial da sessão. Deixe o som em apenas uma aba.
- **Mesmo Wi-Fi:** no segundo aparelho, abra `http://IP-DO-COMPUTADOR:PORTA`, por exemplo `http://192.168.1.20:3001`. No Windows, `ipconfig` mostra o IPv4; permita Node no firewall da rede privada se necessário.
- **Redes diferentes:** é necessário publicar o servidor. Consulte `docs/PUBLICAR.md`. `localhost` não conecta aparelhos distintos. Este pacote não inclui hospedagem ou deploy.

## Uma entrega, passo a passo

1. O **Operador** recebe uma descrição do pedido, com setor, variante, quantidade e selo. Exemplo: algo que vai no cereal, integral, 1 litro e selo circular. Pode transmitir a descrição usando o botão do rádio.
2. O **Comprador** encontra a porta do setor, chega perto e olha para ela. Só ele recebe o código daquela placa. “Transmitir leitura” envia o código pelo rádio.
3. O Operador **energiza o setor**, digita o código e abre a porta por **20 segundos** no primeiro turno ou **14 segundos** no segundo.
4. O Comprador compara os produtos. Leite integral e desnatado, café intenso e descafeinado, pacotes de tamanhos diferentes: a embalagem importa. O expositor só libera o produto enquanto seu setor tem energia.
5. O Comprador leva o produto até a esteira, perto do caixa, e interage para depositar. Por dentro de cada setor, olhar para a porta e pressionar E aciona uma **saída de emergência de 5 segundos**, mesmo sem energia.
6. Na esteira, o Comprador lê um **símbolo**. O Operador recebe a tabela símbolo → destino, mas não o símbolo da carga. A dupla precisa se comunicar novamente.
7. O Operador energiza a **esteira** e escolhe FRIO, SECO, FRESCO ou FRÁGIL conforme sua tabela. O símbolo é um código de logística: a rota correta vem da tabela, não da categoria do alimento.
8. Produto e rota certos confirmam a entrega. Códigos e tabela são sorteados novamente. Após a terceira entrega, os personagens são reposicionados nos postos trocados.
9. Depois da sexta entrega, o Comprador confirma no **caixa** e o Operador confirma na **central**, com uma diferença máxima de **4 segundos**. O Comprador encerra na saída verde.

O carrinho próximo à saída mostra as compras aceitas; nesta versão o transporte ativo é feito pelas mãos e pela esteira. Mímicas e limite de três dicas foram retirados do modo principal.

## Dificuldade e recuperação

- **10 minutos** para concluir seis entregas.
- Apenas **um circuito energizado por vez**: A, B, C, D ou esteira. “Desligar” resfria o sistema.
- Energia ligada eleva o calor em 0,75 ponto/s; desligada reduz 3,2 pontos/s. Ao atingir 100%, ocorre sobrecarga. Também há falhas periódicas de energia.
- Na **sobrecarga**, o Comprador lê o código do painel no cruzamento central, junto à parede do lado oeste. O Operador usa esse código para rearmar. O sistema também se recupera automaticamente após 18 segundos; vocês podem perder tempo, mas não ficam presos.
- A carga precisa ser encaminhada em **45 segundos** no primeiro turno ou **32 segundos** no segundo.
- Código errado, produto errado, rota errada ou tempo da esteira esgotado custam **12 segundos**. Cargas rejeitadas ficam na esteira: retire com E e devolva o produto a uma prateleira, ou deposite novamente para corrigir apenas a rota.
- Portas têm proteção para não fechar sobre um jogador. O botão interno de emergência permite sair e tentar outra vez.
- O rádio é texto dentro do jogo. Não depende de chamada externa. Não há áudio de voz, vídeo ou captura de microfone.

## Controles

| Ação | Computador | Celular |
| --- | --- | --- |
| Andar | WASD ou ↑/↓ | Joystick esquerdo |
| Olhar | Clique no cenário e mova o mouse; arrastar também funciona | Arraste o cenário |
| Girar sem mouse | ←/→ | Arrastar cenário |
| Interagir | E ou espaço | Botão da mão |
| Abrir painel / rádio | Tab | Botão Rádio |
| Operar central | Botões do painel | Botões do painel |
| Soltar o mouse | Esc | — |
| Lanterna | F ou botão | Botão da lanterna |

Chegue perto e olhe para o objeto. A ação aparece junto à mira. O painel pode ser recolhido em “−” para enxergar o ambiente. Mensagens novas do parceiro também aparecem como aviso. Digitar no rádio interrompe o movimento.

A câmera fica estável por padrão; o menu `?` permite ativar um balanço discreto. Personagens continuam simples, com animação de caminhada e de item na mão.

## Mercado e visual

- Planta de **28 × 30**, quatro setores, **oito corredores**, sala de controle, área de estoque, triagem, caixa e saída.
- **16 produtos**, em oito famílias com duas variantes cada. Nomes, variante, quantidade, código e selo nas embalagens/expositores; leitura de proximidade também aparece na interface.
- Geladeiras, padaria com toldo, bandejas de ovos, balcão de queijo, caixotes de frutas e verduras, café e sacos de grãos.
- Grades temporizadas animadas, console com monitores e chaves, rack elétrico, dutos, esteira com roletes, scanner, caixas de destinos e terminal de pagamento.
- Luz ambiente reduzida, lanterna de alcance curto com sombras, luz setorial, azul dos frios, sinalização vermelha e saída verde.
- Three.js local, modelos e texturas gerados pelo código, sem CDN ou assets externos. Instâncias agrupam os objetos repetidos; densidade de pixels limitada a 1,5.

Exige **WebGL 2**. O estilo permanece simples e estilizado. Iluminação final, fluidez e interface em aparelhos reais ainda precisam da verificação indicada em `docs/VALIDACAO.md`.

## Pontuação

`entregas × 1200 + segundos restantes × 8 + rearmes em dupla × 150 − erros × 250`

Erros também descontam tempo durante a partida. Vitória com 9.800 pontos ou mais dá três estrelas; com 8.000, duas; abaixo disso, uma. Derrota dá zero estrelas e mostra os pontos parciais.

## Código e verificação

```bash
npm test
npm run check
```

| Pasta | Conteúdo |
| --- | --- |
| `client/game/models.js` | Produtos, expositores, cenário, grades e personagem |
| `client/game/renderer.js` | Câmera, previsão visual, luzes e leituras privadas |
| `client/game/controls.js` | Teclado, mouse e toque |
| `client/main.js` | Central, rádio, interface, salas e resultado |
| `server/game.js` | Regras, pedidos, energia, portas, esteira e projeção privada |
| `server/rooms.js` | Salas, credenciais e reconexão |
| `shared/` | Catálogo, planta, colisões e ações contextuais |
| `tests/` | Regras, fluxo completo, rede, modelos e interface sem GPU |

O servidor usa uma única instância. Salas ficam na memória e se perdem no reinício. Após detectar desconexão, a partida pausa; a sessão fica reservada por dois minutos. Recarregar a mesma aba permite retomar.

Não há persistência de partidas, múltiplas fases, chat de voz nem modo offline. O manifesto prepara a evolução da instalação como PWA, mas o multiplayer exige conexão.
