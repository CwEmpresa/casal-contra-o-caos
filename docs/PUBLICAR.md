# Publicar em produção

O jogo precisa de um processo Node persistente que aceite WebSockets. Frontend e servidor são publicados juntos. Não basta hospedar a pasta `client` como site estático.

## Opção simples: Render Web Service

1. Crie um repositório GitHub e envie o conteúdo desta pasta. `package.json`, `server`, `client`, `shared` e `package-lock.json` precisam estar na raiz do repositório. Não envie `node_modules` nem `.env`.
2. No Render, escolha **New → Web Service** e conecte o repositório.
3. Preencha:

| Configuração | Valor |
| --- | --- |
| Runtime / Language | Node |
| Build Command | `npm ci --omit=dev` |
| Start Command | `npm start` |
| Health Check Path | `/health` |
| Instâncias | **1** |
| Variável `NODE_VERSION` | `24` |
| Variável `NODE_ENV` | `production` |

4. Escolha a região com melhor latência para os dois jogadores e um plano conforme o uso. Prefira uma instância que permaneça ligada para partidas regulares; confirme os termos e preços atuais no provedor.
5. Publique. O Render injeta `PORT`; o código já escuta essa porta em `0.0.0.0`.
6. Abra a URL HTTPS fornecida. O cliente usa automaticamente `wss://MESMO-DOMINIO/ws`.
7. Teste em duas redes diferentes: uma pessoa no Wi-Fi e outra no 4G/5G. Crie e entre na mesma sala, jogue uma rodada e teste atualizar uma das páginas.

O arquivo `render.yaml` também está incluído para o fluxo Blueprint. A criação de conta, conexão ao GitHub e escolha/pagamento do plano são configurações externas que você faz no provedor. Não há serviço contratado ou deploy feito neste pacote.

### Seu domínio

No serviço do Render, abra **Settings → Custom Domains → Add Custom Domain**. Informe, por exemplo, `jogar.seudominio.com`. No seu provedor de DNS, configure os registros **exatos mostrados pelo Render**, volte ao painel e verifique o domínio. Aguarde a emissão do certificado HTTPS.

Por padrão, o servidor aceita o `Origin` do mesmo host usado para acessar o jogo. Não precisa editar uma URL no frontend. Se quiser restringir a uma origem única, defina `ALLOWED_ORIGIN=https://jogar.seudominio.com` (sem barra final). Isso também rejeitará o WebSocket ao abrir a URL alternativa do Render; use apenas o domínio escolhido nesse caso.

## Alternativa: Docker em servidor/VPS

Na raiz:

```bash
docker build -t casal-caos .
docker run -d --name casal-caos --restart unless-stopped -p 3001:3001 -e NODE_ENV=production casal-caos
```

Coloque um proxy HTTPS na frente. Exemplo `Caddyfile` incluído em `docs/Caddyfile.example`:

```text
jogar.seudominio.com {
    reverse_proxy 127.0.0.1:3001
}
```

Aponte o DNS para sua VPS e configure Caddy com as portas 80/443 acessíveis. O proxy precisa suportar upgrade de WebSocket. Mantenha a porta Node acessível apenas conforme sua configuração de rede. Não execute dois contêineres independentes atrás de balanceamento sem implementar o roteamento das salas.

## Variáveis

- `PORT`: padrão local `3001`; em hospedagem, use a porta fornecida pelo provedor.
- `ALLOWED_ORIGIN`: opcional, uma origem exata permitida para WebSocket.
- `NODE_ENV`: identificador do ambiente; use `production` na hospedagem.

## Checklist de lançamento

- HTTPS e WebSocket funcionando em duas redes distintas.
- Joystick, giro de câmera e interação simultâneos no Safari/iPhone e Chrome/Android.
- Sem cortes de interface em retrato/paisagem e com barras do navegador abertas.
- Reconexão após recarregar e após uma queda curta da rede.
- Vitória, derrota, replay, troca de postos, rádio, energia, códigos privados, esteira e confirmação em dupla testados com duas pessoas.
- Som ativado somente após gesto e opção de desligar funcionando.
- Uma instância configurada; reinícios e manutenção encerram salas em andamento.

## Documentação oficial consultada

Consultada em 5 de outubro de 2026:

- https://render.com/docs/deploy-node-express-app
- https://render.com/docs/websocket
- https://render.com/docs/custom-domains
- https://github.com/websockets/ws

As telas e os planos do provedor podem mudar. Os comandos de build/start acima são os deste projeto; o guia do Render usa um app Express como exemplo, mas este servidor usa o HTTP nativo do Node.
