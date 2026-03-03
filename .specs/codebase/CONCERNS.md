# Codebase Concerns

Analyzed: 2026-03-03

## High Risk

1. `src/prototipo/s5/credentials.local.h` appears syntactically broken (password string not closed).
   - Impact: compile failure
   - Action: regenerate/fix local credentials file before build

2. `src/prototipo/s5/` contains `s5.ino` and `microSD.ino`, both defining `setup()` and `loop()`.
   - Impact: duplicate symbol compile errors when sketch folder is compiled as-is
   - Action: isolate experimental SD code (separate folder or utility file without `setup/loop`)

## Medium Risk

1. Primary measurement semantics still tied to weight vocabulary (`weight`, `kg`, `DigitalScale`).
   - Impact: semantic drift and telemetry inconsistency for displacement sensor
   - Action: rename labels, logs, LCD text, and requirement docs to mm displacement

2. Current threshold logic targets load cell overload, not displacement stroke.
   - Impact: wrong LED/alert behavior for transducer with 0-20 mm range
   - Action: redefine thresholds in mm (warning + max stroke)

3. Tare button on GPIO0 can be sensitive on ESP32 boot modes depending on wiring.
   - Impact: occasional boot instability
   - Action: validate hardware pull configuration and boot behavior

## Operational Concerns

1. Credentials/token handling is local; risk of accidental commit remains.
2. No automated regression checks; manual validation required each iteration.
