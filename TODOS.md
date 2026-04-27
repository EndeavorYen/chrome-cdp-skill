# TODOs

## Shipped (3y-Mud feedback slice — 2026-04)

- [x] **`spawn-debug-browser` / `spawn`** — launch isolated debug profile (macOS/Edge/Chrome/Brave) without touching the user's main profile.
- [x] **Stale `@ref` errors** are classified — `daemon-start`, `navigation`, `dom-mutation` get distinct, actionable messages instead of a flat "Unknown ref".
- [x] **Single-character `press`** — letters, digits, and common punctuation now work; uppercase carries a Shift modifier.
- [x] **`perceive` viewport coordinates** — header explicitly states "viewport CSS px"; fixed/sticky elements get a `, fixed`/`, sticky` tag so agents stop chasing negative document Ys.
- [x] **`text` fallback chain** — comma-separated selector list is tried in order; `text --auto` extracts main content while excluding nav/aside/footer noise; `--exclude` adds custom strippers.
- [x] **`shot --quiet` / `--verbose`** — saved path is now the first stdout line by default; quiet drops all hint output; verbose retains the long DPR coordinate-mapping tutorial.
- [x] **`waitfor --any-of`** — wait for the first matching alternative (`勝利|敗北|逃跑成功`) within `--scope`.
- [x] **`waitfor --selector-stable`** — wait until a selector's text stops changing for `stableMs` (combat/animation settle).
- [x] **`dismiss-modal`** — clicks visible close buttons inside `[role=dialog]/dialog/[aria-modal=true]`, falls back to Escape; avoids the bare `press Space` foot-gun.
- [x] **`perceive --keep-refs` / `--last N`** — preserve interactive ref lines and trim long static-text logs (event-log pages no longer hide the input ref).
- [x] **`list` shows `about:blank`** — labelled `(blank tab)` so agents always have a usable target prefix.
- [x] **Daemon crash hint** — "Connection closed before response" now points at the runtime dir for stale sockets and recommends re-running `perceive` to restart.
- [x] **Lint** — fixed `no-useless-escape` regressions in record's mutation observer.

## Backlog

### Feature Roadmap (medium effort)

- [ ] `perceive --since-action` — diff from the last mutating action timestamp instead of the last manual `perceive`. Priority: P1.
- [ ] `record-actions` / `replay` — capture user manual actions for deterministic replay. Priority: P1.
- [ ] `checkpoint` / `restore` — save/restore page state (cookies, localStorage, URL) for stateful testing. Priority: P1.
- [ ] `mock` / `throttle` / `clock` — request fixtures, network throttling, and `Date.now()` control. Priority: P2.
- [ ] `summary --schema=json` — structured perceive output for LLM tool-calling. Priority: P2.
- [ ] `tab-group` / `broadcast` — multi-tab coordination. Priority: P2.
- [ ] `diff-shot` — visual regression diff between baseline + current. Priority: P2.
- [ ] `frame` — cross-origin iframe listing and observation. Priority: P1.
- [ ] `components` — React/Vue component tree + state inspection. Priority: P2.
- [ ] `emulate` — dark/light mode emulation. Priority: P2.

### Polish backlog

- [ ] Token-aware `perceive` truncation that scores nodes by interactivity and recency.
- [ ] `eval --raw` flag to bypass the auto-`JSON.stringify` of object results.
- [ ] Per-target daemon log file at `<runtime-dir>/cdp-<target>.log` for post-mortem.
- [ ] Session screenshot directory + `cdp report <session>` command.

## Distribution & Visibility

- [ ] **Research and submit to awesome-lists** — Find relevant awesome-lists (awesome-claude-code, awesome-browser-automation, etc.) and submit PRs. Check if a Claude Code plugin directory exists. Priority: P2. Depends on: README rewrite complete.
