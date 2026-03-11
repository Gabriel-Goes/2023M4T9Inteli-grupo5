# Ibirapitanga Copy (Localhost)

Frontend local para evolucao de UI/UX sobre o backend oficial da plataforma Ibirapitanga.

## Fluxo principal

- `ESP32 -> MQTT oficial -> backend Ibirapitanga`
- `ibirapitanga_copy -> proxy oficial local -> API/WS oficial`

O bridge serial/MQTT antigo continua apenas como fallback de contingencia.

## Subida rapida

1. Configure `tools/ibirapitanga-official-proxy/.env.local`
2. Configure `src/ibirapitanga_copy/.env.local`
3. Rode:

```bash
./scripts/dev-ibirapitanga.sh
```

App:

- `http://localhost:5174/dashboards`
- `http://localhost:5174/showroom`
- `http://localhost:5174/devices`

## Arquivos de ambiente

Frontend:

```bash
cp src/ibirapitanga_copy/.env.example src/ibirapitanga_copy/.env.local
```

Proxy:

```bash
cp tools/ibirapitanga-official-proxy/.env.example tools/ibirapitanga-official-proxy/.env.local
```

## Rotas

- `/dashboards`: nova pagina ligada ao backend oficial.
- `/showroom`: vitrine local com cards legados e referencia visual.
- `/devices`: inventario tecnico e contratos de parser.

## Documentacao tecnica

- Resumo pratico do fluxo oficial: `document/ibirapitanga_hml_fluxo_oficial.md`
- Documento mestre da branch: `document/branch_feature_ibirapitanga.md`
- Integracao oficial HML: `document/ibirapitanga_hml_dispositivos_e_nrt.md`
- Runbook de implantacao em rede IPT: `document/plano_implantacao_ibirapitanga_ipt.md`
