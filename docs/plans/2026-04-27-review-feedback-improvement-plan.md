# chrome-cdp-ex 3y-Mud Playtest Feedback Improvement Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Convert the real 3y-Mud `CHROME-CDP-EX-FEEDBACK.md` playtest feedback into a prioritized, test-driven repair plan for `chrome-cdp-ex`, improving long-session robustness without diluting its live-browser inspection focus.

**Architecture:** Keep the current zero-dependency, single-file CLI distribution (`skills/chrome-cdp-ex/scripts/cdp.mjs`) for this slice. Add small internal helpers, explicit state invalidation metadata, and focused command extensions. Treat `SKILL.md` and README as executable UX contracts: every recommendation must match what an autonomous agent can actually do on macOS/Edge/Vite long-session playtests.

**Tech Stack:** Node.js 22+ ESM, raw Chrome DevTools Protocol, Vitest, ESLint, Markdown docs, optional live CDP smoke with isolated Edge/Chrome profile.

---

## Verified Feedback Source

Read on 2026-04-27:

- `/Users/simon/Code/3y-Mud/CHROME-CDP-EX-FEEDBACK.md`
- Scenario: 15–20 minute 3y-Mud beginner playtest, ~50 `cdp` calls, macOS Darwin 25.3.0, Microsoft Edge 147.0.3912.86, local Vite dev server.
- Version used by reviewer: v2.3.0 from Claude plugin cache.

The earlier plan incorrectly assumed the feedback file was missing from `~/Code/chrome-cdp-ex`; it was actually in `~/Code/3y-Mud`. This amended plan supersedes the previous fallback-based plan.

---

## Priority Summary

### P0 — Must fix first

1. **Debug-browser startup path is too rigid on macOS/Edge**
   - Current SKILL says not to suggest `--remote-debugging-port`, but reviewer needed user permission to spawn an isolated debug profile.
   - Need skill docs and ideally a `spawn` / `spawn-debug-browser` helper.

2. **`@ref` stale/unknown failures are not actionable**
   - Error says only `Unknown ref: @31. Run "perceive" first.`
   - It does not distinguish never-created refs, DOM-mutation invalidation, navigation/HMR invalidation, or daemon restart.
   - Batch/loops can waste many round-trips after the first stale ref.

3. **`press` lacks single-character keys**
   - Blocks keyboard shortcut testing such as `c`, `i`, `u`, `k`, `m`, and numeric hotkeys.

4. **`perceive` coordinates are ambiguous after scroll/fixed UI**
   - Reviewer saw fixed sidebar button as `Y=-5789`, while visually visible.
   - Need viewport-coordinate clarity and fixed/sticky annotation.

5. **`text` lacks selector fallback / auto-main extraction**
   - Reviewer had to manually try `[role="region"][aria-label*="事件"]`, then `[class*=MainStage]`.
   - Need selector fallback chain and `--auto` main-content heuristic.

### P1 — Should fix in this slice if possible

6. **Batch/loop robustness around stale refs**
   - Encourage stable selectors in docs and optionally fail fast / retry once after ref invalidation.

7. **Screenshot DPR hint contaminates main output**
   - `shot` output begins with DPR guidance; scripts expecting saved path must filter noise.
   - Move hint to stderr or support `--quiet`.

8. **No modal-dismiss abstraction**
   - Reviewer used `press Space` to close MOTD and triggered underlying game shortcut.
   - Add `dismiss-modal` high-level helper or document safe modal-dismiss recipe.

9. **`perceive` truncation can hide refs**
   - Need `--keep-refs` and/or token-aware priority truncation.

10. **No high-level wait for changing game/animation state**
    - Add `waitfor --any-of` and `waitfor --selector-stable` before larger `wait-for-stable` family.

### P2 — Polish / backlog

11. `list` should include `about:blank` usable target prefixes.
12. Session-level screenshot organization/reporting.
13. `eval` result serialization guidance / `--raw` option.
14. Console level fidelity should preserve log/warn/error/debug.
15. Daemon crash should expose a log path and recovery hint.
16. `SKILL.md` needs a top TL;DR for the first five commands.
17. Docs need game/animation `record` examples, `@c` examples, `shot --annotate-fresh`, and Vite HMR ref invalidation guidance.

---

## Acceptance Criteria

1. `npm test` and `npm run lint` pass.
2. Every code behavior change has a focused Vitest test before/with implementation.
3. Live smoke, when a supported browser is available, exercises an isolated debug profile and verifies at least: `spawn`, `list`, `perceive`, `press c`, `text --auto`, `waitfor --any-of`, `waitfor --selector-stable`, `shot --quiet`, and stale-ref error wording.
4. README and `skills/chrome-cdp-ex/SKILL.md` include an honest macOS/Edge startup path: prefer existing remote-debugging toggle when available; with user consent, spawn an isolated debug profile using `--remote-debugging-port` and `--user-data-dir=/tmp/...`.
5. Stale-ref errors explain likely cause and recovery, not just `Unknown ref`.
6. `press` supports named keys plus single-character keys (`a-z`, `A-Z`, `0-9`, common punctuation if low-risk).
7. `perceive` clearly labels coordinate reference frame and fixed/sticky elements.
8. `text` supports fallback selectors and an `--auto` mode that avoids nav/sidebar noise.
9. `shot` machine-readable output starts with the saved path unless `--verbose` is requested.
10. The plan's implementation does not add heavyweight dependencies or replace Playwright; `chrome-cdp-ex` remains a live user-session agent tool.

---

## Task 0: Verify current baseline and version delta from feedback

**Objective:** Establish which feedback items are already fixed in `main` and which still need implementation.

**Files:**
- Read: `package.json`, `README.md`, `skills/chrome-cdp-ex/SKILL.md`, `skills/chrome-cdp-ex/scripts/cdp.mjs`, `tests/cdp.test.mjs`
- Read feedback: `/Users/simon/Code/3y-Mud/CHROME-CDP-EX-FEEDBACK.md`

**Step 1: Verify repo and tests**

```bash
cd /Users/simon/Code/chrome-cdp-ex
pwd
git remote -v
git branch --show-current
git status --short
npm test
npm run lint
```

Expected: repo is `EndeavorYen/chrome-cdp-ex`; branch is intended working branch; tests/lint pass before edits.

**Step 2: Map feedback to current implementation**

Search current implementation:

```bash
grep -n "function pressStr\|const KEY_MAP\|function waitForStr\|function textStr\|function shotStr\|function perceiveStr\|function formatPageList\|Runtime.consoleAPICalled\|Unknown ref" skills/chrome-cdp-ex/scripts/cdp.mjs
```

Record in commit notes which items are already fixed since v2.3.0. Do not implement duplicates.

**Step 3: Commit nothing**

This is a baseline discovery step only.

---

## Task 1: Fix macOS/Edge startup UX and add `spawn-debug-browser`

**Objective:** Make first-run setup actionable when no `DevToolsActivePort` and no `CDP_PORT` exist, without disturbing the user's normal browser profile.

**Files:**
- Modify: `skills/chrome-cdp-ex/scripts/cdp.mjs`
- Modify: `README.md`
- Modify: `skills/chrome-cdp-ex/SKILL.md`
- Test: `tests/cdp.test.mjs`

**Design:**

Add a no-target command:

```bash
spawn-debug-browser [edge|chrome|brave] [--port 9222] [--url URL] [--profile-dir DIR]
spawn [edge|chrome|brave] [--port 9222] [--url URL] [--profile-dir DIR]   # alias
```

Behavior:

- macOS: detect app paths:
  - `/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`
  - `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
  - `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`
- Launch with:
  - `--remote-debugging-port=<port>`
  - `--user-data-dir=<profile-dir>` default `/tmp/chrome-cdp-ex-<browser>-debug-profile-<port>`
  - `--no-first-run`
  - `--no-default-browser-check`
- Print a clear next command:

```text
Spawned Microsoft Edge debug profile on CDP_PORT=9222
Profile: /tmp/chrome-cdp-ex-edge-debug-profile-9222
Next: CDP_PORT=9222 node skills/chrome-cdp-ex/scripts/cdp.mjs list
```

**Step 1: Write tests for argument parsing and browser path planning**

Create pure helpers so tests do not launch real browsers:

```js
describe('parseSpawnDebugBrowserArgs', () => {
  it('defaults to edge on port 9222 with temp profile', () => {
    expect(parseSpawnDebugBrowserArgs([])).toMatchObject({ browser: 'edge', port: 9222 });
  });

  it('parses browser, port, url, and profile-dir', () => {
    expect(parseSpawnDebugBrowserArgs(['chrome', '--port', '9333', '--url', 'http://127.0.0.1:3000', '--profile-dir', '/tmp/p']))
      .toEqual({ browser: 'chrome', port: 9333, url: 'http://127.0.0.1:3000', profileDir: '/tmp/p' });
  });
});
```

Add tests for app path detection via injected `existsSync`.

**Step 2: Implement helpers and command registration**

- Add `spawn-debug-browser` / `spawn` to no-target commands.
- Do not add it to `NEEDS_TARGET`.
- Add USAGE / README / SKILL docs.

**Step 3: Verify**

```bash
npm test -- tests/cdp.test.mjs -t "spawn"
npm test
npm run lint
```

**Step 4: Commit**

```bash
git add skills/chrome-cdp-ex/scripts/cdp.mjs tests/cdp.test.mjs README.md skills/chrome-cdp-ex/SKILL.md
git commit -m "feat: add isolated debug browser spawn helper"
```

---

## Task 2: Add explicit ref lifecycle tracking and better stale-ref errors

**Objective:** Make `@ref` failures diagnosable and reduce wasted loops after DOM/navigation invalidates refs.

**Files:**
- Modify: `skills/chrome-cdp-ex/scripts/cdp.mjs`
- Test: `tests/cdp.test.mjs`
- Docs: `skills/chrome-cdp-ex/SKILL.md`, `README.md`

**Design:**

Track ref metadata in daemon:

```js
const refState = {
  generation: 0,
  lastPerceiveAt: 0,
  invalidatedAt: 0,
  invalidationReason: null, // 'dom-mutation' | 'navigation' | 'daemon-start' | null
};
```

- On successful `perceive`, increment generation, clear invalidation reason, store `lastPerceiveAt`.
- On `Page.frameNavigated`, set `invalidationReason='navigation'` and clear `refMap`.
- On substantial DOM mutation after an action/record/perceive baseline, set `invalidationReason='dom-mutation'` but avoid noisy invalidation for every tiny text node if it breaks too much.
- On daemon start, reason is `daemon-start` until first perceive.

Error wording helper:

```text
Unknown ref: @31. Current ref map is empty because the page navigated/reloaded after the last perceive. Run "perceive" to refresh refs, or use a stable CSS selector for long loops.
```

For never-created:

```text
Unknown ref: @31. No refs have been assigned in this daemon yet. Run "perceive" first, or use a CSS selector.
```

For DOM mutation:

```text
Unknown ref: @31. Refs were invalidated by DOM changes after the last perceive. Run "perceive" again, or use a stable CSS selector in batch/loops.
```

**Step 1: Write tests for pure error helper**

```js
describe('formatUnknownRefError', () => {
  it('explains never-created refs', () => {
    expect(formatUnknownRefError('@31', { generation: 0, invalidationReason: 'daemon-start' })).toMatch(/No refs have been assigned/);
  });

  it('explains navigation invalidation', () => {
    expect(formatUnknownRefError('@31', { generation: 2, invalidationReason: 'navigation' })).toMatch(/navigated|reloaded/);
  });

  it('explains DOM invalidation and suggests stable selectors', () => {
    const msg = formatUnknownRefError('@31', { generation: 2, invalidationReason: 'dom-mutation' });
    expect(msg).toMatch(/DOM changes/);
    expect(msg).toMatch(/stable CSS selector/);
  });
});
```

**Step 2: Thread `refState` through ref resolution**

Current helpers likely take `(cdp, sid, refMap, selector)`. Extend minimally:

```js
resolveRefNode(cdp, sid, refMap, selector, refState)
resolveRef(cdp, sid, refMap, selector, refState)
```

Do not break selector paths.

**Step 3: Invalidate on navigation**

In `Page.frameNavigated` handler, for top-level navigation:

```js
refMap.clear();
refState.invalidatedAt = Date.now();
refState.invalidationReason = 'navigation';
```

**Step 4: Optional one-shot retry for action commands**

For this slice, prefer fail-fast with strong message over magical retry. If implementing retry, scope it only to commands that also have a stable selector fallback; do not attempt to guess `@ref` identity after DOM rewrite.

**Step 5: Verify**

```bash
npm test -- tests/cdp.test.mjs -t "Unknown ref|refState|resolveRef"
npm test
npm run lint
```

**Step 6: Docs update**

Add guidance:

- Use `@ref` for immediate next action after `perceive`.
- Use stable CSS selectors for long `batch`/loops.
- Re-run `perceive` after navigation, Vite HMR, or large DOM mutation.

**Step 7: Commit**

```bash
git add skills/chrome-cdp-ex/scripts/cdp.mjs tests/cdp.test.mjs README.md skills/chrome-cdp-ex/SKILL.md
git commit -m "fix: explain stale ref failures"
```

---

## Task 3: Support single-character keys in `press`

**Objective:** Enable keyboard shortcut and hotkey testing.

**Files:**
- Modify: `skills/chrome-cdp-ex/scripts/cdp.mjs`
- Test: `tests/cdp.test.mjs`
- Docs: `README.md`, `skills/chrome-cdp-ex/SKILL.md`

**Step 1: Add tests**

```js
describe('keyForPress', () => {
  it('maps lowercase letters', () => {
    expect(keyForPress('c')).toEqual({ key: 'c', code: 'KeyC', keyCode: 67 });
  });

  it('maps uppercase letters preserving key', () => {
    expect(keyForPress('C')).toEqual({ key: 'C', code: 'KeyC', keyCode: 67, shift: true });
  });

  it('maps digits', () => {
    expect(keyForPress('1')).toEqual({ key: '1', code: 'Digit1', keyCode: 49 });
  });

  it('keeps named keys case-insensitive', () => {
    expect(keyForPress('Enter')).toEqual(KEY_MAP.enter);
  });
});
```

**Step 2: Implement `keyForPress`**

Use standard CDP `Input.dispatchKeyEvent` values. For uppercase letters, either set `modifiers: 8` for Shift or document that `press C` dispatches key `C` with `KeyC`.

**Step 3: Update `pressStr`**

Error should say:

```text
Supported: enter, tab, escape, backspace, delete, space, arrow*, single characters (a-z, A-Z, 0-9, punctuation). Use `type` for multi-character text.
```

**Step 4: Verify**

```bash
npm test -- tests/cdp.test.mjs -t "keyForPress|pressStr|KEY_MAP"
npm test
npm run lint
```

**Step 5: Commit**

```bash
git add skills/chrome-cdp-ex/scripts/cdp.mjs tests/cdp.test.mjs README.md skills/chrome-cdp-ex/SKILL.md
git commit -m "fix: support single-character key presses"
```

---

## Task 4: Clarify `perceive` coordinate semantics and fixed/sticky elements

**Objective:** Prevent agents from misreading visible fixed UI as off-screen after scroll.

**Files:**
- Modify: `skills/chrome-cdp-ex/scripts/cdp.mjs`
- Test: `tests/cdp.test.mjs`
- Docs: `README.md`, `skills/chrome-cdp-ex/SKILL.md`

**Design:**

- Treat displayed `@ref` coordinates as viewport `getBoundingClientRect()` coordinates.
- If current output can become document-relative through layout map logic, normalize it.
- Add `position` annotation for `fixed` / `sticky` elements:

```text
@14 (1543,259 266×52, fixed)
@8 (10,0 300×48, sticky)
```

- Add a header hint:

```text
Coords: viewport CSS px (use clickxy with these values)
```

**Step 1: Add test data for ref rect annotation**

Test a pure formatter if possible:

```js
describe('formatRefRect', () => {
  it('marks fixed elements', () => {
    expect(formatRefRect({ x: 1543, y: 259, w: 266, h: 52, position: 'fixed' }))
      .toBe('(1543,259 266×52, fixed)');
  });
});
```

**Step 2: Include `position` in rect resolution**

Change `Runtime.callFunctionOn` for ref rects to return:

```js
const cs = getComputedStyle(this);
return { x, y, w, h, position: cs.position };
```

Only display `position` when `fixed` or `sticky`.

**Step 3: Verify**

```bash
npm test -- tests/cdp.test.mjs -t "perceiveStr|formatRefRect|buildPerceiveTree"
npm test
npm run lint
```

**Step 4: Docs update**

Add note: coordinates are viewport CSS pixels, same coordinate system as `clickxy`; screenshot pixels may differ by DPR.

**Step 5: Commit**

```bash
git add skills/chrome-cdp-ex/scripts/cdp.mjs tests/cdp.test.mjs README.md skills/chrome-cdp-ex/SKILL.md
git commit -m "fix: clarify perceive viewport coordinates"
```

---

## Task 5: Add `text` selector fallback chain and `--auto`

**Objective:** Make content extraction work across pages without repeated selector guessing.

**Files:**
- Modify: `skills/chrome-cdp-ex/scripts/cdp.mjs`
- Test: `tests/cdp.test.mjs`
- Docs: `README.md`, `skills/chrome-cdp-ex/SKILL.md`

**Design:**

Supported forms:

```bash
text <target>                         # existing full-page text
text <target> <selector>              # existing scoped text
text <target> "main, [role=main], #app .main"  # fallback selector chain
text <target> --auto                  # heuristic main content extraction
text <target> --auto --exclude "nav,aside,.sidebar"
```

Important: a CSS comma list currently means “query all matching selectors.” The requested behavior is fallback chain. To avoid breaking CSS semantics, choose explicit flag:

```bash
text <target> --first "[role='region'][aria-label*='事件']" "[class*=MainStage]" "main"
```

But reviewer explicitly suggested `"main, [role=main], #app .main"`. Implementing comma fallback is acceptable if documented. Preserve old single selector behavior when selector contains comma but first matching element is fine.

**Step 1: Write tests for parser**

```js
describe('parseTextArgs', () => {
  it('parses comma fallback selectors', () => {
    expect(parseTextArgs(['main, [role=main], #app .main']).selectors).toEqual(['main', '[role=main]', '#app .main']);
  });

  it('parses --auto', () => {
    expect(parseTextArgs(['--auto']).auto).toBe(true);
  });
});
```

**Step 2: Write tests for extraction JS behavior with mocked eval**

Mock `evalStr` result or extract pure JS builder `textPageScript(opts)` and assert it contains:

- exclusion of `script, style, svg, nav, aside`;
- candidates `main`, `[role=main]`, `article`, `#root`, `body`;
- fallback selector loop.

**Step 3: Implement**

- `parseTextArgs(args)`
- `textStr(cdp, sid, args)` or preserve signature with options.
- If no selector found in fallback, return actionable error listing tried selectors.

**Step 4: Verify**

```bash
npm test -- tests/cdp.test.mjs -t "textStr|parseTextArgs"
npm test
npm run lint
```

**Step 5: Docs update**

Add examples from feedback:

```bash
text <t> --auto
text <t> "[role='region'][aria-label*='事件'], [class*=MainStage], main"
```

**Step 6: Commit**

```bash
git add skills/chrome-cdp-ex/scripts/cdp.mjs tests/cdp.test.mjs README.md skills/chrome-cdp-ex/SKILL.md
git commit -m "feat: add text fallback extraction"
```

---

## Task 6: Make `shot` output script-friendly

**Objective:** Keep human DPR guidance without polluting the primary saved-path output.

**Files:**
- Modify: `skills/chrome-cdp-ex/scripts/cdp.mjs`
- Test: `tests/cdp.test.mjs`
- Docs: `README.md`, `skills/chrome-cdp-ex/SKILL.md`

**Design:**

- Default stdout first line must be the saved path.
- DPR guidance appears only after saved path, or through stderr if easy in CLI path, or behind `--verbose`.
- Add `--quiet` to suppress hints:

```bash
shot <target> /tmp/a.png --quiet
```

**Step 1: Add tests for output ordering**

```js
it('shot output starts with the saved path', async () => {
  const out = await shotStr(fakeCdp, 'sid', '/tmp/a.png', 'target', { quiet: false });
  expect(out.split('\n')[0]).toBe('/tmp/a.png');
});
```

**Step 2: Implement argument parsing**

Update `handleCommand` for `shot` to parse flags rather than passing only `args[0]`.

**Step 3: Verify**

```bash
npm test -- tests/cdp.test.mjs -t "shotStr|screenshot"
npm test
npm run lint
```

**Step 4: Commit**

```bash
git add skills/chrome-cdp-ex/scripts/cdp.mjs tests/cdp.test.mjs README.md skills/chrome-cdp-ex/SKILL.md
git commit -m "fix: make screenshot output script friendly"
```

---

## Task 7: Add long-session wait primitives: `waitfor --any-of` and `--selector-stable`

**Objective:** Replace brittle `sleep 25` playtest waits with semantic waits for combat/animation/log stabilization.

**Files:**
- Modify: `skills/chrome-cdp-ex/scripts/cdp.mjs`
- Test: `tests/cdp.test.mjs`
- Docs: `README.md`, `skills/chrome-cdp-ex/SKILL.md`

**Supported forms:**

```bash
waitfor <target> --any-of "戰鬥勝利|戰敗|逃跑成功" [timeoutMs] [--scope selector]
waitfor <target> --selector-stable ".combat-log" [stableMs=3000] [timeoutMs=30000]
```

**Step 1: Parser tests**

```js
describe('parseWaitForArgs', () => {
  it('parses any-of pattern and timeout', () => {
    expect(parseWaitForArgs(['--any-of', '勝利|敗北|逃跑成功', '60000'])).toMatchObject({ mode: 'any-of', pattern: '勝利|敗北|逃跑成功', timeoutMs: 60000 });
  });

  it('parses selector-stable', () => {
    expect(parseWaitForArgs(['--selector-stable', '.combat-log', '3000', '60000'])).toMatchObject({ mode: 'selector-stable', selector: '.combat-log', stableMs: 3000, timeoutMs: 60000 });
  });
});
```

**Step 2: Implement `--any-of`**

Use page text from scope or body and regex split by `|`:

- Escape plain terms unless user explicitly opts into regex later.
- Return matched term and snippet.

**Step 3: Implement `--selector-stable`**

Poll `el.innerText || el.textContent` hash/string. When unchanged for `stableMs`, return.

**Step 4: Verify**

```bash
npm test -- tests/cdp.test.mjs -t "waitForStr|parseWaitForArgs|selector-stable|any-of"
npm test
npm run lint
```

**Step 5: Docs update with game example**

```bash
record <t> --action click @5 --until "dom stable"
waitfor <t> --any-of "戰鬥勝利|戰敗|逃跑成功" 60000 --scope ".combat-log"
waitfor <t> --selector-stable ".combat-log" 3000 60000
```

**Step 6: Commit**

```bash
git add skills/chrome-cdp-ex/scripts/cdp.mjs tests/cdp.test.mjs README.md skills/chrome-cdp-ex/SKILL.md
git commit -m "feat: add semantic waitfor modes"
```

---

## Task 8: Add `dismiss-modal` safe high-level action

**Objective:** Close common modals without accidentally triggering underlying page shortcuts.

**Files:**
- Modify: `skills/chrome-cdp-ex/scripts/cdp.mjs`
- Test: `tests/cdp.test.mjs`
- Docs: `README.md`, `skills/chrome-cdp-ex/SKILL.md`

**Design:**

Command:

```bash
dismiss-modal <target>
```

Strategy order:

1. Try click on visible close buttons inside `[role=dialog], dialog, [aria-modal=true]`:
   - `[aria-label*=close i]`, `[aria-label*=關閉]`, `button:has-text` is not native CSS, so use JS text matching for `關閉`, `Close`, `×`, `OK`, `確認`, `繼續`.
2. Try `Escape`.
3. Try a synthetic key event targeted only at the dialog root with stop propagation? CDP cannot directly set `stopPropagation` on real key events, so avoid promising full isolation unless implemented via page-side JS dispatch.
4. Return clear status and what worked.

Do **not** default to `Space`; the feedback shows why.

**Step 1: Tests**

Add pure JS selector/text matching helper tests if possible.

**Step 2: Implement command**

Add to `handleCommand`, `NEEDS_TARGET`, `USAGE`, README, SKILL.

**Step 3: Verify**

```bash
npm test -- tests/cdp.test.mjs -t "dismiss-modal|modal"
npm test
npm run lint
```

**Step 4: Commit**

```bash
git add skills/chrome-cdp-ex/scripts/cdp.mjs tests/cdp.test.mjs README.md skills/chrome-cdp-ex/SKILL.md
git commit -m "feat: add safe modal dismissal command"
```

---

## Task 9: Improve `perceive` truncation controls

**Objective:** Prevent important `@ref` lines from disappearing in long event-log pages.

**Files:**
- Modify: `skills/chrome-cdp-ex/scripts/cdp.mjs`
- Test: `tests/cdp.test.mjs`
- Docs: `README.md`, `skills/chrome-cdp-ex/SKILL.md`

**Supported forms:**

```bash
perceive <target> --keep-refs
perceive <target> --last 20
```

**Design:**

- `--keep-refs`: when truncating, preserve all interactive/ref lines and summarize omitted static text blocks.
- `--last N`: for large text/event-log areas, include only the last N static/text rows per overflowing subtree. Keep simple for this slice; do not build a full token-budget optimizer yet.

**Step 1: Parser tests**

Extend `parsePerceiveArgs` tests for `--keep-refs` and `--last`.

**Step 2: BuildPerceiveTree tests**

Add a tree with 100 StaticText nodes and one textbox/button near the end; assert `--keep-refs` preserves ref lines.

**Step 3: Implement minimal truncation policy**

Prefer a conservative implementation over a complex token estimator.

**Step 4: Verify**

```bash
npm test -- tests/cdp.test.mjs -t "parsePerceiveArgs|keep-refs|last"
npm test
npm run lint
```

**Step 5: Commit**

```bash
git add skills/chrome-cdp-ex/scripts/cdp.mjs tests/cdp.test.mjs README.md skills/chrome-cdp-ex/SKILL.md
git commit -m "feat: add perceive ref-preserving truncation"
```

---

## Task 10: Fix P2 output fidelity and lifecycle polish

**Objective:** Pick off cheap reliability/polish items from the 5-minute bucket.

**Files:**
- Modify: `skills/chrome-cdp-ex/scripts/cdp.mjs`
- Test: `tests/cdp.test.mjs`
- Docs if needed: `README.md`, `skills/chrome-cdp-ex/SKILL.md`

### 10A: `list` should show `about:blank`

Tests:

```js
it('formatPageList includes about:blank as a usable blank tab', () => {
  const out = formatPageList([{ id: 'ABCDEF123456', type: 'page', title: '', url: 'about:blank' }]);
  expect(out).toContain('ABCDEF12');
  expect(out).toContain('(blank tab)');
});
```

Implementation: do not filter `about:blank` page targets; label them.

### 10B: Console level fidelity

Verify current `Runtime.consoleAPICalled` maps `params.type` faithfully. If existing behavior is correct, add regression tests and document that app-side `console.error` remains `[error]` by design. If broken, fix.

### 10C: Eval serialization guidance

Current `evalStr` appears to JSON.stringify object results. Verify with tests. If already fixed, update docs with examples:

```bash
eval <t> "({ title: document.title, url: location.href })"
eval <t> "Array.from(document.querySelectorAll('button')).map(b => b.innerText)"
```

### 10D: Daemon crash hint/log path

When socket closes before response, improve client error:

```text
Connection closed before response. The daemon for <target> may have crashed or exited. Re-run `perceive` to restart it; check <runtime-dir>/cdp-<target>.log if present.
```

If adding daemon logs, redirect daemon stderr to a per-target log file instead of `stdio: 'ignore'`.

**Commit:**

```bash
git add skills/chrome-cdp-ex/scripts/cdp.mjs tests/cdp.test.mjs README.md skills/chrome-cdp-ex/SKILL.md
git commit -m "fix: polish list console eval and daemon diagnostics"
```

---

## Task 11: Rewrite docs for first-use and long-session agent workflows

**Objective:** Make SKILL.md easier for agents to follow and align docs with real playtest needs.

**Files:**
- Modify: `skills/chrome-cdp-ex/SKILL.md`
- Modify: `README.md`
- Modify: `TODOS.md`
- Modify: `DESIGN.md`

**Required SKILL.md top section:**

```md
## TL;DR — 90% workflow

1. `cdp list` — discover tabs; if no CDP is available, run `cdp doctor` then either toggle browser remote debugging or, with user consent, `cdp spawn-debug-browser edge --port 9222 --url <url>`.
2. `cdp perceive <target> -C -d 8` — observe structure, refs, viewport CSS coordinates, console health.
3. `cdp click|fill|press <target> @ref|selector` — interact; use `@ref` for immediate next action, stable selectors for long loops.
4. `cdp text <target> --auto` or `text <target> "sel1, sel2, main"` — extract content.
5. `cdp shot <target> --annotate` / `elshot` — visual evidence when text/layout is insufficient.
```

**Required recipes:**

- macOS/Edge first-run: existing session vs isolated debug profile.
- Long game/animation session:
  - `waitfor --any-of`
  - `waitfor --selector-stable`
  - `record` timeline example for combat/logs.
- `@ref` lifecycle and stable selector guidance.
- `@c` / `-C` hidden clickable discovery example.
- Screenshot workflow and `shot --quiet` / `--annotate` / future `--annotate-fresh` note.
- Vite HMR: page reload invalidates refs; re-run `perceive`.

**TODOS/DESIGN cleanup:**

- Mark shipped features as shipped.
- Move wishlist items into realistic buckets:
  - Cheap: single-char `press`, list about:blank, console fidelity, DPR quiet, TL;DR.
  - Medium: stale-ref lifecycle, text fallback, fixed/sticky coords, spawn helper, waitfor modes.
  - Larger: checkpoint/restore, record-actions/replay, session screenshots, mock/throttle/clock, structured JSON summary.

**Verify docs:**

```bash
grep -R "do NOT suggest restarting Chrome" -n README.md skills/chrome-cdp-ex/SKILL.md || true
grep -R "TL;DR" -n skills/chrome-cdp-ex/SKILL.md README.md
grep -R "waitfor --any-of\|selector-stable\|spawn-debug-browser" -n README.md skills/chrome-cdp-ex/SKILL.md
```

**Commit:**

```bash
git add README.md skills/chrome-cdp-ex/SKILL.md TODOS.md DESIGN.md
git commit -m "docs: add long-session agent workflow guidance"
```

---

## Task 12: Add deterministic live CDP smoke for 3y-Mud-like workflows

**Objective:** Prevent regressions in exactly the scenario that produced the feedback: Vite app, long page, modal, fixed sidebar, keyboard shortcuts, logs, screenshots, and semantic waits.

**Files:**
- Create: `scripts/smoke-page.html`
- Create: `scripts/live-smoke.mjs`
- Modify: `package.json` scripts if desired
- Modify: `CONTRIBUTING.md`

**Smoke page must include:**

- Long scrollable event log with 100+ messages.
- Fixed right sidebar button with keyboard shortcut `(C)`.
- Modal that says “press any key” and a background shortcut that should not fire when using `dismiss-modal`.
- Input placeholder for command text.
- Buttons that mutate DOM and append combat outcomes (`戰鬥勝利`, `戰敗`, `逃跑成功`).
- A custom clickable `div` discoverable via `-C`.
- Styles with `position: fixed` / `sticky` for coordinate annotation.

**Smoke script should:**

1. Start local static server.
2. Spawn isolated debug browser via new `spawn-debug-browser` if possible, or launch directly as fallback.
3. Run commands:
   - `doctor`
   - `list`
   - `perceive -C -d 8 --keep-refs`
   - `press c`
   - `text --auto`
   - `text "[role='region'][aria-label*='事件'], [class*=MainStage], main"`
   - `waitfor --any-of "戰鬥勝利|戰敗|逃跑成功" 10000`
   - `waitfor --selector-stable "#combat-log" 500 5000`
   - `dismiss-modal`
   - `shot /tmp/chrome-cdp-ex-smoke.png --quiet`
4. Assert output snippets and print PASS/FAIL.
5. Clean up only temporary browser/server/profile.

**Verification:**

```bash
npm test
npm run lint
node scripts/live-smoke.mjs
```

**Commit:**

```bash
git add scripts/smoke-page.html scripts/live-smoke.mjs package.json CONTRIBUTING.md
git commit -m "test: add long-session live CDP smoke"
```

---

## Task 13: Final verification, changelog, and push

**Objective:** Ensure repair slice is coherent and ready for release.

**Files:**
- Modify if needed: `CHANGELOG.md`, `package.json`, `.claude-plugin/plugin.json`

**Step 1: Full verification**

```bash
npm test
npm run lint
node scripts/live-smoke.mjs
```

If live smoke skips due to no browser, record the skip reason. Do not claim live browser verification if it skipped.

**Step 2: Inspect diff and history**

```bash
git status --short
git log --oneline -12
git diff --stat origin/main...HEAD
```

**Step 3: Release metadata**

If repo uses conventional commits/auto-release, leave version bump to automation unless established convention says otherwise. Otherwise bump patch/minor according to scope:

- `feat:` commands (`spawn-debug-browser`, `waitfor` modes, `dismiss-modal`) likely warrant minor.
- Pure fixes only warrant patch.

**Step 4: Push**

```bash
git push origin main
```

---

## Suggested Implementation Order

1. Baseline audit and docs correction for actual feedback file.
2. `press` single-character keys — cheap, high impact.
3. Ref lifecycle / stale-ref errors — highest robustness leverage.
4. `text` fallback and `--auto` — high daily utility.
5. `waitfor --any-of` / `--selector-stable` — solves long combat/session sleeps.
6. `perceive` fixed/sticky coordinate labels and `--keep-refs`.
7. `shot --quiet` and output ordering.
8. `spawn-debug-browser` macOS/Edge helper.
9. `dismiss-modal`.
10. P2 polish: `about:blank`, console fidelity tests, eval docs, daemon crash hint.
11. Docs rewrite / TL;DR / workflow recipes.
12. Live smoke.
13. Final release hygiene and push.

---

## Non-goals for This Slice

- Do not implement checkpoint/restore, record-actions/replay, network mock, clock control, tab groups, or embedded LLM `ask` in this slice.
- Do not add Playwright/Puppeteer dependencies to the distributed tool.
- Do not promise `press --isolated` unless event propagation isolation is actually implemented and tested.
- Do not make `@ref` look as stable as Playwright Locator; document that refs are short-lived handles and stable selectors are better for loops.
- Do not convert the single-file implementation into a multi-package architecture yet.

---

## Current Baseline Previously Verified Before This Amendment

- Repo: `/Users/simon/Code/chrome-cdp-ex`
- Remote: `https://github.com/EndeavorYen/chrome-cdp-ex`
- Branch: `main`
- Baseline tests at earlier planning time: `npm test` → `279 passed / 0 failed`
- Main implementation: `skills/chrome-cdp-ex/scripts/cdp.mjs`
- Tests: `tests/cdp.test.mjs`

Re-run Task 0 before implementation because this plan was amended after reading feedback from a sibling repo.
