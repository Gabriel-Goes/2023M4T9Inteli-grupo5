# Project State Memory

Updated: 2026-03-03

## Current Focus

- Consolidate S5 migration from weight (`kg`) to displacement (`mm`) for DT-20B transducer.
- Keep branch handoff documentation aligned with real code status.

## Decisions

1. Keep migration work on branch `feature/s5-linear-displacement-mm`.
2. Preserve existing device label `balancairon` for backend continuity in the short term.
3. Field calibration behavior:
   - short press on zero button -> capture `raw_zero` (0 mm)
   - hold for 3s then release -> capture `raw_at_20mm` (20 mm span)
4. Keep serial baud at `57600`.
5. Keep monitor/update cadence near 1 second.

## Completed Milestones

1. Removed sketch compile collision by moving `microSD.ino` to `experimentos/`.
2. Migrated primary firmware semantics and telemetry from kg to mm.
3. Added bench calibration documentation (`README_DT20B.md`).
4. Created status review for main-vs-branch delta and current local changes.

## Open Items

1. Final validation pass after latest local firmware updates:
   - Ubidots publish verification (`displacement_mm`)
   - LED threshold transition verification
   - repeatability at small displacement
2. Decide whether to commit:
   - pending `s5.ino` local updates
   - documentation consolidation updates in `README_DT20B.md`
3. Decide if calibration should be persisted across reboot (non-volatile storage).

## Risks

1. Calibration values are currently runtime-only and can be lost after restart.
2. Without repeatability log, drift/precision confidence remains limited.

## Deferred Ideas

1. Add guided calibration mode with on-screen progress and timeout.
2. Store multiple calibration profiles for different installation setups.
