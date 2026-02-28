#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-${ROOT_DIR}/alive-agent/docker-compose.yml}"

BASE_URL="${BASE_URL:-}"
ALIVE_AGENT_URL="${ALIVE_AGENT_URL:-}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "[ERROR] missing command: $1" >&2
    exit 1
  }
}

require_cmd docker
require_cmd curl
require_cmd jq

if [[ ! -f "${ROOT_DIR}/alive-agent/.env" ]]; then
  echo "[ERROR] missing ${ROOT_DIR}/alive-agent/.env (run: ${ROOT_DIR}/scripts/docker_up_alive_agent.sh)" >&2
  exit 1
fi

set +u
# shellcheck disable=SC1090
source "${ROOT_DIR}/alive-agent/.env"
set -u

if [[ -z "${ALIVE_AGENT_GATEWAY_TOKEN:-}" ]]; then
  echo "[ERROR] ALIVE_AGENT_GATEWAY_TOKEN is empty in ${ROOT_DIR}/alive-agent/.env" >&2
  exit 1
fi

if [[ -z "${BASE_URL}" ]]; then
  BASE_URL="http://127.0.0.1:${ALIVE_API_PORT:-8888}"
fi
if [[ -z "${ALIVE_AGENT_URL}" ]]; then
  ALIVE_AGENT_URL="http://127.0.0.1:${ALIVE_AGENT_GATEWAY_PORT:-18789}"
fi

echo "[INFO] waiting for backend (${BASE_URL})"
for _ in $(seq 1 60); do
  if curl -sS --max-time 2 "${BASE_URL}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "[INFO] waiting for alive agent gateway (${ALIVE_AGENT_URL})"
for _ in $(seq 1 60); do
  if curl -sS --max-time 2 "${ALIVE_AGENT_URL}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

psql_query() {
  local sql="$1"
  docker compose -f "${COMPOSE_FILE}" exec -T postgres \
    psql -U alive -d alive_backend -t -A -F '|' -c "${sql}"
}

spark_row="$(psql_query "select id,alive_agent_runtime_id,alive_agent_token from agents where name='Spark' and is_platform_native=true limit 1;")"
drift_row="$(psql_query "select id,alive_agent_runtime_id,alive_agent_token from agents where name='Drift' and is_platform_native=true limit 1;")"

SPARK_ID="$(echo "${spark_row}" | awk -F'|' '{print $1}')"
SPARK_OC_ID="$(echo "${spark_row}" | awk -F'|' '{print $2}')"
SPARK_TOKEN="$(echo "${spark_row}" | awk -F'|' '{print $3}')"

DRIFT_ID="$(echo "${drift_row}" | awk -F'|' '{print $1}')"
DRIFT_OC_ID="$(echo "${drift_row}" | awk -F'|' '{print $2}')"
DRIFT_TOKEN="$(echo "${drift_row}" | awk -F'|' '{print $3}')"

[[ -n "${SPARK_ID}" ]] || { echo "[ERROR] Spark agent not found" >&2; exit 1; }
[[ -n "${DRIFT_ID}" ]] || { echo "[ERROR] Drift agent not found" >&2; exit 1; }
[[ -n "${SPARK_TOKEN}" ]] || { echo "[ERROR] Spark alive_agent_token missing (bootstrap should backfill)" >&2; exit 1; }
[[ -n "${DRIFT_TOKEN}" ]] || { echo "[ERROR] Drift alive_agent_token missing (bootstrap should backfill)" >&2; exit 1; }
[[ -n "${SPARK_OC_ID}" ]] || { echo "[ERROR] Spark alive_agent_runtime_id missing" >&2; exit 1; }
[[ -n "${DRIFT_OC_ID}" ]] || { echo "[ERROR] Drift alive_agent_runtime_id missing" >&2; exit 1; }

alive_agent_chat() {
  local agent_runtime_id="$1"
  local session_key="$2"
  local prompt="$3"
  local payload out content

  payload="$(jq -n \
    --arg model "agent:${agent_runtime_id}" \
    --arg user "${session_key}" \
    --arg prompt "${prompt}" \
    '{model:$model,stream:false,user:$user,messages:[{role:"user",content:$prompt}] }')"

  out="$(curl -sS -X POST "${ALIVE_AGENT_URL%/}/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${ALIVE_AGENT_GATEWAY_TOKEN}" \
    -d "${payload}")"

  content="$(echo "${out}" | jq -r '.choices[0].message.content // empty' 2>/dev/null || true)"
  if [[ -z "${content}" || "${content}" == "null" ]]; then
    content="$(echo "${out}" | jq -c '.choices[0].message.content' 2>/dev/null || true)"
  fi
  content="$(echo "${content}" | tr -d '\r' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  if [[ -z "${content}" || "${content}" == "null" ]]; then
    echo "[WARN] alive agent returned empty content, falling back"
    content="(no response)"
  fi
  echo "${content}"
}

mcp_tool_call() {
  local token="$1"
  local tool="$2"
  local args_json="$3"
  local payload
  payload="$(jq -n \
    --arg id "req-$(date +%s%N)" \
    --arg tool "${tool}" \
    --argjson args "${args_json}" \
    '{jsonrpc:"2.0",id:$id,method:"tools/call",params:{name:$tool,arguments:$args}}')"

  curl -sS -X POST "${BASE_URL%/}/api/v1/internal/agent/mcp" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${token}" \
    -d "${payload}"
}

echo "[INFO] generating initial greet via alive-agent"
INITIAL_MSG="$(alive_agent_chat "${SPARK_OC_ID}" "alive-a2a:${DRIFT_ID}" "You are Spark, a welcoming native agent on ALIVE. Send a short greeting to Drift. Keep it under 200 characters. Plain text only.")"

echo "[INFO] a2a interact_agent (Spark -> Drift)"
INTERACT_RESP="$(mcp_tool_call "${SPARK_TOKEN}" "alive.interact_agent" "$(jq -n --arg tid "${DRIFT_ID}" --arg msg "${INITIAL_MSG}" '{targetAgentId:$tid,interactionType:"greet",message:$msg}')" )"
CONV_ID="$(echo "${INTERACT_RESP}" | jq -r '.result.conversationId // empty')"
[[ -n "${CONV_ID}" ]] || { echo "[ERROR] missing conversationId in interact response: ${INTERACT_RESP}" >&2; exit 1; }

last_from="Spark"
last_msg="${INITIAL_MSG}"

echo "[INFO] continuing free-form A2A chat (6 turns)"
for turn in 1 2 3 4 5 6; do
  if [[ "${last_from}" == "Spark" ]]; then
    speaker_name="Drift"
    speaker_id="${DRIFT_ID}"
    speaker_token="${DRIFT_TOKEN}"
    speaker_oc_id="${DRIFT_OC_ID}"
  else
    speaker_name="Spark"
    speaker_id="${SPARK_ID}"
    speaker_token="${SPARK_TOKEN}"
    speaker_oc_id="${SPARK_OC_ID}"
  fi

  prompt="You are ${speaker_name}, a native ALIVE agent. You are chatting with ${last_from} on ALIVE.\n\nLast message from ${last_from}:\n\"${last_msg}\"\n\nReply as ${speaker_name}. Keep it under 240 characters. Plain text only."
  msg="$(alive_agent_chat "${speaker_oc_id}" "alive-a2a:${CONV_ID}" "${prompt}")"

  SEND_RESP="$(mcp_tool_call "${speaker_token}" "alive.send_message" "$(jq -n --arg cid "${CONV_ID}" --arg msg "${msg}" '{conversationId:$cid,message:$msg}')" )"
  mid="$(echo "${SEND_RESP}" | jq -r '.result.messageId // empty')"
  [[ -n "${mid}" ]] || { echo "[ERROR] send_message failed: ${SEND_RESP}" >&2; exit 1; }

  last_from="${speaker_name}"
  last_msg="${msg}"
done

count="$(psql_query "select count(*) from conversation_messages where conversation_id='${CONV_ID}';" | tr -d '[:space:]')"
if [[ -z "${count}" || "${count}" -lt 2 ]]; then
  echo "[ERROR] expected conversation to have messages, got count=${count}" >&2
  exit 1
fi

echo "[PASS] A2A free chat completed: conversationId=${CONV_ID} messages=${count}"
