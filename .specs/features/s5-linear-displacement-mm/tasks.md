# S5 Linear Displacement (DT-20B) Tasks

Design: inline in this task plan (medium-size firmware change)
Status: In Progress (2026-03-03)

---

## Execution Plan

### Phase 1: Branch and baseline hygiene (Sequential)

T1 -> T2 -> T3 (Completed)

### Phase 2: Core displacement migration (Partially Parallel)

T3 complete, then T4/T5/T6 can proceed with coordination. (Completed, with ajustes locais extras apos commits)

### Phase 3: Integration and validation (Sequential)

T7 -> T8 -> T9 -> T10

---

## Task Breakdown

### T1: Create feature branch for displacement firmware

What: Create dedicated branch from `main` for new hardware line.
Where: Git branch metadata
Depends on: None
Requirement: S5MM-10

Done when:

- [x] Branch exists locally with agreed name (default: `feature/s5-linear-displacement-mm`)
- [x] Working tree starts clean before code edits

Commit: none (branch operation)
Status: Completed

---

### T2: Stabilize local credentials contract

What: Fix/validate `credentials.local.h` syntax and keep secrets local-only.
Where: `src/prototipo/s5/credentials.local.h` (local), `.gitignore` verification
Depends on: T1
Requirement: S5MM-06

Done when:

- [x] Header compiles (valid C string literals)
- [x] SSID set to `IPT-WiFi-Novo`
- [x] Password present only locally

Commit: none for secrets file
Status: Completed

---

### T3: Isolate non-main sketch collision

What: Prevent duplicate `setup()/loop()` collisions caused by `microSD.ino` when compiling S5 folder.
Where: `src/prototipo/s5/`
Depends on: T2
Requirement: S5MM-10

Done when:

- [x] S5 compile path no longer includes conflicting secondary sketch entrypoint
- [x] Any SD experiment code is preserved in safe location/name

Commit: `chore(s5): isolate experimental microsd sketch from main firmware build`
Status: Completed (`1e27e62`)

---

### T4: Rename measurement domain from weight->displacement

What: Replace primary measurement semantics in constants, variable names, serial/LCD text, and units.
Where: `src/prototipo/s5/s5.ino`
Depends on: T3
Requirement: S5MM-01, S5MM-02, S5MM-10

Done when:

- [x] No user-facing `kg` remains for primary signal in firmware principal
- [x] Primary label constant uses displacement naming (`DISPLACEMENT_LABEL`)
- [x] Device label reviewed for branch intent (mantido legado `balancairon` por compatibilidade de backend)

Commit: `refactor(s5): migrate primary measurement semantics to displacement mm`
Status: Completed (conteudo entregue em `6222b5e`)

---

### T5: Implement mm conversion and zero workflow

What: Implement displacement conversion model using HX711 raw signal with zero reference and calibration constants.
Where: `src/prototipo/s5/s5.ino`
Depends on: T3
Requirement: S5MM-03, S5MM-04, S5MM-05

Done when:

- [x] Conversion equation documented in code comments
- [x] Zero button stores new baseline and reflects near 0 mm at rest
- [x] Calibration constants are centralized and easy to tune
- [x] Modo de span 20 mm por pressionar 3s e gravar ao soltar implementado em `handleCalibrationButton()`

Default implementation policy:

- Two-point calibration parameters: `raw_zero`, `raw_span_at_20mm`
- Formula: `mm = (raw - raw_zero) * 20.0 / (raw_span_at_20mm - raw_zero)`
- Clamp default: `[0.0, 20.0]` unless overrange mode is intentionally enabled

Commit: `feat(s5): add displacement conversion and zero reference handling`
Status: Completed (base em `6222b5e`, com ajustes locais nao commitados no `s5.ino`)

---

### T6: Rework alert thresholds for displacement range

What: Replace load-limit LED logic with displacement warning/critical thresholds.
Where: `src/prototipo/s5/s5.ino`
Depends on: T3
Requirement: S5MM-08, S5MM-09

Done when:

- [x] Threshold constants exist in mm (warning 15 mm, critical 20 mm)
- [x] LED states map to normal/warning/critical
- [x] LCD/serial messages describe displacement state

Commit: `feat(s5): apply displacement-based led threshold alerts`
Status: Completed (conteudo entregue em `6222b5e`)

---

### T7: Keep connectivity and telemetry continuity

What: Ensure WiFi/MQTT reconnect flow remains functional with updated payload field names.
Where: `src/prototipo/s5/s5.ino`
Depends on: T4, T5
Requirement: S5MM-06, S5MM-07

Done when:

- [x] WiFi connect path still uses local credentials
- [x] MQTT reconnect path unchanged or improved
- [x] Publish payload contains displacement + temperature + humidity

Commit: `feat(s5): preserve mqtt connectivity while publishing displacement payload`
Status: Completed (conteudo entregue em `6222b5e`)

---

### T8: Compile and hardware validation checklist

What: Validate compile and execute bench checklist for DT-20B displacement mode.
Where: local build + bench procedure notes
Depends on: T6, T7
Requirement: S5MM-01, S5MM-03, S5MM-04, S5MM-06, S5MM-08

Done when:

- [x] Compile succeeds for ESP32 target
- [ ] Bench checks pass:
  - [x] 0 mm baseline after zero action
  - [x] Known displacement reference check (atingiu ~20.000 mm no fim de curso em teste)
  - [ ] Ubidots receives displacement field (revalidacao final pendente apos ultimos ajustes locais)
  - [ ] Warning/critical LED transitions work (rodada final pendente apos ultimos ajustes locais)

Commit: none (validation gate)
Status: Partial

---

### T9: Branch documentation and handoff

What: Document branch purpose, sensor metadata, and calibration instructions for team handoff.
Where: `README.md` (or branch-specific doc under `document/`)
Depends on: T8
Requirement: S5MM-10

Done when:

- [x] Sensor identification and measurement unit documented
- [x] Calibration and zero workflow documented
- [ ] Branch naming and merge strategy documented

Commit: `docs(s5): add linear displacement branch notes and calibration guide`
Status: Partial (`6013745` + docs locais nao versionadas)

---

### T10: Document repository current state and delta from main

What: Consolidate branch review with implemented changes, local pending changes, risks, and next actions.
Where: `.specs/features/s5-linear-displacement-mm/status-review.md` and `.specs/project/STATE.md`
Depends on: T8, T9
Requirement: S5MM-10

Done when:

- [x] Documento de estado atual criado com baseline `main` vs branch
- [x] Commits e arquivos pendentes listados
- [x] Riscos e proximos passos priorizados

Commit: none (local planning artifacts)
Status: Completed

---

## Parallel Execution Map

Phase 1 (Sequential):

- T1 -> T2 -> T3

Phase 2 (Parallel after T3):

- T4 [P]
- T5 [P]
- T6 [P]

Phase 3 (Sequential):

- T7 -> T8 -> T9 -> T10

---

## Assumptions and Defaults Used

- Default branch name: `feature/s5-linear-displacement-mm`
- Default displacement label: `displacement_mm`
- Default full-scale displacement: 20 mm
- Temp/humidity remain in payload
- Secrets stay local and unversioned
- `.specs/` permanece local (ignorado no git)
