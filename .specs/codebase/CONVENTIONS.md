# Code Conventions

## Naming Conventions

### Files

- Prototype-version folders and filenames: `s1/s1.ino`, `s5/s5.ino`
- Auxiliary experiments in same folder: `microSD.ino`

### Constants

- UPPER_SNAKE_CASE for publish labels and tokens
- Examples: `DEVICE_LABEL`, `WEIGHT_LABEL`, `PUBLISH_FREQUENCY`

### Variables and methods

- Mixed camelCase and snake_case in same file
- Examples: `displayOn`, `scale_tare`, `measureWeight()`, `checkMaxWeight()`

## File Organization

Common order in firmware files:

1. library includes
2. constants/pins
3. globals (device clients, sensors, display)
4. helper classes/functions
5. `setup()`
6. `loop()`

## Error Handling

- Defensive checks with serial/LCD messages
- Examples:
  - BME280 not found -> serial + LCD warning
  - MQTT disconnected -> reconnect attempts + user message

## Comments and Documentation

- Comments are in Portuguese and explain intent inline
- Style is practical and hardware-oriented

## Observed Risks in Conventions

- Secrets may appear in local headers if not carefully excluded
- Non-standard combinations (multiple `.ino` with `setup/loop`) can break compile
