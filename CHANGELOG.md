# Changelog

## Unreleased

### Added

- **`perceive <target>`** — enriched accessibility tree with inline visual layout annotations. Combines summary metadata (title, URL, viewport, scroll position, interactive element counts, console health) with the compact AX tree, where landmark/structural nodes are annotated with height, background color, font size, display mode, and viewport visibility (↑above fold / ↓below fold). Gives agents complete page understanding in ~200-400 tokens without any screenshots.
- **`elshot <target> <selector>`** — element-level screenshot: scrolls the element into view, clips capture to its bounding box with 8px padding. Eliminates wrong-scroll-position and DPR-conversion errors that plague viewport screenshots.
- **Perceive-first observation strategy** in SKILL.md — three-tier model (perceive → elshot → scanshot) that guides agents to use structured text as the primary page understanding mechanism, with screenshots as secondary verification.
- **CLAUDE.md** — project overview, architecture diagram, coding conventions, and problem-solving principles for LLM agent context.

### Previous

- **`scanshot <target>`** — segmented full-page capture: scrolls through the page taking viewport-sized screenshots with 10% overlap. Each segment is full-resolution and readable by AI vision, unlike `fullshot` which produces a single tiny image on long pages.

### Previous (merged fork)

Merged local enhancements with upstream v1.0.2 changes.

### New commands (from local fork)

- **`status <target>`** — primary debug entry point: shows URL, title, buffered console errors and exceptions since last check
- **`console <target> [--all|--errors]`** — query the console buffer (default: unread only)
- **`summary <target>`** — token-efficient page overview (~100 tokens): interactive element counts, scroll position, console health
- **`fullshot <target> [file]`** — full-page screenshot capturing content beyond the viewport
- **`press <target> <key>`** — press keyboard key (Enter, Tab, Escape, Backspace, Space, Arrow*)
- **`scroll <target> <dir|x,y> [px]`** — scroll page by direction or coordinates (default 500px)
- **`hover <target> <selector>`** — hover over element, triggering :hover styles and tooltips
- **`waitfor <target> <selector> [ms]`** — wait for element to appear (default 10s, max 30s)
- **`fill <target> <selector> <text>`** — clear field + type text (form filling)
- **`select <target> <selector> <value>`** — select dropdown option by value
- **`styles <target> <selector>`** — computed styles filtered to meaningful properties
- **`cookies <target>`** — list cookies for the current page
- **`snap --full`** — option for complete AX tree (compact is now default)

### New infrastructure (from local fork)

- **Background observation**: `RingBuffer`-based console, exception, and navigation buffering in the daemon — events are captured even when no command is running
- **Enhanced click**: `click` and `loadall` now use CDP `Input.dispatchMouseEvent` (mouseMoved → mousePressed → mouseReleased) instead of `el.click()`, matching real user interaction
- **Smart daemon reuse**: `list` command reuses an existing daemon socket when available, avoiding unnecessary "Allow debugging" prompts
- **Smart target resolution**: commands check running daemon sockets before falling back to pages cache
- **`listDaemonSockets()`**: discovers running daemons from filesystem (Unix) or pages cache (Windows)
- **SKILL.md**: added WSL2 → Windows Browser instructions, Chinese trigger phrases, workflow patterns (debugging, form automation, visual bug investigation)
- **`edge://` filtering**: `getPages()` now filters out `edge://` internal pages (in addition to `chrome://`)

### Merged from upstream v1.0.2

- **Flatpak browser paths**: Linux Flatpak installations (Chromium, Chrome, Brave, Edge, Vivaldi) are now discovered automatically
- **`CDP_HOST` env var**: connect to Chrome on a non-localhost host (e.g., Docker containers, remote machines)
- **`LOCALAPPDATA` for RUNTIME_DIR**: on Windows, daemon sockets and cache go to `%LOCALAPPDATA%\cdp` instead of `~/.cache/cdp`
- **`IS_WINDOWS` constant**: consolidated platform checks into a single constant
- **Daemon `server.on('error')` handler**: daemon reports listen failures with a clear error message instead of silently crashing
- **`open` cache refresh**: new tabs created via `open` are immediately reflected in the pages cache

## v1.0.2 (upstream)

- Windows/WSL: use LOCALAPPDATA, CDP_HOST, add daemon error handler

## v1.0.1 (upstream)

- Linux Flatpak browser path discovery
- MIT LICENSE file added

## v1.0.0 (upstream)

- Initial release: list, snap, eval, shot, html, nav, net, click, clickxy, type, loadall, evalraw, open, stop
