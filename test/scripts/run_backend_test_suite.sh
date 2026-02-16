#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

echo "[INFO] running go unit tests"
(
  cd backend
  go test ./...
)

echo "[INFO] running community API full integration test"
AUTO_START="${AUTO_START:-1}" test/scripts/community_api_full_test.sh

echo "[INFO] running agent-control smoke integration test"
AUTO_START="${AUTO_START:-1}" test/scripts/smoke_agent_control.sh

echo "[PASS] backend test suite completed"

