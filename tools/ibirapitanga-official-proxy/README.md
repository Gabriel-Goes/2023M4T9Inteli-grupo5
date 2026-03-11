# Ibirapitanga Official Proxy

Proxy local para o frontend `ibirapitanga_copy` consumir a API e o stream oficial da Ibirapitanga sem expor `JWT` de usuario ou `device_api_key` no navegador.

## O que ele faz

1. Consulta `GET /devices?page=N` na API oficial usando o `IBIRA_USER_JWT`.
2. Resolve a `device_api_key` de cada device em `GET /devices/{device_id}/api-keys`.
3. Abre o WebSocket oficial `wss://ws-ibirahml.linux.ipt.br/v1/devices/{device_id}/telemetry`.
4. Reexponhe isso localmente em `WS /nrt/{deviceId}` para a UI.

## Variaveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
IBIRA_API_BASE_URL=https://api-ibirahml.linux.ipt.br
IBIRA_WS_BASE_URL=wss://ws-ibirahml.linux.ipt.br
IBIRA_USER_JWT=<jwt-do-usuario>
IBIRA_PROXY_HOST=127.0.0.1
IBIRA_PROXY_PORT=8788
```

## Executar

```bash
cd tools/ibirapitanga-official-proxy
npm install
npm start
```

Health check:

```bash
curl http://127.0.0.1:8788/api/health
```

## Observacao

- O proxy oficial e o fluxo principal da branch.
- O bridge serial/MQTT antigo continua no repositorio apenas como fallback de contingencia.
