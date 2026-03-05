# Ibirapitanga Copy (Localhost)

Frontend local para evolucao de UI/UX e validacao de integracao com stream em tempo real da plataforma Ibirapitanga.

## Rodando localmente

```bash
cd src/ibirapitanga_copy
npm install
npm run dev -- --host 0.0.0.0 --port 5174
```

App:
- `http://localhost:5174/dashboard`
- `http://localhost:5174/devices`

## Canal IPT (novo sensores)

Para conectar o card `IPT (multi-sensor)` ao stream real, defina o `deviceId` via variavel de ambiente:

```bash
VITE_IPT_DEVICE_ID=<uuid-do-device> npm run dev -- --host 0.0.0.0 --port 5174
```

## Rotas

- `/dashboard`: visualizacao de stream em tempo real.
- `/devices`: inventario de dispositivos e canal IPT reservado.

## Documentacao tecnica completa

- Documento mestre da branch: `document/branch_feature_ibirapitanga.md`
- Runbook de implantacao em rede IPT: `document/plano_implantacao_ibirapitanga_ipt.md`
