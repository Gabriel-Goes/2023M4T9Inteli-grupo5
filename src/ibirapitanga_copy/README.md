# Ibirapitanga Copy (Localhost)

Frontend local para evolucao de UI/UX e validacao de integracao com o stream em tempo real da plataforma Ibirapitanga.

## Stack
- Vite
- React
- TypeScript
- WebSocket nativo

## Rodando localmente
```bash
cd src/ibirapitanga_copy
npm install
npm run dev
```

App em `http://localhost:5174`.

## Rotas
- `/dashboard`: visao de tempo real.
- `/devices`: inventario de dispositivos e contrato-base do novo canal IPT.

## Fonte de dados
- Base WebSocket: `wss://ws-showroom-ibiraprj.linux.ipt.br`
- Endpoint por dispositivo: `/nrt/{deviceId}`
