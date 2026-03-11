# Documentacao Tecnica da Branch `feature/ibirapitanga`

Data de referencia: 2026-03-10  
Base de comparacao: `origin/main...feature/ibirapitanga`

## 1) Objetivo

Consolidar a evolucao da branch que agora tem dois blocos claros:

- uma UI local (`ibirapitanga_copy`) para iterar dashboards;
- um proxy local para consumir o backend oficial da Ibirapitanga sem expor segredos no navegador.

## 2) Fluxo principal atual

Arquitetura alvo da branch:

1. `ESP32` publica no broker MQTT oficial da Ibirapitanga.
2. O backend oficial registra o device e disponibiliza sua leitura.
3. O proxy local usa `JWT` de usuario para consultar a API oficial.
4. O proxy resolve a `device_api_key` do device em `GET /devices/{device_id}/api-keys`.
5. O proxy abre `wss://ws-ibirahml.linux.ipt.br/v1/devices/{device_id}/telemetry`.
6. O frontend local consome o proxy em same-origin via `/api/*` e `/nrt/{deviceId}`.

Observacao:

- o bridge serial/MQTT anterior continua no repositorio apenas como fallback.

## 3) Inventario tecnico relevante

### 3.1 Frontend local

- `src/ibirapitanga_copy`
- Rotas:
  - `/dashboards`
  - `/showroom`
  - `/devices`

### 3.2 Proxy oficial

- `tools/ibirapitanga-official-proxy`
- Endpoints locais:
  - `GET /api/health`
  - `GET /api/devices?page=N`
  - `GET /api/dashboards?page=N`
  - `WS /nrt/{deviceId}`

### 3.3 Fallback legado

- `tools/serial-mqtt-ws-bridge`
- `tools/local-mqtt-broker`

Esses componentes permanecem como contingencia e nao como fluxo principal.

## 4) Rotas e contratos publicos

### 4.1 UI local

- `/` redireciona para `/dashboards`
- `/dashboard` redireciona para `/showroom`
- `/dashboards`
- `/showroom`
- `/devices`

### 4.2 API local do proxy

- `GET /api/health`
- `GET /api/devices?page=N`
- `GET /api/dashboards?page=N`
- `WS /nrt/{deviceId}`

### 4.3 Tipos relevantes no frontend

- `DeviceConfig`
- `DeviceStreamState`
- `OfficialDeviceSummary`
- `PaginatedResponse<T>`
- `ConnectionStatus = disabled | connecting | no-data | connected | error`

Observacao:

- quando o payload oficial ainda nao tem parser dedicado, a UI mostra fallback com `payload` bruto e status de conexao.

## 5) Como subir o ambiente

Arquivos locais de ambiente:

- `tools/ibirapitanga-official-proxy/.env.local`
- `src/ibirapitanga_copy/.env.local`

Comando unico:

```bash
./scripts/dev-ibirapitanga.sh
```

Acesso:

- `http://localhost:5174/dashboards`
- `http://localhost:5174/showroom`
- `http://localhost:5174/devices`

## 6) Validacoes feitas nesta linha de trabalho

- `GET /devices?page=1` na HML respondeu com o device `EnsaioProvaCarga`
- `GET /devices/{device_id}/api-keys` respondeu com sucesso para o device oficial do IPT
- o frontend local builda com as novas rotas e o consumo do proxy oficial
- o proxy oficial sobe localmente e responde `GET /api/health`

## 7) Referencias cruzadas

- Resumo pratico do fluxo oficial: `document/ibirapitanga_hml_fluxo_oficial.md`
- Integracao oficial HML: `document/ibirapitanga_hml_dispositivos_e_nrt.md`
- Guia rapido da app local: `src/ibirapitanga_copy/README.md`
- Runbook de implantacao em rede IPT: `document/plano_implantacao_ibirapitanga_ipt.md`
