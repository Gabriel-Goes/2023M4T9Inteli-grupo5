# Serial -> MQTT -> WebSocket Bridge

Bridge local para testes do fluxo:

`/dev/ttyUSB0 -> MQTT -> ibirapitanga_copy`

## O que ele faz

1. Lê linhas CSV da serial (`raw,T_K,T_C,T_K_ema,T_C_ema`).
2. Converte para payload JSON genérico de sensor.
3. Publica no tópico MQTT configurado.
4. Assina o mesmo tópico e retransmite em WebSocket no formato esperado pelo frontend (`/nrt/{deviceId}`).

## Requisitos

- Node.js 18+
- Acesso ao dispositivo serial (`dialout`)
- Broker MQTT acessível

## Instalação

```bash
cd tools/serial-mqtt-ws-bridge
npm install
```

## Variáveis de ambiente

```bash
export SERIAL_PORT=/dev/ttyUSB0
export SERIAL_BAUD=115200

export MQTT_HOST=localhost
export MQTT_PORT=1883
export MQTT_USERNAME=
export MQTT_PASSWORD=
export MQTT_TOPIC=ipt/lab/uno/telemetry
export MQTT_QOS=0

export WS_PORT=8787
export WS_DEVICE_ID=ipt-local-uno

export RAW_MIN=0
export RAW_MAX=1023
export VALUE_MIN=0
export VALUE_MAX=20
export SENSOR_TYPE_ID=dt20b
export SENSOR_LABEL=analog_a0
export UNIT=mm
```

## Executar

```bash
npm start
```

Servidor WS local:

- `ws://localhost:8787/nrt/ipt-local-uno`

## Subir junto com o frontend

No `src/ibirapitanga_copy`:

```bash
VITE_OFFICIAL_WS_BASE_URL=wss://ws-showroom-ibiraprj.linux.ipt.br \
VITE_IPT_WS_BASE_URL=ws://localhost:8787 \
VITE_IPT_DEVICE_ID=ipt-local-uno \
npm run dev -- --host 0.0.0.0 --port 5174
```

## Modo hibrido recomendado

- Sensores legados continuam no WSS oficial.
- Sensor IPT novo usa o broker local + bridge local.
- Quando o acesso oficial MQTT for liberado, trocar apenas `MQTT_HOST`, `MQTT_USERNAME` e `MQTT_PASSWORD`.

## Payload gerado (exemplo)

```json
{
  "sensor_type_id": "dt20b",
  "sensor_label": "analog_a0",
  "value": 7.42,
  "unit": "mm",
  "timestamp": "2026-03-05T20:09:59Z",
  "temperature": 24.8,
  "raw_adc": 391
}
```
