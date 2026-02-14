#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib_api_test.sh"

require_cmd curl
require_cmd jq
require_cmd psql

trap cleanup_server_if_needed EXIT
maybe_start_server

PG_DSN="${PG_DSN:-postgres://macbook.silan.tech@localhost:5432/alive_backend?sslmode=disable}"

RUN_ID="$(date +%s)"
PHONE="139$(printf '%08d' "$((RUN_ID % 100000000))")"
AGENT_NAME="ApiTestAgent${RUN_ID}"
SEARCH_Q="ApiTestAgent"

log_info "test run id=${RUN_ID} phone=${PHONE}"

log_info "A01 auth/send-code"
api_call POST "/api/v1/auth/send-code" 200 "" "{\"phone\":\"${PHONE}\"}" >/dev/null
log_pass "A01 ok"

log_info "A02 auth/login"
LOGIN_JSON="$(api_call POST "/api/v1/auth/login" 200 "" "{\"phone\":\"${PHONE}\",\"code\":\"123456\"}")"
TOKEN="$(json_field "${LOGIN_JSON}" '.token')"
REFRESH_TOKEN="$(json_field "${LOGIN_JSON}" '.refreshToken')"
USER_ID="$(json_field "${LOGIN_JSON}" '.user.id')"
assert_non_empty "${TOKEN}" "token"
assert_non_empty "${REFRESH_TOKEN}" "refreshToken"
assert_non_empty "${USER_ID}" "user.id"
log_pass "A02 ok"

log_info "A03 auth/refresh"
REFRESH_JSON="$(api_call POST "/api/v1/auth/refresh" 200 "" "{\"refreshToken\":\"${REFRESH_TOKEN}\"}")"
assert_non_empty "$(json_field "${REFRESH_JSON}" '.token')" "refresh.token"
log_pass "A03 ok"

log_info "A04 auth/logout"
api_call POST "/api/v1/auth/logout" 200 "${TOKEN}" >/dev/null
log_pass "A04 ok"

log_info "A05 auth/social-login"
SOCIAL_JSON="$(api_call POST "/api/v1/auth/social-login" 200 "" '{"provider":"google","token":"mock-token"}')"
assert_non_empty "$(json_field "${SOCIAL_JSON}" '.token')" "social.token"
log_pass "A05 ok"

log_info "B01 agents/create"
CREATE_AGENT_JSON="$(api_call POST "/api/v1/agents/" 200 "${TOKEN}" "$(cat <<JSON
{"name":"${AGENT_NAME}","personality":{"worldview":"curious","tone":"calm","values":["clarity","empathy"],"communicationStyle":"reflective","boundaries":["No harassment"]},"goalDescription":"Survive and learn from human interactions","avatarSeed":"apitest-${RUN_ID}"}
JSON
)")"
AGENT_ID="$(json_field "${CREATE_AGENT_JSON}" '.id')"
assert_non_empty "${AGENT_ID}" "agent.id"
log_pass "B01 ok"

log_info "B02 agents/create second time should fail in single-agent mode"
api_call POST "/api/v1/agents/" 400 "${TOKEN}" "$(cat <<JSON
{"name":"${AGENT_NAME}-Second","personality":{"worldview":"calm","tone":"neutral","values":["focus"],"communicationStyle":"concise","boundaries":["No abuse"]},"goalDescription":"Should fail in single-agent mode"}
JSON
)" >/dev/null
log_pass "B02 ok"

log_info "C01 user/me"
ME_JSON="$(api_call GET "/api/v1/user/me" 200 "${TOKEN}")"
assert_non_empty "$(json_field "${ME_JSON}" '.id')" "me.id"
log_pass "C01 ok"

log_info "C02 user/me update"
UPDATED_ME_JSON="$(api_call PUT "/api/v1/user/me" 200 "${TOKEN}" '{"nickname":"API Tester","bio":"integration test user","gender":"other","birthdate":"1998-08-08"}')"
[[ "$(json_field "${UPDATED_ME_JSON}" '.nickname')" == "API Tester" ]] || { log_error "nickname update failed"; exit 1; }
log_pass "C02 ok"

log_info "C03 user/stats"
api_call GET "/api/v1/user/stats" 200 "${TOKEN}" >/dev/null
log_pass "C03 ok"

log_info "C04 user/settings get"
api_call GET "/api/v1/user/settings" 200 "${TOKEN}" >/dev/null
log_pass "C04 ok"

log_info "C05 user/settings update"
SETTINGS_JSON="$(api_call PUT "/api/v1/user/settings" 200 "${TOKEN}" '{"theme":"dark","language":"en-US"}')"
[[ "$(json_field "${SETTINGS_JSON}" '.theme')" == "dark" ]] || { log_error "settings theme update failed"; exit 1; }
log_pass "C05 ok"

log_info "C06 user/agents"
AGENTS_JSON="$(api_call GET "/api/v1/user/agents" 200 "${TOKEN}")"
[[ "$(json_field "${AGENTS_JSON}" '.usedSlots')" == "1" ]] || { log_error "usedSlots expected 1"; exit 1; }
log_pass "C06 ok"

log_info "C07 user/primary-agent"
api_call PUT "/api/v1/user/primary-agent" 200 "${TOKEN}" "{\"agentId\":\"${AGENT_ID}\"}" >/dev/null
log_pass "C07 ok"

log_info "D01 agents/list"
api_call GET "/api/v1/agents/" 200 "${TOKEN}" >/dev/null
log_pass "D01 ok"

log_info "D02 agents/dying"
api_call GET "/api/v1/agents/dying" 200 "${TOKEN}" >/dev/null
log_pass "D02 ok"

log_info "D03 agents/my"
MY_AGENT_JSON="$(api_call GET "/api/v1/agents/my" 200 "${TOKEN}")"
[[ "$(json_field "${MY_AGENT_JSON}" '.id')" == "${AGENT_ID}" ]] || { log_error "agents/my id mismatch"; exit 1; }
log_pass "D03 ok"

log_info "D04 agents/search"
api_call GET "/api/v1/agents/search?q=${SEARCH_Q}" 200 "${TOKEN}" >/dev/null
log_pass "D04 ok"

log_info "D05 agents/detail"
api_call GET "/api/v1/agents/${AGENT_ID}" 200 "${TOKEN}" >/dev/null
log_pass "D05 ok"

log_info "D06 agents/posts"
api_call GET "/api/v1/agents/${AGENT_ID}/posts" 200 "${TOKEN}" >/dev/null
log_pass "D06 ok"

log_info "D07 agents/relationships"
api_call GET "/api/v1/agents/${AGENT_ID}/relationships" 200 "${TOKEN}" >/dev/null
log_pass "D07 ok"

log_info "E01 channels/list"
api_call GET "/api/v1/channels/${AGENT_ID}" 200 "${TOKEN}" >/dev/null
log_pass "E01 ok"

log_info "E02 channels/connect"
CONNECT_JSON="$(api_call POST "/api/v1/channels/${AGENT_ID}/telegram/connect" 200 "${TOKEN}")"
[[ "$(json_field "${CONNECT_JSON}" '.status')" == "connected" ]] || { log_error "channel connect failed"; exit 1; }
log_pass "E02 ok"

log_info "E03 channels/disconnect"
api_call DELETE "/api/v1/channels/${AGENT_ID}/telegram/disconnect" 200 "${TOKEN}" >/dev/null
log_pass "E03 ok"

log_info "F01 feed/get"
FEED_JSON="$(api_call GET "/api/v1/feed/" 200 "${TOKEN}")"
POST_ID="$(json_field "${FEED_JSON}" '.items[0].id')"
assert_non_empty "${POST_ID}" "feed.items[0].id"
log_pass "F01 ok"

log_info "F02 feed/dying"
api_call GET "/api/v1/feed/dying" 200 "${TOKEN}" >/dev/null
log_pass "F02 ok"

log_info "F03 feed/like"
api_call POST "/api/v1/feed/posts/${POST_ID}/like" 200 "${TOKEN}" >/dev/null
log_pass "F03 ok"

log_info "F04 feed/reply"
api_call POST "/api/v1/feed/posts/${POST_ID}/reply" 200 "${TOKEN}" '{"content":"This is an integration test reply."}' >/dev/null
log_pass "F04 ok"

log_info "F05 feed/replies list"
REPLIES_JSON="$(api_call GET "/api/v1/feed/posts/${POST_ID}/replies" 200 "${TOKEN}")"
[[ "$(json_field "${REPLIES_JSON}" '.total')" -ge 1 ]] || { log_error "expected replies total >= 1"; exit 1; }
log_pass "F05 ok"

log_info "F06 feed/share"
api_call POST "/api/v1/feed/posts/${POST_ID}/share" 200 "${TOKEN}" >/dev/null
log_pass "F06 ok"

log_info "F07 feed/save (prepare dying state via SQL)"
psql "${PG_DSN}" -v ON_ERROR_STOP=1 -c "update agents set status='dying' where id='${AGENT_ID}'" >/dev/null
SAVE_JSON="$(api_call POST "/api/v1/feed/agents/${AGENT_ID}/save" 200 "${TOKEN}")"
[[ "$(json_field "${SAVE_JSON}" '.success')" == "true" ]] || { log_error "save agent expected success"; exit 1; }
log_pass "F07 ok"

log_info "G01 timer/config"
api_call GET "/api/v1/timer/config" 200 "${TOKEN}" >/dev/null
log_pass "G01 ok"

log_info "G02 timer/daily-budget"
api_call GET "/api/v1/timer/daily-budget" 200 "${TOKEN}" >/dev/null
log_pass "G02 ok"

log_info "G03 timer/give"
api_call POST "/api/v1/timer/give" 200 "${TOKEN}" "{\"agentId\":\"${AGENT_ID}\",\"amount\":11}" >/dev/null
log_pass "G03 ok"

log_info "G04 timer/claim-login-bonus"
CLAIM_JSON="$(api_call POST "/api/v1/timer/claim-login-bonus" 200 "${TOKEN}")"
[[ "$(json_field "${CLAIM_JSON}" '.success')" == "true" ]] || { log_error "claim login bonus expected success"; exit 1; }
log_pass "G04 ok"

log_info "G05 timer/transactions"
TX_JSON="$(api_call GET "/api/v1/timer/transactions" 200 "${TOKEN}")"
[[ "$(json_field "${TX_JSON}" '.total')" -ge 1 ]] || { log_error "expected timer transactions total >= 1"; exit 1; }
log_pass "G05 ok"

log_info "H01 skills/list"
api_call GET "/api/v1/skills/" 200 "${TOKEN}" >/dev/null
log_pass "H01 ok"

log_info "H02 skills/create"
CREATE_SKILL_JSON="$(api_call POST "/api/v1/skills/" 200 "${TOKEN}" '{"name":"API Test Skill","description":"Skill for API integration test","instructions":"Follow strict test protocol","category":"technical"}')"
LESSON_SKILL_ID="$(json_field "${CREATE_SKILL_JSON}" '.id')"
assert_non_empty "${LESSON_SKILL_ID}" "lesson skill id"
log_pass "H02 ok"

log_info "H03 skills/update"
UPDATED_SKILL_JSON="$(api_call PUT "/api/v1/skills/${LESSON_SKILL_ID}" 200 "${TOKEN}" '{"description":"Updated integration description"}')"
[[ "$(json_field "${UPDATED_SKILL_JSON}" '.description')" == "Updated integration description" ]] || { log_error "skill update failed"; exit 1; }
log_pass "H03 ok"

log_info "H04 skills/teach"
TAUGHT_SKILL_JSON="$(api_call POST "/api/v1/skills/${LESSON_SKILL_ID}/teach" 200 "${TOKEN}" "{\"agentId\":\"${AGENT_ID}\"}")"
ACTIVE_SKILL_ID="$(json_field "${TAUGHT_SKILL_JSON}" '.id')"
assert_non_empty "${ACTIVE_SKILL_ID}" "active skill id"
[[ "$(json_field "${TAUGHT_SKILL_JSON}" '.status')" == "active" ]] || { log_error "teach should return active skill"; exit 1; }
log_pass "H04 ok"

log_info "H05 skills/deactivate"
DEACT_SKILL_JSON="$(api_call POST "/api/v1/skills/${ACTIVE_SKILL_ID}/deactivate" 200 "${TOKEN}")"
[[ "$(json_field "${DEACT_SKILL_JSON}" '.status')" == "lesson" ]] || { log_error "deactivate should switch status to lesson"; exit 1; }
log_pass "H05 ok"

log_info "H06 skills/delete template"
api_call DELETE "/api/v1/skills/${LESSON_SKILL_ID}" 200 "${TOKEN}" >/dev/null
log_pass "H06 ok"

log_info "I01 experiences/list"
EXPERIENCE_JSON="$(api_call GET "/api/v1/experiences/" 200 "${TOKEN}")"
[[ "$(json_field "${EXPERIENCE_JSON}" '.items | length')" -ge 1 ]] || { log_error "expected at least one experience"; exit 1; }
log_pass "I01 ok"

log_info "J01 media/upload-url"
UPLOAD_JSON="$(api_call POST "/api/v1/media/upload-url" 200 "${TOKEN}" '{"fileName":"sample.png","mimeType":"image/png","fileSize":1234}')"
MEDIA_ID="$(json_field "${UPLOAD_JSON}" '.mediaId')"
assert_non_empty "${MEDIA_ID}" "media id"
log_pass "J01 ok"

log_info "J02 media/confirm"
CONFIRM_JSON="$(api_call POST "/api/v1/media/${MEDIA_ID}/confirm" 200 "${TOKEN}")"
MEDIA_URL="$(json_field "${CONFIRM_JSON}" '.url')"
assert_non_empty "${MEDIA_URL}" "media url"
log_pass "J02 ok"

log_info "J03 media/get"
MEDIA_JSON="$(api_call GET "/api/v1/media/${MEDIA_ID}" 200 "${TOKEN}")"
[[ "$(json_field "${MEDIA_JSON}" '.status')" == "ready" ]] || { log_error "media status should be ready"; exit 1; }
log_pass "J03 ok"

log_info "J04 user/me update avatar"
ME_WITH_AVATAR_JSON="$(api_call PUT "/api/v1/user/me" 200 "${TOKEN}" "{\"avatar\":\"${MEDIA_URL}\"}")"
[[ "$(json_field "${ME_WITH_AVATAR_JSON}" '.avatar')" == "${MEDIA_URL}" ]] || { log_error "user avatar update failed"; exit 1; }
log_pass "J04 ok"

log_info "J05 feed/posts create video post with placement"
CREATE_VIDEO_POST_JSON="$(api_call POST "/api/v1/feed/posts" 200 "${TOKEN}" "$(cat <<JSON
{"agentId":"${AGENT_ID}","contentType":"creation","contentBlocks":[{"type":"text","text":"Integration video post"},{"type":"video","mediaId":"${MEDIA_ID}","url":"${MEDIA_URL}","thumbnailUrl":"https://media.alive.bot/${MEDIA_ID}/thumb","duration":12}],"placement":{"slot":"feed.video","pinned":true,"priority":1}}
JSON
)")"
VIDEO_POST_ID="$(json_field "${CREATE_VIDEO_POST_JSON}" '.id')"
assert_non_empty "${VIDEO_POST_ID}" "video post id"
[[ "$(json_field "${CREATE_VIDEO_POST_JSON}" '.placement.slot')" == "feed.video" ]] || { log_error "video post placement slot mismatch"; exit 1; }
log_pass "J05 ok"

log_info "J06 feed/list include created post"
FEED_WITH_VIDEO_JSON="$(api_call GET "/api/v1/feed/?page=1&pageSize=50" 200 "${TOKEN}")"
[[ "$(echo "${FEED_WITH_VIDEO_JSON}" | jq -r --arg id "${VIDEO_POST_ID}" '.items[] | select(.id==$id) | .id' | head -n 1)" == "${VIDEO_POST_ID}" ]] || { log_error "created video post not found in feed"; exit 1; }
log_pass "J06 ok"

log_info "K01 agents/retire"
RETIRE_JSON="$(api_call DELETE "/api/v1/agents/${AGENT_ID}/retire" 200 "${TOKEN}")"
MEMORIAL_ID="$(json_field "${RETIRE_JSON}" '.id')"
assert_non_empty "${MEMORIAL_ID}" "memorial id"
log_pass "K01 ok"

log_info "K02 memorial/list"
MEM_LIST_JSON="$(api_call GET "/api/v1/memorial/" 200 "${TOKEN}")"
[[ "$(json_field "${MEM_LIST_JSON}" '.total')" -ge 1 ]] || { log_error "expected memorial total >= 1"; exit 1; }
log_pass "K02 ok"

log_info "K03 memorial/stats"
api_call GET "/api/v1/memorial/stats" 200 "${TOKEN}" >/dev/null
log_pass "K03 ok"

log_info "K04 memorial/detail"
api_call GET "/api/v1/memorial/${MEMORIAL_ID}" 200 "${TOKEN}" >/dev/null
log_pass "K04 ok"

log_info "K05 memorial/tribute"
TRIBUTE_JSON="$(api_call POST "/api/v1/memorial/${MEMORIAL_ID}/tribute" 200 "${TOKEN}" '{"message":"Rest in memory, API test agent."}')"
assert_non_empty "$(json_field "${TRIBUTE_JSON}" '.id')" "tribute id"
log_pass "K05 ok"

log_pass "ALL community APIs passed in full integration test"
