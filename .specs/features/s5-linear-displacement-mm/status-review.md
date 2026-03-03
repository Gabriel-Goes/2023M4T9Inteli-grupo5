# S5 Linear Displacement - Status Review (2026-03-03)

## 1) Scope and Objective

This branch migrated S5 firmware from load/weight semantics (`kg`) to linear displacement (`mm`) for the DT-20B transducer, preserving WiFi/MQTT/BME280 flows and field operation on ESP32.

## 2) Baseline

- Active branch: `feature/s5-linear-displacement-mm`
- Baseline branch: `main` (`b5ddc34`)
- Current branch head: `6013745`
- Delta (`main...feature/s5-linear-displacement-mm`):
  - `src/prototipo/s5/s5.ino`
  - `src/prototipo/s5/README_DT20B.md`
  - `src/prototipo/s5/experimentos/microSD.ino` (moved from root of `s5/`)

## 3) Commit Timeline and Delivered Changes

1. `1e27e62` - isolate experimental SD sketch
- Moved `microSD.ino` to `src/prototipo/s5/experimentos/` to avoid duplicate `setup()/loop()` during compile.

2. `6222b5e` - migrate primary signal from kg to mm
- Added linear displacement model (`LinearDisplacementSensor`).
- Introduced displacement telemetry label `displacement_mm`.
- Updated LCD/serial outputs and LED thresholds to displacement range.
- Kept WiFi, MQTT reconnect, temperature and humidity telemetry.

3. `6013745` - calibration and bench guide
- Added `src/prototipo/s5/README_DT20B.md` with calibration formula and bench validation checklist.

## 4) Current Working Tree (Not Committed Yet)

1. `src/prototipo/s5/s5.ino` (modified)
- Added long-press calibration path for span:
  - press `ZERO_BUTTON` for 3s -> span mode
  - release button -> capture `raw_at_20mm`
- Added short-press behavior:
  - quick press -> capture `raw_zero`
- Added operator hint in serial at startup.
- Reduced effective monitor cycle to ~1s by removing one extra delay in loop.

2. Documentation update
- `src/prototipo/s5/README_DT20B.md` now consolidates technical migration explanation and calibration guide in a single file.

## 5) Functional Behavior Snapshot

### Measurement and conversion

- Raw signal still read by HX711 on the same E+/E-/A+/A- wiring.
- Conversion is two-point linear:
  - `mm = (raw - raw_zero) * 20.0 / (raw_at_20mm - raw_zero)`
- Output is clamped to 0-20 mm in runtime display/publish path.

### Calibration flow in field

- Short press on zero button: set 0 mm reference (`raw_zero`).
- Hold for 3 seconds: arm 20 mm span calibration.
- Release after positioning transducer at known 20 mm point: capture `raw_at_20mm`.

### Telemetry and UI

- Ubidots primary variable: `displacement_mm`.
- Additional variables maintained: `temperature`, `humidity`.
- Serial speed: `57600`.
- LCD, serial text, and LED warnings reflect displacement semantics.

## 6) Validation Evidence (Current)

- Compile for ESP32 target succeeded in prior runs.
- Bench observation recorded:
  - zero reference capture confirmed,
  - span reference capture confirmed,
  - end-stroke reading reached ~`20.000 mm` in monitored session.
- Remaining validation still recommended after latest local changes:
  - Ubidots field re-check (`displacement_mm`),
  - final LED threshold transition pass (normal/warn/critical).

## 7) Open Risks / Gaps

1. Calibration persistence
- `raw_zero` and `raw_at_20mm` are volatile (reset on reboot); values are not saved in non-volatile storage.

2. Validation repeatability
- Need structured repetition to confirm consistency for small displacements (<1 mm) and threshold crossings.

3. Naming leftovers outside main firmware
- Experimental files can still contain legacy wording unrelated to main sketch behavior.

## 8) Recommended Next Actions (Priority)

1. Commit pending `s5.ino` calibration interaction updates after one final bench pass.
2. Keep documentation consolidated in `README_DT20B.md` to reduce handoff complexity.
3. Run and record final validation matrix:
  - zeroing repeatability,
  - span capture repeatability,
  - Ubidots payload field check,
  - LED threshold checks.
4. Optional hardening: persist calibration (`raw_zero`, `raw_at_20mm`) in non-volatile storage.
