# Tech Stack

Analyzed: 2026-03-03

## Core

- Platform: Arduino sketch-based firmware
- Language: C++ (Arduino dialect)
- Runtime/Board target: ESP32 (Arduino core `esp32:esp32`)
- Build tools observed: Arduino IDE 2.x (README), `arduino-cli` (used locally)

## Firmware Libraries

- Sensor ADC/load cell interface: `HX711`
- Display: `LiquidCrystal_I2C`
- Telemetry: `UbidotsEsp32Mqtt`
- Environmental sensing: `Adafruit_BME280`, `Adafruit_Sensor`
- Connectivity: `WiFi`
- Optional storage/time: `SD`, `NTPClient`, `WiFiUdp`

## Testing

- No automated test framework detected in repository
- Current validation model is compile + bench hardware checks

## External Services

- Cloud IoT/MQTT: Ubidots
- NTP pool (in `microSD.ino`): `pool.ntp.org`

## Development Tools

- Version control: Git
- Documentation: `README.md`, project docs under `document/`
