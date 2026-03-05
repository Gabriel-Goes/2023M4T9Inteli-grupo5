# Runbook de Implantacao - `feature/ibirapitanga` no IPT

Data: 2026-03-05  
Branch alvo: `feature/ibirapitanga`

Este arquivo e operacional (passo a passo de subida em rede IPT).  
Para arquitetura, contratos e inventario tecnico da branch, consulte:

- `document/branch_feature_ibirapitanga.md`

## Objetivo operacional

Subir a interface local (`src/ibirapitanga_copy`) em uma maquina do IPT e compartilhar links acessiveis na rede interna.

## Passo a passo

1. Atualizar repositiorio e branch:

```bash
cd /CAMINHO/DO/REPO
git fetch origin
git checkout feature/ibirapitanga
git pull --ff-only origin feature/ibirapitanga
```

2. Instalar dependencias:

```bash
cd src/ibirapitanga_copy
npm install
```

3. Subir servidor para acesso na rede:

```bash
npm run dev -- --host 0.0.0.0 --port 5174
```

4. Descobrir IP da maquina:

```bash
hostname -I
```

Alternativa:

```bash
ip -4 addr show scope global
```

5. Compartilhar links:

- Dashboard: `http://IP_DA_MAQUINA:5174/dashboard`
- Devices: `http://IP_DA_MAQUINA:5174/devices`

## Validacao rapida

1. Abrir links em outra maquina da rede IPT.
2. Confirmar atualizacao em tempo real dos cards.
3. Confirmar abertura sem erro de `/dashboard` e `/devices`.

## Diagnostico rapido

Verificar porta:

```bash
ss -ltnp '( sport = :5174 )'
```

Encerrar servico:

```bash
kill <PID>
```

## Resultado esperado

- Acesso remoto funcional por IP:porta na rede interna.
- Interface local operacional para demonstracao e validacao tecnica.
