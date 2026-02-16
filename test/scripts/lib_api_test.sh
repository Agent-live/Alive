#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8888}"
AUTO_START="${AUTO_START:-0}"
_DEFAULT_BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../backend" && pwd)"
BACKEND_DIR="${BACKEND_DIR:-${_DEFAULT_BACKEND_DIR}}"

_SERVER_STARTED_BY_TEST=0
_SERVER_PID=""

log_info() {
  echo "[INFO] $*"
}

log_pass() {
  echo "[PASS] $*"
}

log_warn() {
  echo "[WARN] $*"
}

log_error() {
  echo "[ERROR] $*" >&2
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    log_error "missing command: $1"
    exit 1
  }
}

server_is_up() {
  curl -sS --max-time 2 "${BASE_URL}" >/dev/null 2>&1
}

wait_server_up() {
  local retries="${1:-30}"
  local i
  for ((i = 1; i <= retries; i++)); do
    if server_is_up; then
      return 0
    fi
    sleep 1
  done
  return 1
}

maybe_start_server() {
  if server_is_up; then
    log_info "backend server already running at ${BASE_URL}"
    return 0
  fi

  if [[ "${AUTO_START}" != "1" ]]; then
    log_error "backend server is not running at ${BASE_URL}. set AUTO_START=1 to auto start."
    return 1
  fi

  log_info "starting backend server from ${BACKEND_DIR}"
  (
    cd "${BACKEND_DIR}"
    nohup go run alive.go -f etc/alive-api.yaml >/tmp/alive-api-full-test.log 2>&1 &
    echo $! >/tmp/alive-api-full-test.pid
  )
  _SERVER_PID="$(cat /tmp/alive-api-full-test.pid)"
  _SERVER_STARTED_BY_TEST=1
  if ! wait_server_up 40; then
    log_error "backend server failed to start"
    [[ -f /tmp/alive-api-full-test.log ]] && tail -n 120 /tmp/alive-api-full-test.log >&2
    return 1
  fi
  log_info "backend server started pid=${_SERVER_PID}"
}

cleanup_server_if_needed() {
  if [[ "${_SERVER_STARTED_BY_TEST}" == "1" && -n "${_SERVER_PID}" ]]; then
    log_info "stopping backend server pid=${_SERVER_PID}"
    kill "${_SERVER_PID}" >/dev/null 2>&1 || true
  fi
}

api_call() {
  local method="$1"
  local path="$2"
  local expected_status="${3:-200}"
  local token="${4:-}"
  local data="${5:-}"
  local url="${BASE_URL}${path}"
  local out body status

  if [[ -n "${data}" ]]; then
    out="$(curl -sS -X "${method}" "${url}" -H 'Content-Type: application/json' ${token:+-H "Authorization: Bearer ${token}"} -d "${data}" -w $'\n%{http_code}')"
  else
    out="$(curl -sS -X "${method}" "${url}" ${token:+-H "Authorization: Bearer ${token}"} -w $'\n%{http_code}')"
  fi

  status="$(echo "${out}" | tail -n1)"
  body="$(echo "${out}" | sed '$d')"
  if [[ "${status}" != "${expected_status}" ]]; then
    log_error "${method} ${path} expected status ${expected_status}, got ${status}"
    echo "${body}" >&2
    return 1
  fi
  echo "${body}"
}

json_field() {
  local json="$1"
  local jq_expr="$2"
  echo "${json}" | jq -r "${jq_expr}"
}

assert_non_empty() {
  local value="$1"
  local name="$2"
  if [[ -z "${value}" || "${value}" == "null" ]]; then
    log_error "assert_non_empty failed: ${name} is empty"
    return 1
  fi
}
