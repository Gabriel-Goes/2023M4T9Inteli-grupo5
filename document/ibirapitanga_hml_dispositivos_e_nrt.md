# Ibirapitanga HML: Dispositivos e Leitura NRT

Data de registro: 2026-03-06

## 1) Objetivo

Registrar os pontos oficiais da documentacao da Ibirapitanga HML que impactam a integracao do prototipo IPT:

- gerenciamento de dispositivos;
- instrucoes de conexao do dispositivo;
- leitura NRT (Near Real-Time) por WebSocket.

Este documento consolida o contrato oficial e separa claramente o que foi inferido a partir de validacao pratica no laboratorio.

## 2) Fontes oficiais

- API de dispositivos:
  - `https://api-ibirahml.linux.ipt.br/docs/#tag/Devices`
- WebSocket NRT:
  - `https://ws-ibirahml.linux.ipt.br/docs/#section/Reading-NRT-(Near-Real-Time)-Device-Data`

## 3) Operacoes relevantes em `Devices`

Pela documentacao oficial da API, o conjunto `Devices` inclui, entre outras, as seguintes operacoes:

- listar dispositivos do usuario;
- criar um novo dispositivo;
- obter instrucoes de conexao do dispositivo;
- listar API keys do dispositivo;
- criar API key do dispositivo;
- remover API key do dispositivo;
- ler dados historicos do dispositivo;
- ler dados autenticando por device API key;
- inserir dados em lote.

Implicacao pratica:

- existe um fluxo formal para criar o dispositivo na plataforma;
- depois disso, a propria plataforma fornece as instrucoes de conexao especificas para aquele device;
- o gerenciamento de API keys faz parte do fluxo oficial de operacao.

## 4) Instrucoes de conexao do dispositivo

A operacao de instrucoes de conexao do dispositivo e a fonte oficial para obter os parametros necessarios para publicacao de telemetria.

Essas instrucoes incluem, no minimo:

- host MQTT;
- porta MQTT;
- topico de telemetria do dispositivo;
- `client id` MQTT;
- credenciais MQTT do dispositivo.

Observacao importante:

- esses valores sao especificos de cada dispositivo;
- eles nao devem ser documentados no repositório quando forem segredos ativos.

## 5) Leitura NRT por WebSocket

A documentacao oficial de WebSocket descreve a leitura de telemetria NRT no formato:

```text
wss://ws-ibirahml.linux.ipt.br/v1/devices/<device_id>/telemetry
```

Autenticacao:

- usar header `Authorization: Bearer <device_api_key>`.

Exemplo conceitual descrito na documentacao:

```bash
websocat -v -k \
  wss://ws-ibirahml.linux.ipt.br/v1/devices/<device_id>/telemetry \
  -H "Authorization: Bearer <device_api_key>"
```

Implicacao pratica:

- para ler NRT direto do servico oficial, nao basta o `device_id`;
- tambem e necessario possuir uma `device_api_key` valida.

## 6) Device API key

A documentacao de WebSocket informa que:

- quando um novo dispositivo e criado, uma device API key padrao e criada automaticamente;
- essa key inicial tem permissao de leitura e escrita;
- a validade padrao dessa key e longa (descrita na doc como 100 anos);
- podem ser criadas keys adicionais com validade customizada.

Implicacao pratica:

- para integrar o dashboard diretamente ao WebSocket oficial, precisamos de:
  - `device_id`
  - `device_api_key`
- isso e diferente das credenciais MQTT do dispositivo.

## 7) Relacao com a integracao local deste repositório

No estado atual da codebase:

- o frontend local `ibirapitanga_copy` continua servindo a interface em `5174`;
- o canal IPT usa um bridge local para compatibilizar o dashboard com o sensor em teste;
- esse bridge publica no MQTT e reexponhe o stream em WebSocket local para a UI.

Isso foi mantido porque:

- a UI existente ja estava preparada para consumir um stream local do tipo `/nrt/{deviceId}`;
- a integracao com o servico oficial de WebSocket ainda exige administrar a `device_api_key` do dispositivo.

## 8) Validacao pratica realizada neste projeto

Validacao empirica feita em 2026-03-06:

- a conexao MQTT oficial inicialmente falhou com `Not authorized`;
- o exemplo oficial de publicacao do dispositivo inclui `client id`;
- apos adicionar suporte a `MQTT_CLIENT_ID` no bridge e usar o `client id` fornecido nas instrucoes do device, a autenticacao passou a funcionar.

Isto e uma inferencia operacional baseada em teste local, nao uma afirmacao explicita da documentacao:

- para este device HML especifico, o `client id` MQTT deve ser tratado como parte necessaria da autenticacao.

Validacao adicional feita em 2026-03-10:

- `GET /devices?page=1` respondeu com o device oficial do IPT:
  - `0877945a-e3fe-46ea-bdf1-0105ac35d8e8`
  - nome: `EnsaioProvaCarga`
- `GET /devices/0877945a-e3fe-46ea-bdf1-0105ac35d8e8/api-keys` respondeu `200`
- a resposta confirmou a existencia de uma `device_api_key` valida para o stream NRT oficial

Implicacao pratica:

- o frontend local nao precisa mais depender de um mapa manual de `device_api_key`
- um proxy local pode resolver essa chave dinamicamente usando o `JWT` do usuario
- isso permite ligar a UI local diretamente ao backend oficial sem expor credenciais no browser

## 9) Decisoes de integracao recomendadas

Curto prazo:

- usar o backend oficial como fluxo principal para ingestao e leitura;
- publicar no MQTT oficial com as credenciais e `client id` do dispositivo;
- usar um proxy local para consumir a API oficial e o stream NRT sem expor `JWT` ou `device_api_key` no navegador.

Medio prazo:

- registrar o fluxo oficial completo de criacao de device via API;
- documentar como rotacionar `JWT`, credenciais MQTT e `device_api_key`;
- avaliar quando a UI oficial da plataforma ja sera suficiente para aposentar a copia local.

## 10) Pendencias abertas

- documentar o payload exato esperado pela plataforma oficial para telemetria historica e em lote;
- evoluir os parsers da UI local para mais devices oficiais alem do fallback raw;
- registrar um procedimento seguro para armazenamento de segredos do device fora do git.
