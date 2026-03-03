# Testing Baseline

## Current state

- No unit/integration test suite in repository
- No CI workflow detected
- Validation is manual and hardware-driven

## Existing validation style

1. Compile sketch for target board
2. Upload to ESP32
3. Observe serial monitor + LCD output
4. Validate MQTT publish in Ubidots dashboard
5. Validate hardware inputs (button, sensors, LED)

## Suggested minimum regression gate for this repository

- Compile gate:
  - `arduino-cli compile --fqbn esp32:esp32:esp32 <sketch_dir>`
- Bench gate:
  - WiFi connect success
  - MQTT connect + publish
  - Primary sensor read updates every loop
  - Display toggles and tare/zero button behavior

## Gap to address in upcoming branch

- Create repeatable acceptance checklist for displacement (mm) mode:
  - zero point check
  - known displacement check at >=2 references
  - out-of-range behavior
