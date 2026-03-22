# Repository Guidelines

## Project Structure & Module Organization
This repository mixes firmware, a local dashboard, bridge utilities, and project documentation.

- `src/ibirapitanga_copy/`: Vite + React + TypeScript frontend. Main app code lives in `src/components`, `src/pages`, `src/hooks`, and `src/config`.
- `tools/ibirapitanga-official-proxy/`: local Node.js proxy for the official API/WebSocket flow.
- `tools/serial-mqtt-ws-bridge/`: fallback Node.js bridge for serial -> MQTT -> WebSocket tests.
- `src/prototipo/s1` ... `src/prototipo/s5`: Arduino/ESP32 sketches, usually one `.ino` per device revision.
- `document/` and `assets/`: project docs, rollout notes, diagrams, and images.

Avoid editing generated output in `src/ibirapitanga_copy/dist/` or dependencies under `node_modules/`.

## Build, Test, and Development Commands
- `cd src/ibirapitanga_copy && npm install && npm run dev`: start the local dashboard with Vite.
- `cd src/ibirapitanga_copy && npm run build`: type-check and build the frontend.
- `cd tools/ibirapitanga-official-proxy && npm install && npm start`: run the official local proxy.
- `cd tools/serial-mqtt-ws-bridge && npm install && npm run dev`: run the fallback bridge in watch mode.
- `./scripts/dev-ibirapitanga.sh`: start the proxy and frontend together for local dashboard work.

Create `.env.local` files in the frontend/proxy folders using the variable lists documented in each subproject README before running networked flows.

## Coding Style & Naming Conventions
Use 2-space indentation in TypeScript, JavaScript, and config files. Follow the existing ESM style: double quotes, semicolons, and small focused modules.

Use `PascalCase` for React components (`DeviceCard.tsx`), `camelCase` for hooks/utilities (`useDeviceStream.ts`), and keep Arduino sketches named after their folder (`src/prototipo/s5/s5.ino`).

## Testing Guidelines
No committed automated test suite or lint configuration is present. Minimum validation for code changes:

- Frontend: `cd src/ibirapitanga_copy && npm run build`
- Proxy/bridge: start the touched service and verify it boots cleanly
- Firmware: compile the changed sketch in Arduino IDE/CLI for the target board

For UI changes, manually verify `/dashboards`, `/showroom`, and `/devices`.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commits with scopes, for example `feat(ibirapitanga): ...`, `fix(bridge): ...`, and `docs(ibirapitanga): ...`. Keep messages imperative and scoped to the affected area.

Pull requests should summarize the problem and fix, list affected paths, note any required env vars or hardware, and include screenshots for dashboard/UI changes. Link the supporting issue or document when one exists.
