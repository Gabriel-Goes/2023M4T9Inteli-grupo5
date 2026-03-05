# Documentacao Tecnica da Branch `feature/ibirapitanga`

Data de referencia: 2026-03-05  
Base de comparacao: `origin/main...feature/ibirapitanga`

## 1) Objetivo

Consolidar o que foi entregue nesta branch para disponibilizar uma copia local da interface Ibirapitanga no ambiente IPT, com visualizacao em tempo real via WebSocket e uma rota preparada para o canal do dispositivo IPT multi-sensor.

## 2) Escopo desta branch

Inclui:
- Novo frontend local em `src/ibirapitanga_copy` (Vite + React + TypeScript).
- Plano de implantacao em rede interna do IPT.
- Ajustes de documentacao relacionados a operacao local.

Nao inclui:
- Mudancas de firmware ESP32 nesta branch.
- Alteracoes de backend/infra da plataforma oficial.

## 3) Delta resumido em relacao ao `main`

Resumo:
- 23 arquivos alterados/adicionados.
- 3045 linhas adicionadas.

Commits principais:
- `feat(ibirapitanga): add local dashboard copy with live websocket streams`
- `docs(ibirapitanga): add IPT machine rollout plan for local network access`

## 4) Inventario tecnico das alteracoes

### 4.1 Frontend local (`src/ibirapitanga_copy`)

Arquivos de base:
- `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`

Aplicacao:
- `src/main.tsx`: bootstrap React Router.
- `src/App.tsx`: roteamento principal.
- `src/pages/DashboardPage.tsx`: visao de stream em tempo real.
- `src/pages/DevicesPage.tsx`: inventario/estado dos dispositivos.
- `src/components/*`: cards, navbar, badges e sparkline.
- `src/styles.css`: estilos visuais.

Integracao e contratos:
- `src/config/devices.ts`: catalogo de dispositivos, endpoint WebSocket e parser por dispositivo.
- `src/hooks/useDeviceStream.ts`: conexao WebSocket, parse, estado e reconexao com backoff.
- `src/types.ts`: tipos de mensagem, metrica, estado e payload.

### 4.2 Documentacao operacional

- `document/plano_implantacao_ibirapitanga_ipt.md`: runbook de subida e acesso em rede.
- `src/ibirapitanga_copy/README.md`: guia rapido local.
- `README.md` (raiz): ponte para documentacao tecnica atual.

## 5) Arquitetura funcional (visao objetiva)

Fluxo:
1. Usuario abre `/dashboard` ou `/devices`.
2. A pagina seleciona os dispositivos configurados.
3. Cada dispositivo com `deviceId` abre WebSocket em `wss://ws-showroom-ibiraprj.linux.ipt.br/nrt/{deviceId}`.
4. As mensagens recebidas sao parseadas por funcao especifica do dispositivo.
5. O estado da UI (status, metricas, historico) e atualizado em tempo real.

Comportamento de reconexao:
- Backoff exponencial com jitter.
- Limites configurados:
- minimo: 1000 ms
- maximo: 30000 ms

## 6) Interfaces publicas documentadas

### 6.1 Rotas HTTP da app local

- `/dashboard`
- `/devices`
- `/` redireciona para `/dashboard`

### 6.2 Contrato de stream

- Base: `wss://ws-showroom-ibiraprj.linux.ipt.br`
- Endpoint por dispositivo: `/nrt/{deviceId}`
- Formato base recebido:
- `device_id?: string`
- `created_at?: string`
- `payload?: Record<string, unknown>`

### 6.3 Tipos relevantes (`src/types.ts`)

- `DeviceSlug`: `barulhometro | aup | proantar | callithrix | ipt`
- `ConnectionStatus`: `disabled | connecting | no-data | connected | error`
- `DeviceStreamState`: estado consolidado da conexao e metricas.
- `IPTPayload`:
- `sensor_type_id: string`
- `sensor_label?: string`
- `value: number`
- `unit: string`
- `timestamp: string`

Observacao:
- O canal `ipt` esta preparado na UI, mas `parseIpt()` ainda retorna `null` (parser especifico pendente).

## 7) Como executar localmente

```bash
cd src/ibirapitanga_copy
npm install
npm run dev -- --host 0.0.0.0 --port 5174
```

Acesso:
- `http://localhost:5174/dashboard`
- `http://localhost:5174/devices`

Para acesso em rede, usar o IP da maquina:
- `http://IP_DA_MAQUINA:5174/dashboard`
- `http://IP_DA_MAQUINA:5174/devices`

## 8) Validacao tecnica recomendada

Checklist minimo:
1. Rotas `/dashboard` e `/devices` respondem sem erro.
2. Cards de dispositivos com `deviceId` mudam de estado (`connecting`, `no-data`, `connected`) conforme stream.
3. Historico (sparkline) recebe pontos quando ha `primary` valido.
4. Reconexao ocorre automaticamente apos queda de socket.
5. Dispositivo `ipt` aparece na tela de devices como canal reservado/preparado.

## 9) Operacao e seguranca

Durante demonstracoes em rede interna:
- Executar com host/porta explicitos.
- Encerrar o processo quando nao estiver em uso.
- Evitar exposicao permanente da porta no host.

Comandos uteis:
```bash
ss -ltnp '( sport = :5174 )'
kill <PID>
```

## 10) Limitacoes conhecidas e proximos passos

Limitacoes atuais:
- Parser IPT nao implementado (`parseIpt` retorna `null`).
- Dependencia de conectividade com o endpoint WebSocket externo.

Proximos passos sugeridos:
1. Implementar parser do payload IPT real (ESP32 multi-sensor).
2. Definir validacoes de schema por sensor.
3. Criar modo de fallback visual quando stream estiver indisponivel.
4. Definir porta/config por variavel de ambiente para operacao controlada.

## 11) Referencias cruzadas

- Runbook de implantacao: `document/plano_implantacao_ibirapitanga_ipt.md`
- Guia rapido local: `src/ibirapitanga_copy/README.md`
- Contexto historico ESP32: `document/alteracoes_esp32_2026-02-26.md`
