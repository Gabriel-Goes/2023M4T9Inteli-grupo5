# Plano de Implantacao - Ibirapitanga Copy no Computador do IPT

Data: 2026-03-05  
Branch alvo: `feature/ibirapitanga`

## Objetivo

Subir a copia local da interface (`ibirapitanga_copy`) no computador do IPT e disponibilizar um link direto para o Rodrigo acessar via navegador.

## Contexto rapido

- O frontend local ja esta pronto em `src/ibirapitanga_copy`.
- O app consome dados em tempo real do mesmo WebSocket do showroom oficial.
- A entrega desta etapa e habilitar acesso por `IP:PORTA` dentro da rede do IPT.

## Passo a passo no computador do IPT

1. Atualizar repositiorio e branch

```bash
cd /CAMINHO/DO/REPO
git fetch origin
git checkout feature/ibirapitanga
git pull --ff-only origin feature/ibirapitanga
```

2. Instalar dependencias do frontend

```bash
cd src/ibirapitanga_copy
npm install
```

3. Subir servidor para acesso pela rede

```bash
npm run dev -- --host 0.0.0.0 --port 5174
```

4. Descobrir IP da maquina do IPT

```bash
hostname -I
```

Se `hostname` nao estiver disponivel:

```bash
ip -4 addr show scope global
```

5. Montar e enviar o link para acesso

- Dashboard: `http://IP_DA_MAQUINA:5174/dashboard`
- Devices: `http://IP_DA_MAQUINA:5174/devices`

Exemplo:

- `http://10.2.54.110:5174/dashboard`
- `http://10.2.54.110:5174/devices`

## Validacao rapida

1. Abrir o link em outra maquina da rede IPT.
2. Confirmar que os cards mudam em tempo real (status de conexao + metricas).
3. Confirmar que as paginas `/dashboard` e `/devices` abrem sem erro.

## Se o link nao abrir

1. Verificar se o processo Vite esta ativo no terminal.
2. Verificar se a porta esta escutando:

```bash
ss -tuln | grep 5174
```

3. Se houver firewall local (ufw):

```bash
sudo ufw allow 5174/tcp
```

## Resultado esperado da iteracao

- Rodrigo acessa um link unico da rede IPT.
- Interface local demonstrando dados em tempo real.
- Base pronta para proxima etapa: tela dedicada do dispositivo IPT multi-sensor.
