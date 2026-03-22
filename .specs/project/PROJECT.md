# Eagle (Iron) - Structural Monitoring Prototype

**Vision:** Deliver a low-cost ESP32-based signal conditioning prototype for structural monitoring that provides local and remote visibility of bridge/viaduct load behavior.  
**For:** IPT (Instituto de Pesquisas Tecnologicas), especially the civil works section and field operators.  
**Solves:** High cost and operational friction of existing monitoring equipment by combining load-cell reading, local alerts, and cloud telemetry in a simpler platform.

## Goals

- Provide end-to-end acquisition and telemetry of `weight`, `temperature`, and `humidity` with publish cadence near 2 seconds (`PUBLISH_FREQUENCY = 2000` in firmware).
- Enable local operation without cloud dashboard dependence through LCD output, LED/RGB alerts, and physical tare/display controls.
- Maintain a practical low-cost architecture centered on ESP32 + common sensors/actuators documented in the project.

## Tech Stack

**Core:**

- Framework/runtime: Arduino core for ESP32 (firmware sketches)
- Language: Arduino C++
- Database: None in repository

**Key dependencies:**

- `HX711` (load-cell ADC interface)
- `LiquidCrystal_I2C` (LCD output)
- `UbidotsEsp32Mqtt` (cloud telemetry)
- `Adafruit_BME280` + `Adafruit_Sensor` (environmental measurements)
- `WiFi`, `NTPClient`, `SD` (connectivity/time/local persistence prototype)

## Scope

**v1 includes:**

- Firmware for weight reading and calibration/tare operations (`s1` to `s5` evolution).
- Local user feedback via serial logs, LCD messages, and LED/RGB threshold signaling.
- Cloud publishing to Ubidots using device labels and token-based auth in firmware.
- Documentation of methodology, usage, and manual validation in `README.md` and `document/documentacao.md`.

**Explicitly out of scope:**

- Production-ready secret management (credentials are currently hardcoded).
- Automated CI/unit/integration testing pipeline.
- Separate backend/frontend application codebase in this repository.

## Constraints

- Timeline: Original delivery milestone reached in December 2023 (`0.5.0 - 21/12/2023` in README history).
- Technical: Hardware-dependent behavior (ESP32, HX711, BME280, LCD, buttons, LED/RGB) and external Wi-Fi/Ubidots availability.
- Resources: Validation depends on physical prototype availability; repository currently stores firmware and documentation only.
