#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib_api_test.sh"

require_cmd curl
require_cmd jq

trap cleanup_server_if_needed EXIT
maybe_start_server

RUN_ID="$(date +%s)"
PHONE="137$(printf '%08d' "$((RUN_ID % 100000000))")"

log_info "frontend-backend api test run id=${RUN_ID} phone=${PHONE}"

log_info "FBA01 auth/send-code"
api_call POST "/api/v1/auth/send-code" 200 "" "{\"phone\":\"${PHONE}\"}" >/dev/null
log_pass "FBA01 ok"

log_info "FBA02 auth/login"
LOGIN_JSON="$(api_call POST "/api/v1/auth/login" 200 "" "{\"phone\":\"${PHONE}\",\"code\":\"123456\"}")"
TOKEN="$(json_field "${LOGIN_JSON}" '.token')"
USER_ID="$(json_field "${LOGIN_JSON}" '.user.id')"
assert_non_empty "${TOKEN}" "token"
assert_non_empty "${USER_ID}" "user.id"
log_pass "FBA02 ok"

log_info "FBA03 auth/social-login (wechat deterministic path)"
SOCIAL_JSON="$(api_call POST "/api/v1/auth/social-login" 200 "" "{\"provider\":\"wechat\",\"externalId\":\"wx-${RUN_ID}\",\"nickname\":\"wechat-${RUN_ID}\"}")"
assert_non_empty "$(json_field "${SOCIAL_JSON}" '.token')" "social token"
log_pass "FBA03 ok"

log_info "FBA04 user/me + user/me update profile"
ME_JSON="$(api_call GET "/api/v1/user/me" 200 "${TOKEN}")"
assert_non_empty "$(json_field "${ME_JSON}" '.id')" "me.id"
UPDATED_ME_JSON="$(api_call PUT "/api/v1/user/me" 200 "${TOKEN}" '{"nickname":"Frontend API Tester","bio":"frontend-backend integration","gender":"other","birthdate":"1997-07-07"}')"
[[ "$(json_field "${UPDATED_ME_JSON}" '.nickname')" == "Frontend API Tester" ]] || { log_error "nickname update failed"; exit 1; }
[[ "$(json_field "${UPDATED_ME_JSON}" '.bio')" == "frontend-backend integration" ]] || { log_error "bio update failed"; exit 1; }
log_pass "FBA04 ok"

log_info "FBA05 create single agent for this user"
CREATE_AGENT_JSON="$(api_call POST "/api/v1/agents/" 200 "${TOKEN}" "$(cat <<JSON
{"name":"FrontendAgent${RUN_ID}","personality":{"worldview":"curious","tone":"calm","values":["clarity"],"communicationStyle":"reflective","boundaries":["No abuse"]},"goalDescription":"Verify frontend-backend API connectivity","avatarSeed":"frontend-${RUN_ID}"}
JSON
)")"
AGENT_ID="$(json_field "${CREATE_AGENT_JSON}" '.id')"
assert_non_empty "${AGENT_ID}" "agent.id"
log_pass "FBA05 ok"

log_info "FBA06 media upload(confirm image) + update avatar"
IMG_UPLOAD_JSON="$(api_call POST "/api/v1/media/upload-url" 200 "${TOKEN}" '{"fileName":"avatar.png","mimeType":"image/png","fileSize":1024}')"
IMG_MEDIA_ID="$(json_field "${IMG_UPLOAD_JSON}" '.mediaId')"
assert_non_empty "${IMG_MEDIA_ID}" "img.mediaId"
IMG_CONFIRM_JSON="$(api_call POST "/api/v1/media/${IMG_MEDIA_ID}/confirm" 200 "${TOKEN}")"
IMG_URL="$(json_field "${IMG_CONFIRM_JSON}" '.url')"
assert_non_empty "${IMG_URL}" "img.url"
ME_AVATAR_JSON="$(api_call PUT "/api/v1/user/me" 200 "${TOKEN}" "{\"avatar\":\"${IMG_URL}\"}")"
[[ "$(json_field "${ME_AVATAR_JSON}" '.avatar')" == "${IMG_URL}" ]] || { log_error "avatar update failed"; exit 1; }
log_pass "FBA06 ok"

log_info "FBA07 media upload(confirm video)"
VID_UPLOAD_JSON="$(api_call POST "/api/v1/media/upload-url" 200 "${TOKEN}" '{"fileName":"clip.mp4","mimeType":"video/mp4","fileSize":4096}')"
VID_MEDIA_ID="$(json_field "${VID_UPLOAD_JSON}" '.mediaId')"
assert_non_empty "${VID_MEDIA_ID}" "video.mediaId"
VID_CONFIRM_JSON="$(api_call POST "/api/v1/media/${VID_MEDIA_ID}/confirm" 200 "${TOKEN}")"
VID_URL="$(json_field "${VID_CONFIRM_JSON}" '.url')"
assert_non_empty "${VID_URL}" "video.url"
log_pass "FBA07 ok"

log_info "FBA08 feed/posts publish video with placement"
VIDEO_POST_JSON="$(api_call POST "/api/v1/feed/posts" 200 "${TOKEN}" "$(cat <<JSON
{"agentId":"${AGENT_ID}","contentType":"creation","contentBlocks":[{"type":"text","text":"frontend video publish"},{"type":"video","mediaId":"${VID_MEDIA_ID}","url":"${VID_URL}","thumbnailUrl":"https://media.alive.bot/${VID_MEDIA_ID}/thumb","duration":15}],"contentTextPreview":"frontend video publish","placement":{"slot":"feed.video","pinned":true,"priority":1}}
JSON
)")"
VIDEO_POST_ID="$(json_field "${VIDEO_POST_JSON}" '.id')"
assert_non_empty "${VIDEO_POST_ID}" "video post id"
[[ "$(json_field "${VIDEO_POST_JSON}" '.placement.slot')" == "feed.video" ]] || { log_error "placement slot mismatch"; exit 1; }
log_pass "FBA08 ok"

log_info "FBA09 feed list by placementSlot should include published video post"
VIDEO_FEED_JSON="$(api_call GET "/api/v1/feed/?placementSlot=feed.video&page=1&pageSize=20" 200 "${TOKEN}")"
MATCH_COUNT="$(echo "${VIDEO_FEED_JSON}" | jq -r --arg id "${VIDEO_POST_ID}" '[.items[] | select(.id == $id)] | length')"
if [[ "${MATCH_COUNT}" -lt 1 ]]; then
  log_error "published video post not found in placement feed"
  exit 1
fi
echo "${VIDEO_FEED_JSON}" | jq '{items:(.items|length),hasMore,page,pageSize}'
log_pass "FBA09 ok"

log_info "FBA10 MCP route support (tools/list + v1)"
MCP_LIST="$(api_call POST "/api/v1/agent-control/mcp" 200 "${TOKEN}" '{"jsonrpc":"2.0","id":"fba-tools","method":"tools/list"}')"
MCP_TOOLS="$(echo "${MCP_LIST}" | jq -r '.result.tools | length')"
[[ "${MCP_TOOLS}" -ge 5 ]] || { log_error "mcp tools length expected >= 5"; exit 1; }
MCP_LIST_V1="$(api_call POST "/api/v1/agent-control/mcp/v1" 200 "${TOKEN}" '{"jsonrpc":"2.0","id":"fba-tools-v1","method":"tools/list"}')"
MCP_TOOLS_V1="$(echo "${MCP_LIST_V1}" | jq -r '.result.tools | length')"
[[ "${MCP_TOOLS_V1}" -ge 5 ]] || { log_error "mcp v1 tools length expected >= 5"; exit 1; }
log_pass "FBA10 ok"

log_info "FBA11 A2A v1 publish_video_post route support"
A2A_PUBLISH_V1="$(api_call POST "/api/v1/agent-control/a2a/v1/messages" 200 "${TOKEN}" "$(cat <<JSON
{"protocol":"a2a/v1","messageId":"fba-a2a-publish","intent":"publish_video_post","payload":{"agentId":"${AGENT_ID}","mediaId":"${VID_MEDIA_ID}","videoUrl":"${VID_URL}","text":"a2a frontend video publish","slot":"feed.video","priority":2}}
JSON
)")"
[[ "$(echo "${A2A_PUBLISH_V1}" | jq -r '.status')" == "ok" ]] || { log_error "a2a publish status should be ok"; exit 1; }
assert_non_empty "$(echo "${A2A_PUBLISH_V1}" | jq -r '.result.id')" "a2a publish post id"
log_pass "FBA11 ok"

echo "${A2A_PUBLISH_V1}" | jq '{status,postId:.result.id,slot:.result.placement.slot}'
log_pass "frontend-backend api test completed"
