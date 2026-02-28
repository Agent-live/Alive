# ALIVE AliveAgent Skills Support List

Generated: 2026-02-14T20:13:24.101921Z

Support tiers (current dockerized AliveAgent gateway):
- A: Prompt-only (no extra binaries detected in SKILL.md frontmatter)
- B: Likely needs additional binaries / env / API keys inside the AliveAgent container
- C: Likely not supported in Linux container (macOS-only integrations)

Total bundled skills scanned: 52

## Tier A (10)
| slug | description | notes |
|---|---|---|
| `bluebubbles` | Use when you need to send or manage iMessages via BlueBubbles (recommended iMessage integration). Calls go through the generic message to... |  |
| `canvas` |  |  |
| `coding-agent` | Run Codex CLI, Claude Code, OpenCode, or Pi Coding Agent via background process for programmatic control. |  |
| `discord` | Use when you need to control Discord from AliveAgent via the discord tool: send messages, react, post or upload stickers, upload emojis, ru... |  |
| `healthcheck` | Host security hardening and risk-tolerance configuration for AliveAgent deployments. Use when a user asks for security audits, firewall/SSH... |  |
| `notion` | Notion API for creating and managing pages, databases, and blocks. |  |
| `sherpa-onnx-tts` | Local text-to-speech via sherpa-onnx (offline, no cloud) |  |
| `skill-creator` | Create or update AgentSkills. Use when designing, structuring, or packaging skills with scripts, references, and assets. |  |
| `slack` | Use when you need to control Slack from AliveAgent via the slack tool, including reacting to messages or pinning/unpinning items in Slack c... |  |
| `voice-call` | Start voice calls via the AliveAgent voice-call plugin. |  |

## Tier B (37)
| slug | description | notes |
|---|---|---|
| `1password` | Set up and use 1Password CLI (op). Use when installing the CLI, enabling desktop app integration, signing in (single or multi-account), o... | needs binaries: op |
| `blogwatcher` | Monitor blogs and RSS/Atom feeds for updates using the blogwatcher CLI. | needs binaries: blogwatcher |
| `blucli` | BluOS CLI (blu) for discovery, playback, grouping, and volume. | needs binaries: blu |
| `camsnap` | Capture frames or clips from RTSP/ONVIF cameras. | needs binaries: camsnap |
| `clawhub` | Use the ClawHub CLI to search, install, update, and publish agent skills from clawhub.com. Use when you need to fetch new skills on the f... | needs binaries: clawhub |
| `eightctl` | Control Eight Sleep pods (status, temperature, alarms, schedules). | needs binaries: eightctl |
| `food-order` | Reorder Foodora orders + track ETA/status with ordercli. Never confirm without explicit user approval. Triggers: order food, reorder, tra... | needs binaries: ordercli |
| `gemini` | Gemini CLI for one-shot Q&A, summaries, and generation. | needs binaries: gemini |
| `gifgrep` | Search GIF providers with CLI/TUI, download results, and extract stills/sheets. | needs binaries: gifgrep |
| `github` | Interact with GitHub using the `gh` CLI. Use `gh issue`, `gh pr`, `gh run`, and `gh api` for issues, PRs, CI runs, and advanced queries. | needs binaries: gh |
| `gog` | Google Workspace CLI for Gmail, Calendar, Drive, Contacts, Sheets, and Docs. | needs binaries: gog |
| `goplaces` | Query Google Places API (New) via the goplaces CLI for text search, place details, resolve, and reviews. Use for human-friendly place loo... | needs binaries: goplaces |
| `himalaya` | CLI to manage emails via IMAP/SMTP. Use `himalaya` to list, read, write, reply, forward, search, and organize emails from the terminal. S... | needs binaries: himalaya |
| `local-places` | Search for places (restaurants, cafes, etc.) via Google Places API proxy on localhost. | needs binaries: uv |
| `mcporter` | Use the mcporter CLI to list, configure, auth, and call MCP servers/tools directly (HTTP or stdio), including ad-hoc servers, config edit... | needs binaries: mcporter |
| `model-usage` | Use CodexBar CLI local cost usage to summarize per-model usage for Codex or Claude, including the current (most recent) model or a full m... | needs binaries: codexbar |
| `nano-banana-pro` | Generate or edit images via Gemini 3 Pro Image (Nano Banana Pro). | needs binaries: uv |
| `nano-pdf` | Edit PDFs with natural-language instructions using the nano-pdf CLI. | needs binaries: nano-pdf |
| `obsidian` | Work with Obsidian vaults (plain Markdown notes) and automate via obsidian-cli. | needs binaries: obsidian-cli |
| `openai-image-gen` | Batch-generate images via OpenAI Images API. Random prompt sampler + `index.html` gallery. | needs binaries: python3 |
| `openai-whisper` | Local speech-to-text with the Whisper CLI (no API key). | needs binaries: whisper |
| `openai-whisper-api` | Transcribe audio via OpenAI Audio Transcriptions API (Whisper). | needs binaries: curl |
| `openhue` | Control Philips Hue lights/scenes via the OpenHue CLI. | needs binaries: openhue |
| `oracle` | Best practices for using the oracle CLI (prompt + file bundling, engines, sessions, and file attachment patterns). | needs binaries: oracle |
| `ordercli` | Foodora-only CLI for checking past orders and active order status (Deliveroo WIP). | needs binaries: ordercli |
| `peekaboo` | Capture and automate macOS UI with the Peekaboo CLI. | needs binaries: peekaboo |
| `sag` | ElevenLabs text-to-speech with mac-style say UX. | needs binaries: sag |
| `session-logs` | Search and analyze your own session logs (older/parent conversations) using jq. | needs binaries: jq, rg |
| `songsee` | Generate spectrograms and feature-panel visualizations from audio with the songsee CLI. | needs binaries: songsee |
| `sonoscli` | Control Sonos speakers (discover/status/play/volume/group). | needs binaries: sonos |
| `spotify-player` | Terminal Spotify playback/search via spogo (preferred) or spotify_player. | needs binaries: spogo |
| `summarize` | Summarize or extract text/transcripts from URLs, podcasts, and local files (great fallback for “transcribe this YouTube/video”). | needs binaries: summarize |
| `tmux` | Remote-control tmux sessions for interactive CLIs by sending keystrokes and scraping pane output. | needs binaries: tmux |
| `trello` | Manage Trello boards, lists, and cards via the Trello REST API. | needs binaries: jq |
| `video-frames` | Extract frames or short clips from videos using ffmpeg. | needs binaries: ffmpeg |
| `wacli` | Send WhatsApp messages to other people or search/sync WhatsApp history via the wacli CLI (not for normal user chats). | needs binaries: wacli |
| `weather` | Get current weather and forecasts (no API key required). | needs binaries: curl |

## Tier C (5)
| slug | description | notes |
|---|---|---|
| `apple-notes` | Manage Apple Notes via the `memo` CLI on macOS (create, view, edit, delete, search, move, and export notes). Use when a user asks AliveAgent... | macOS only |
| `apple-reminders` | Manage Apple Reminders via the `remindctl` CLI on macOS (list, add, edit, complete, delete). Supports lists, date filters, and JSON/plain... | macOS only |
| `bear-notes` | Create, search, and manage Bear notes via grizzly CLI. | macOS only |
| `imsg` | iMessage/SMS CLI for listing chats, history, watch, and sending. | macOS only |
| `things-mac` | Manage Things 3 via the `things` CLI on macOS (add/update projects+todos via URL scheme; read/search/list from the local Things database)... | macOS only |
