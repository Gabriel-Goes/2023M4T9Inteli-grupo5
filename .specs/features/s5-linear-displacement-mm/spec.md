# S5 Linear Displacement (DT-20B) Specification

## Problem Statement

The current S5 firmware models the primary bridge signal as load weight (kg). Hardware changed to a linear displacement transducer (PEACOCK/KYOWA DT-20B, CAP 0-20 mm), still wired through E+/E-/A+/A-. The firmware must be adapted so measurement, alerts, display, and cloud telemetry represent displacement in mm.

## Status Snapshot (2026-03-03)

- Branch: `feature/s5-linear-displacement-mm`
- Base branch: `main` at `b5ddc34`
- Head da branch: `6013745`
- Commits principais da migracao:
  - `1e27e62` - isolamento do `microSD.ino`
  - `6222b5e` - migracao de peso (kg) para deslocamento (mm)
  - `6013745` - guia de calibracao e validacao de bancada
- Working tree atual:
  - `src/prototipo/s5/s5.ino` com ajustes locais nao commitados (calibracao 20 mm por pressionar 3s e gravar ao soltar + tick de monitor em ~1s)
  - Documentacao unificada em `src/prototipo/s5/README_DT20B.md` (arquivo de explicacao separado removido)

## Goals

- [x] Publish and display primary measurement as displacement in millimeters (`mm`), not weight (`kg`).
- [x] Keep WiFi, MQTT, temperature, and humidity telemetry operational in the new branch.
- [x] Support field zeroing and calibration workflow suitable for 0-20 mm transducer.
- [x] Create a dedicated branch path for the new hardware line without breaking prior weight-based history.

## Out of Scope

Explicitly excluded to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Full cloud dashboard redesign | Firmware scope only; dashboard can be updated in parallel later |
| PCB rewiring or hardware redesign | Sensor wiring already fixed to current 4-wire bridge path |
| New storage subsystem (SD logging) | Existing requirement focuses on live measurement/telemetry |

---

## User Stories

### P1: Primary displacement readout and publish ⭐ MVP

User Story: As a field engineer, I want the system to read and publish displacement in mm so I can monitor structural movement with the new transducer.

Why P1: This is the core functional change required by hardware migration.

Acceptance Criteria:

1. WHEN firmware loop acquires the HX711 reading THEN system SHALL compute displacement in mm using configured calibration parameters.
2. WHEN displacement is available THEN system SHALL show displacement on LCD and serial output using `mm` unit.
3. WHEN publish interval elapses and MQTT is connected THEN system SHALL publish displacement to Ubidots under a displacement-specific variable label.

Independent Test: Move transducer to at least two known positions (e.g., ~0 mm and ~10+ mm), confirm LCD/serial and Ubidots reflect coherent mm values.

---

### P1: Zero reference and calibration readiness ⭐ MVP

User Story: As an operator, I want to set zero reference quickly so measurements start from the current mechanical baseline.

Why P1: Field setup depends on zeroing before data collection.

Acceptance Criteria:

1. WHEN tare/zero button is short-pressed THEN system SHALL set current bridge reading as displacement zero reference.
2. WHEN zeroing succeeds THEN system SHALL confirm action in serial and LCD.
3. WHEN displacement is computed after zeroing THEN system SHALL report approximately 0 mm at unchanged position.
4. WHEN zero button stays pressed for 3s and is released THEN system SHALL capture the 20 mm span reference (`raw_at_20mm`) at release time.

Independent Test: Press button at stable position, verify output returns near 0 mm and changes correctly after movement.

---

### P1: Connectivity continuity ⭐ MVP

User Story: As a maintainer, I want existing network and telemetry pathways preserved so migration to mm does not break remote monitoring.

Why P1: Migration cannot regress connectivity already used by operations.

Acceptance Criteria:

1. WHEN boot starts THEN system SHALL connect to configured WiFi credentials from local credentials file.
2. WHEN MQTT connection drops THEN system SHALL retry and recover publish flow automatically.
3. WHEN temperature/humidity sensors are available THEN system SHALL continue publishing those values.

Independent Test: Force temporary WiFi/MQTT drop and verify reconnection and resumed publishes.

---

### P2: Displacement thresholds for LED alerts

User Story: As an operator, I want LEDs to indicate displacement ranges so I can detect warning/limit conditions quickly.

Why P2: Important operational feedback, but can ship right after core readout.

Acceptance Criteria:

1. WHEN displacement is in normal range THEN system SHALL show normal LED state.
2. WHEN displacement reaches warning threshold THEN system SHALL show warning LED state.
3. WHEN displacement exceeds max stroke (or configured max) THEN system SHALL show critical LED state and warning message.

Independent Test: Simulate values crossing configured thresholds and verify LED transitions.

---

### P3: Legacy terminology cleanup

User Story: As a developer, I want variable names and comments aligned to displacement domain to reduce maintenance errors.

Why P3: Improves clarity and maintainability, but not blocking core runtime behavior.

Acceptance Criteria:

1. WHEN reading source code THEN terms `weight`, `kg`, and load-cell-only naming SHALL be replaced with displacement/mm equivalents in new branch scope.

---

## Edge Cases

- WHEN raw HX711 reading saturates or sensor disconnects THEN system SHALL report bounded/fault indication and avoid publishing nonsensical spikes.
- WHEN computed displacement is below configured minimum THEN system SHALL clamp or flag according to policy (default: clamp to 0 mm).
- WHEN computed displacement exceeds expected physical range (default: 20 mm) THEN system SHALL flag overrange and publish bounded value with warning log.
- WHEN credentials file is syntactically invalid THEN build SHALL fail early with clear error.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| S5MM-01 | P1: Primary displacement readout and publish | Execute | Done |
| S5MM-02 | P1: Primary displacement readout and publish | Execute | Done |
| S5MM-03 | P1: Primary displacement readout and publish | Execute | Done |
| S5MM-04 | P1: Zero reference and calibration readiness | Execute | Done |
| S5MM-05 | P1: Zero reference and calibration readiness | Validate | Partial (repetibilidade em campo ainda pendente) |
| S5MM-06 | P1: Connectivity continuity | Execute | Done |
| S5MM-07 | P1: Connectivity continuity | Execute | Done |
| S5MM-08 | P2: Displacement thresholds for LED alerts | Execute | Done |
| S5MM-09 | P2: Displacement thresholds for LED alerts | Validate | Partial (necessita rodada final de validacao de limiares) |
| S5MM-10 | P3: Legacy terminology cleanup | Validate | Partial (restos de naming em codigo experimental e label de device legado) |

Coverage target: 10 total requirements, 10 must map to tasks.

---

## Success Criteria

- [x] Firmware compiles for `esp32:esp32:esp32` without manual code edits after dependency setup.
- [x] Primary telemetry in Ubidots uses displacement variable (mm semantics) and no longer reports kg for main signal.
- [ ] Zeroing workflow is validated on bench and repeatable (falta rodada de repetibilidade documentada).
- [x] Branch plan documents calibration method and validation checklist for 0-20 mm transducer.

## Assumptions and Defaults

- Sensor full scale used as default engineering range: 0-20 mm.
- Default publish variable label: `displacement_mm`.
- Existing temp/humidity publish remains enabled.
- WiFi SSID target is `IPT-WiFi-Novo`; password remains local in `credentials.local.h` and is not committed.
- Calibration operation default:
  - short press on `ZERO_BUTTON` captures `raw_zero`
  - holding `ZERO_BUTTON` for 3s enters span mode and capture of `raw_at_20mm` occurs when button is released
