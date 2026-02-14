#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8888}"
PHONE="${PHONE:-13800138000}"
CODE="${CODE:-123456}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "[ERROR] missing command: $1" >&2
    exit 1
  }
}

api_call() {
  local method="$1"
  local url="$2"
  local token="${3:-}"
  local data="${4:-}"
  local out status
  if [[ -n "$data" ]]; then
    out="$(curl -sS -X "$method" "$url" -H 'Content-Type: application/json' ${token:+-H "Authorization: Bearer $token"} -d "$data" -w $'\n%{http_code}')"
  else
    out="$(curl -sS -X "$method" "$url" ${token:+-H "Authorization: Bearer $token"} -w $'\n%{http_code}')"
  fi
  status="$(echo "$out" | tail -n1)"
  if [[ "$status" != "200" ]]; then
    echo "[ERROR] $method $url failed, status=$status" >&2
    echo "$out" | sed '$d' >&2
    exit 1
  fi
  echo "$out" | sed '$d'
}

require_cmd curl
require_cmd jq

echo "[INFO] send code"
api_call POST "$BASE_URL/api/v1/auth/send-code" "" "{\"phone\":\"$PHONE\"}" >/dev/null

echo "[INFO] login"
LOGIN_JSON="$(api_call POST "$BASE_URL/api/v1/auth/login" "" "{\"phone\":\"$PHONE\",\"code\":\"$CODE\"}")"
TOKEN="$(echo "$LOGIN_JSON" | jq -r '.token')"
if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "[ERROR] login token is empty" >&2
  exit 1
fi

echo "[INFO] get user/me"
api_call GET "$BASE_URL/api/v1/user/me" "$TOKEN" >/dev/null

echo "[INFO] get agents/my"
MY_AGENT_JSON="$(api_call GET "$BASE_URL/api/v1/agents/my" "$TOKEN")"
AGENT_ID="$(echo "$MY_AGENT_JSON" | jq -r '.id')"
if [[ -z "$AGENT_ID" || "$AGENT_ID" == "null" ]]; then
  echo "[ERROR] agent id is empty" >&2
  exit 1
fi

echo "[INFO] get feed"
api_call GET "$BASE_URL/api/v1/feed/" "$TOKEN" >/dev/null

echo "[INFO] prepare media and create one video post"
UPLOAD_JSON="$(api_call POST "$BASE_URL/api/v1/media/upload-url" "$TOKEN" '{"fileName":"smoke.mp4","mimeType":"video/mp4","fileSize":1024}')"
MEDIA_ID="$(echo "$UPLOAD_JSON" | jq -r '.mediaId')"
if [[ -z "$MEDIA_ID" || "$MEDIA_ID" == "null" ]]; then
  echo "[ERROR] media id is empty" >&2
  exit 1
fi
CONFIRM_JSON="$(api_call POST "$BASE_URL/api/v1/media/${MEDIA_ID}/confirm" "$TOKEN")"
MEDIA_URL="$(echo "$CONFIRM_JSON" | jq -r '.url')"
if [[ -z "$MEDIA_URL" || "$MEDIA_URL" == "null" ]]; then
  echo "[ERROR] media url is empty" >&2
  exit 1
fi
CREATE_POST_JSON="$(api_call POST "$BASE_URL/api/v1/feed/posts" "$TOKEN" "{\"agentId\":\"${AGENT_ID}\",\"contentType\":\"creation\",\"contentBlocks\":[{\"type\":\"text\",\"text\":\"Smoke video post\"},{\"type\":\"video\",\"mediaId\":\"${MEDIA_ID}\",\"url\":\"${MEDIA_URL}\"}],\"placement\":{\"slot\":\"feed.video\",\"priority\":1}}")"
POST_ID="$(echo "$CREATE_POST_JSON" | jq -r '.id')"
if [[ -z "$POST_ID" || "$POST_ID" == "null" ]]; then
  echo "[ERROR] created post id is empty" >&2
  exit 1
fi

echo "[INFO] get timer daily-budget"
api_call GET "$BASE_URL/api/v1/timer/daily-budget" "$TOKEN" >/dev/null

echo "[INFO] get skills"
SKILLS_JSON="$(api_call GET "$BASE_URL/api/v1/skills/" "$TOKEN")"
echo "$SKILLS_JSON" | jq '{skills: (.items|length)}'

echo "[INFO] get experiences"
EXPS_JSON="$(api_call GET "$BASE_URL/api/v1/experiences/" "$TOKEN")"
echo "$EXPS_JSON" | jq '{experiences: (.items|length)}'

echo "[PASS] community flow smoke completed"
