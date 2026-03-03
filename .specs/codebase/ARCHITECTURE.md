# Architecture

Pattern: monolithic sketch per prototype version (`s1`..`s5`), with incremental evolution.

## High-Level Structure

- Each prototype folder contains one or more `.ino` files.
- `s5.ino` is the main firmware for the latest prototype.
- Runtime responsibilities are mostly centralized inside one file:
  - hardware setup and pins
  - sensor read and calibration/tare
  - LCD rendering
  - MQTT publish/reconnect
  - local alerts via RGB LED

## Identified Patterns

### Pattern: Hardware wrapper class around HX711

- Location: `src/prototipo/s5/s5.ino`
- Purpose: encapsulate sensor behavior (`tara`, measure, threshold check)
- Implementation: `DigitalScale` class holds pins, scale factor, limits
- Example: `DigitalScale myScale(...)`

### Pattern: Time-based telemetry publish loop

- Location: `src/prototipo/s3/s3.ino`, `src/prototipo/s4/s4.ino`, `src/prototipo/s5/s5.ino`
- Purpose: avoid publishing every cycle; publish at fixed frequency
- Implementation: `if (labs(millis() - timer) > PUBLISH_FREQUENCY) { ... }`

### Pattern: Resilient MQTT reconnect

- Location: `src/prototipo/s5/s5.ino`
- Purpose: keep cloud communication alive
- Implementation: `if (!ubidots.connected()) { ... ubidots.connect(); }`

## Data Flow

### Sensor to Cloud

1. HX711 reads bridge signal through DT/SCK pins
2. Firmware converts to engineering unit (currently kg)
3. Value shown on LCD and serial
4. MQTT payload published to Ubidots with device and variable labels

### Environment telemetry

1. BME280 read by I2C
2. Temperature/humidity shown in LCD and serial
3. Published with same cycle to Ubidots

## Code Organization

Approach: versioned prototype folders, each mostly self-contained.

Module boundaries are weak (single-file architecture). Reuse is conceptual (copy/evolve) instead of shared modules.
