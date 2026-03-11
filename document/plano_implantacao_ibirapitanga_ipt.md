# Runbook de Implantacao - `feature/ibirapitanga` no IPT

Data: 2026-03-05  
Branch alvo: `feature/ibirapitanga`

Este arquivo e operacional (passo a passo de subida em rede IPT).  
Para arquitetura, contratos e inventario tecnico da branch, consulte:

- `document/branch_feature_ibirapitanga.md`

## Objetivo operacional

Subir a interface local (`src/ibirapitanga_copy`) junto do proxy oficial (`tools/ibirapitanga-official-proxy`) em uma maquina do IPT e compartilhar links acessiveis na rede interna.

## Passo a passo

1. Atualizar repositorio e branch:

```bash
cd /CAMINHO/DO/REPO
git fetch origin
git checkout feature/ibirapitanga
git pull --ff-only origin feature/ibirapitanga
```

2. Configurar arquivos de ambiente locais:

```bash
cp tools/ibirapitanga-official-proxy/.env.example tools/ibirapitanga-official-proxy/.env.local
cp src/ibirapitanga_copy/.env.example src/ibirapitanga_copy/.env.local
```

3. Preencher `tools/ibirapitanga-official-proxy/.env.local` com o JWT do usuario da HML.

4. Subir frontend e proxy oficial:

```bash
./scripts/dev-ibirapitanga.sh
```

5. Descobrir IP da maquina:

```bash
hostname -I
```

Alternativa:

```bash
ip -4 addr show scope global
```

6. Compartilhar links:

- Dashboards: `http://IP_DA_MAQUINA:5174/dashboards`
- Showroom: `http://IP_DA_MAQUINA:5174/showroom`
- Devices: `http://IP_DA_MAQUINA:5174/devices`

## Validacao rapida

1. Abrir links em outra maquina da rede IPT.
2. Confirmar listagem do device oficial em `/dashboards`.
3. Confirmar abertura sem erro de `/dashboards`, `/showroom` e `/devices`.
4. Confirmar que o card do device entra em espera controlada quando nao houver telemetria.

## Diagnostico rapido

Verificar portas:

```bash
ss -ltnp '( sport = :5174 or sport = :8788 )'
```

Health check do proxy:

```bash
curl http://127.0.0.1:8788/api/health
```

Encerrar servicos:

```bash
pkill -f 'vite --host 0.0.0.0 --port 5174'
pkill -f 'tools/ibirapitanga-official-proxy/src/index.js'
```

## Resultado esperado

- Acesso remoto funcional por IP:porta na rede interna.
- Interface local operacional para demonstracao e validacao tecnica.
- Proxy oficial local protegendo JWT e `device_api_key` do navegador.
