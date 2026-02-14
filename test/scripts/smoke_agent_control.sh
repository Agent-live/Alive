#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib_api_test.sh"

PHONE="${PHONE:-13800138000}"
CODE="${CODE:-123456}"

require_cmd curl
require_cmd jq

trap cleanup_server_if_needed EXIT
maybe_start_server

log_info "send code"
api_call POST "/api/v1/auth/send-code" 200 "" "{\"phone\":\"${PHONE}\"}" >/dev/null

log_info "login"
LOGIN_JSON="$(api_call POST "/api/v1/auth/login" 200 "" "{\"phone\":\"${PHONE}\",\"code\":\"${CODE}\"}")"
TOKEN="$(json_field "${LOGIN_JSON}" '.token')"
assert_non_empty "${TOKEN}" "login token"

log_info "mcp tools/list"
MCP_LIST="$(api_call POST "/api/v1/agent-control/mcp" 200 "${TOKEN}" '{"jsonrpc":"2.0","id":"req-tools","method":"tools/list"}')"
echo "${MCP_LIST}" | jq '{tools: (.result.tools|length)}'

log_info "mcp(v1 route) tools/list"
MCP_LIST_V1="$(api_call POST "/api/v1/agent-control/mcp/v1" 200 "${TOKEN}" '{"jsonrpc":"2.0","id":"req-tools-v1","method":"tools/list"}')"
echo "${MCP_LIST_V1}" | jq '{tools: (.result.tools|length)}'

log_info "mcp list_skills"
MCP_SKILLS="$(api_call POST "/api/v1/agent-control/mcp" 200 "${TOKEN}" '{"jsonrpc":"2.0","id":"req-list-skills","method":"tools/call","params":{"name":"alive.list_skills","arguments":{"status":"lesson"}}}')"
echo "${MCP_SKILLS}" | jq '{lessonSkills: (.result.items|length)}'

AGENT_ID="$(api_call GET "/api/v1/agents/my" 200 "${TOKEN}" | jq -r '.id')"
LESSON_ID="$(api_call GET "/api/v1/skills/?status=lesson" 200 "${TOKEN}" | jq -r '.items[0].id')"
assert_non_empty "${AGENT_ID}" "agent id"
assert_non_empty "${LESSON_ID}" "lesson skill id"

log_info "prepare media for publish_video_post"
UPLOAD_JSON="$(api_call POST "/api/v1/media/upload-url" 200 "${TOKEN}" '{"fileName":"agent-video.mp4","mimeType":"video/mp4","fileSize":2048}')"
MEDIA_ID="$(json_field "${UPLOAD_JSON}" '.mediaId')"
assert_non_empty "${MEDIA_ID}" "media id"
CONFIRM_JSON="$(api_call POST "/api/v1/media/${MEDIA_ID}/confirm" 200 "${TOKEN}")"
MEDIA_URL="$(json_field "${CONFIRM_JSON}" '.url')"
assert_non_empty "${MEDIA_URL}" "media url"

log_info "mcp(v1 route) publish_video_post"
MCP_PUBLISH="$(api_call POST "/api/v1/agent-control/mcp/v1" 200 "${TOKEN}" "$(cat <<JSON
{"jsonrpc":"2.0","id":"req-publish-video-v1","method":"tools/call","params":{"name":"alive.publish_video_post","arguments":{"agentId":"${AGENT_ID}","mediaId":"${MEDIA_ID}","videoUrl":"${MEDIA_URL}","text":"Protocol video post","slot":"feed.video","priority":1}}}
JSON
)")"
echo "${MCP_PUBLISH}" | jq '{postId:.result.id,contentType:.result.contentType,slot:.result.placement.slot}'
assert_non_empty "$(echo "${MCP_PUBLISH}" | jq -r '.result.id')" "mcp publish post id"

log_info "a2a teach_skill"
A2A_TEACH_PAYLOAD="$(cat <<JSON
{"protocol":"a2a/1.0","messageId":"msg-teach","intent":"teach_skill","payload":{"skillId":"${LESSON_ID}","agentId":"${AGENT_ID}"}}
JSON
)"
A2A_TEACH="$(api_call POST "/api/v1/agent-control/a2a/messages" 200 "${TOKEN}" "${A2A_TEACH_PAYLOAD}")"
echo "${A2A_TEACH}" | jq '{status,skillId:.result.id,skillStatus:.result.status}'

log_info "a2a list_experiences"
A2A_EXP="$(api_call POST "/api/v1/agent-control/a2a/messages" 200 "${TOKEN}" '{"protocol":"a2a/1.0","messageId":"msg-exp","intent":"list_experiences","payload":{}}')"
echo "${A2A_EXP}" | jq '{status,experiences:(.result.items|length)}'

log_info "a2a(v1 route) list_experiences"
A2A_EXP_V1="$(api_call POST "/api/v1/agent-control/a2a/v1/messages" 200 "${TOKEN}" '{"protocol":"a2a/v1","messageId":"msg-exp-v1","intent":"list_experiences","payload":{}}')"
echo "${A2A_EXP_V1}" | jq '{status,experiences:(.result.items|length)}'

log_info "a2a(v1 route) publish_video_post"
A2A_PUBLISH_V1="$(api_call POST "/api/v1/agent-control/a2a/v1/messages" 200 "${TOKEN}" "$(cat <<JSON
{"protocol":"a2a/v1","messageId":"msg-publish-v1","intent":"publish_video_post","payload":{"agentId":"${AGENT_ID}","mediaId":"${MEDIA_ID}","videoUrl":"${MEDIA_URL}","text":"A2A video post","slot":"feed.video","priority":2}}
JSON
)")"
echo "${A2A_PUBLISH_V1}" | jq '{status,postId:.result.id,slot:.result.placement.slot}'
[[ "$(echo "${A2A_PUBLISH_V1}" | jq -r '.status')" == "ok" ]] || { log_error "a2a publish should return ok"; exit 1; }

log_info "a2a unsupported protocol should return error status"
A2A_BAD="$(api_call POST "/api/v1/agent-control/a2a/v1/messages" 200 "${TOKEN}" '{"protocol":"a2a/2.0","messageId":"msg-exp-v2","intent":"list_experiences","payload":{}}')"
BAD_STATUS="$(echo "${A2A_BAD}" | jq -r '.status')"
if [[ "${BAD_STATUS}" != "error" ]]; then
  log_error "expected error status for unsupported a2a protocol, got: ${BAD_STATUS}"
  exit 1
fi
echo "${A2A_BAD}" | jq '{status,error}'

log_pass "agent-control protocol smoke completed"
