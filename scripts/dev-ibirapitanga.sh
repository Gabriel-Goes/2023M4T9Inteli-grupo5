#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROXY_DIR="${ROOT_DIR}/tools/ibirapitanga-official-proxy"
FRONTEND_DIR="${ROOT_DIR}/src/ibirapitanga_copy"

load_env_file() {
  local env_file="$1"
  if [[ -f "${env_file}" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "${env_file}"
    set +a
  fi
}

cleanup() {
  if [[ -n "${PROXY_PID:-}" ]] && kill -0 "${PROXY_PID}" 2>/dev/null; then
    kill "${PROXY_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

load_env_file "${PROXY_DIR}/.env.local"
load_env_file "${FRONTEND_DIR}/.env.local"

(
  cd "${PROXY_DIR}"
  npm start
) &
PROXY_PID=$!

echo "Proxy oficial iniciado em segundo plano (PID ${PROXY_PID})."
echo "Subindo frontend local em http://0.0.0.0:5174 ..."

cd "${FRONTEND_DIR}"
npm run dev -- --host 0.0.0.0 --port 5174
