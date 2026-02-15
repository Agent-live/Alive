#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./scripts/restart_backend.sh [--seed] [--no-build] [--foreground]

Restarts the Alive backend API server:
- If already running: stop it (by PID file and by listening port), then start it.
- If not running: start it.

Options:
  --seed        Run db seed before starting (idempotent).
  --no-build    Skip 'go build' and run existing binary in ./work/.
  --foreground  Run in foreground (no nohup; logs go to stdout/stderr).
EOF
}

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
CONFIG_FILE="${BACKEND_DIR}/etc/alive-api.yaml"
WORK_DIR="${ROOT_DIR}/work"
BIN_FILE="${WORK_DIR}/alive-api"
PID_FILE="${WORK_DIR}/alive-api.pid"
LOG_FILE="${WORK_DIR}/alive-api.log"

SEED=0
NO_BUILD=0
FOREGROUND=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --seed) SEED=1; shift ;;
    --no-build) NO_BUILD=1; shift ;;
    --foreground) FOREGROUND=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) log "Unknown argument: $1"; usage; exit 2 ;;
  esac
done

mkdir -p "$WORK_DIR"

if [[ ! -d "$BACKEND_DIR" ]]; then
  log "backend dir not found: $BACKEND_DIR"
  exit 1
fi
if [[ ! -f "$CONFIG_FILE" ]]; then
  log "config file not found: $CONFIG_FILE"
  exit 1
fi

PORT="${ALIVE_API_PORT:-}"
if [[ -z "$PORT" ]]; then
  PORT="$(awk -F: '/^Port:/{gsub(/[[:space:]]/, "", $2); print $2; exit}' "$CONFIG_FILE" || true)"
fi
if [[ -z "$PORT" ]]; then
  PORT="8888"
fi

is_pid_alive() {
  local pid="$1"
  [[ "$pid" =~ ^[0-9]+$ ]] || return 1
  kill -0 "$pid" >/dev/null 2>&1
}

port_pids() {
  # macOS-friendly: list PIDs listening on TCP:$PORT
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null || true
}

wait_port_free() {
  local timeout_s="${1:-10}"
  local deadline=$((SECONDS + timeout_s))
  while [[ $SECONDS -lt $deadline ]]; do
    if ! lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.2
  done
  return 1
}

wait_pid_dead() {
  local pid="$1"
  local timeout_s="${2:-10}"
  local deadline=$((SECONDS + timeout_s))
  while [[ $SECONDS -lt $deadline ]]; do
    if ! is_pid_alive "$pid"; then
      return 0
    fi
    sleep 0.2
  done
  return 1
}

stop_existing() {
  local pid=""
  if [[ -f "$PID_FILE" ]]; then
    pid="$(tr -d ' \t\r\n' < "$PID_FILE" || true)"
    if is_pid_alive "$pid"; then
      log "Stopping existing backend (pid file): pid=$pid"
      kill -TERM "$pid" 2>/dev/null || true
      wait_pid_dead "$pid" 10 || {
        log "Still running after TERM, force killing: pid=$pid"
        kill -KILL "$pid" 2>/dev/null || true
      }
    fi
    rm -f "$PID_FILE"
  fi

  local pids=""
  pids="$(port_pids)"
  if [[ -n "$pids" ]]; then
    log "Stopping processes listening on port $PORT: $(echo "$pids" | tr '\n' ' ' | sed 's/[[:space:]]*$//')"
    while read -r p; do
      [[ -n "$p" ]] || continue
      kill -TERM "$p" 2>/dev/null || true
    done <<<"$pids"

    wait_port_free 10 || {
      log "Port $PORT still busy after TERM, force killing..."
      pids="$(port_pids)"
      while read -r p; do
        [[ -n "$p" ]] || continue
        kill -KILL "$p" 2>/dev/null || true
      done <<<"$pids"
      wait_port_free 5 || true
    }
  fi
}

start_backend_background() {
  if [[ ! -x "$BIN_FILE" ]]; then
    log "binary not found/executable: $BIN_FILE"
    log "try running without --no-build, or build manually."
    exit 1
  fi

  log "Starting backend in background (port $PORT)"
  log "Logs: $LOG_FILE"
  (
    cd "$BACKEND_DIR"
    nohup "$BIN_FILE" -f "$CONFIG_FILE" >"$LOG_FILE" 2>&1 &
    echo "$!" >"$PID_FILE"
  )
}

start_backend_foreground() {
  if [[ ! -x "$BIN_FILE" ]]; then
    log "binary not found/executable: $BIN_FILE"
    log "try running without --no-build, or build manually."
    exit 1
  fi
  log "Starting backend in foreground (port $PORT)"
  cd "$BACKEND_DIR"
  exec "$BIN_FILE" -f "$CONFIG_FILE"
}

wait_listening() {
  local timeout_s="${1:-20}"
  local deadline=$((SECONDS + timeout_s))
  while [[ $SECONDS -lt $deadline ]]; do
    if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.2
  done
  return 1
}

log "Restarting Alive backend..."
log "Config: $CONFIG_FILE"
log "Workdir: $WORK_DIR"

stop_existing

if [[ "$SEED" -eq 1 ]]; then
  log "Seeding database (idempotent)..."
  ( cd "$BACKEND_DIR" && go run ./cmd/seed -f etc/alive-api.yaml )
fi

if [[ "$NO_BUILD" -ne 1 ]]; then
  log "Building backend binary -> $BIN_FILE"
  ( cd "$BACKEND_DIR" && go build -o "$BIN_FILE" . )
fi

if [[ "$FOREGROUND" -eq 1 ]]; then
  start_backend_foreground
else
  start_backend_background
  if wait_listening 20; then
    local_pid="$(tr -d ' \t\r\n' < "$PID_FILE" || true)"
    log "Backend is up: http://localhost:$PORT (pid=${local_pid:-unknown})"
  else
    log "Backend did not start listening on port $PORT within timeout."
    if [[ -f "$LOG_FILE" ]]; then
      log "Last 80 log lines:"
      tail -n 80 "$LOG_FILE" || true
    fi
    exit 1
  fi
fi

