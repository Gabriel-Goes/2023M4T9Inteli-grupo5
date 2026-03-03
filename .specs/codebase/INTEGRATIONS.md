# Integrations

## Ubidots (MQTT)

- Library: `UbidotsEsp32Mqtt`
- Usage pattern:
  - connect WiFi
  - setup + callback
  - connect MQTT
  - periodic `add(...)` + `publish(...)`
- Current labels in S5:
  - device: `balancairon`
  - primary variable: `weight`
  - secondary variables: `temperature`, `humidity`

## WiFi

- Credentials consumed from `credentials.local.h`
- SSID and password are expected to be local-only

## HX711 bridge input

- Connected through two GPIO pins (`DT`, `SCK`)
- Bridge wiring currently aligned with E+/E-/A+/A- physical sensor path

## BME280

- I2C sensor for temperature/humidity
- Address expected: `0x76`

## LCD I2C

- Address expected: `0x27`
- Used for user-facing readout and status messages

## Optional SD+NTP path

- Exists in `microSD.ino` as separate experiment
- Not integrated into main telemetry loop in `s5.ino`
