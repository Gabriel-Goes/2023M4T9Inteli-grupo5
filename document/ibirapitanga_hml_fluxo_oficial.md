# Ibirapitanga HML: Resumo Pratico do Fluxo Oficial

Data de referencia: 2026-03-10

## 1) O que foi validado

- O device oficial do IPT existe na HML:
  - `0877945a-e3fe-46ea-bdf1-0105ac35d8e8`
  - nome: `EnsaioProvaCarga`
- O backend oficial aceita telemetria desse device via MQTT.
- O catalogo de devices pode ser lido pela API oficial com `Bearer JWT` de usuario.
- A `device_api_key` do device pode ser listada pela API oficial em:
  - `GET /devices/{device_id}/api-keys`

## 2) O que significa cada credencial

- `device_id`:
  - e o identificador do dispositivo na plataforma.
  - sozinho, ele nao autentica nada.

- credenciais MQTT do device:
  - servem para o sensor publicar telemetria no broker oficial.
  - sao as usadas no `mosquitto_pub`.

- `JWT` do usuario:
  - representa a sua sessao/autorizacao na API oficial.
  - serve para listar devices, dashboards e API keys.

- `device_api_key`:
  - e a chave do proprio device para leitura/escrita autorizada por device.
  - no nosso caso, ela e usada para abrir o stream NRT oficial do device.

## 3) O que esta acontecendo agora

Antes, a branch dependia de um bridge local para transformar serial/MQTT em WebSocket local.

Agora, o fluxo principal passou a ser:

1. `ESP32` publica no MQTT oficial da Ibirapitanga.
2. O backend oficial armazena e disponibiliza o device.
3. A nossa UI local consulta a API oficial para descobrir os devices.
4. Um proxy local abre o stream oficial do device usando `device_api_key`.
5. A pagina local mostra os cards e graficos sem expor segredos no navegador.

## 4) Por que ainda existe uma UI local

- A plataforma oficial ja recebe devices e dados.
- O que ainda falta nela, para o nosso uso, e uma interface de dashboards adequada para o laboratorio.
- Por isso mantemos a `ibirapitanga_copy` como camada de visualizacao.

Em resumo:

- backend oficial: entrada e leitura dos dados;
- UI local: visualizacao e UX;
- proxy local: protecao de credenciais e compatibilidade com o frontend.

## 5) O que fica como fallback

O bridge serial/MQTT antigo continua no repositorio apenas como contingencia.

Ele nao e mais o fluxo principal.

## 6) Proximo passo da branch

- Implementar `/dashboards` ligado ao backend oficial.
- Manter `/showroom` como referencia visual e historica.
- Subir frontend + proxy oficial com um comando unico para retomada rapida do ambiente.
