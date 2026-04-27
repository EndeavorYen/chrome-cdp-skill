# chrome-cdp-ex Review Feedback Improvement Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Turn the latest review feedback into a bounded, verifiable quality-improvement slice for `chrome-cdp-ex`, prioritizing real dogfood failures over new feature sprawl.

**Architecture:** Keep the zero-dependency single-script distribution for now, but add small internal parsing/resolution helpers inside `skills/chrome-cdp-ex/scripts/cdp.mjs` with unit tests in `tests/cdp.test.mjs`. Treat README/SKILL claims as product contracts: every advertised workflow must either be implemented, tested, and live-smoked, or explicitly documented as best-effort/fallback.

**Tech Stack:** Node.js 22+ ESM, raw Chrome DevTools Protocol, Vitest, ESLint, Markdown docs.

**Important feedback-source note:** The requested `CHROME-CDP-EX-FEEDBACK.md` was not present in `/Users/simon/Code/chrome-cdp-ex` at planning time, and filename search under the usual local workspaces did not locate it. This plan therefore anchors on the review/dogfood feedback already visible in repo context and prior session recall: stale roadmap/docs, over-strong cascade source-origin claims, `flow`/`batch` argument parsing weaknesses, numeric-key support gaps, `styles @ref` robustness, and missing real-app smoke evidence. If the missing file appears, Task 0 must be re-run and this plan amended before implementation.

---

## Acceptance Criteria

1. `npm test` and `npm run lint` pass.
2. New tests cover every repaired behavior before/with implementation.
3. README, `skills/chrome-cdp-ex/SKILL.md`, `TODOS.md`, and `DESIGN.md` no longer advertise stale or unqualified claims that are false in real Vite/React/CSS Modules apps.
4. `flow` and `batch` preserve quoted multi-word arguments such as `fill @1 'look 訓練師'`.
5. `press` supports numeric keys `0`-`9` and common single-character keys without breaking named keys (`Enter`, `Tab`, `Escape`, arrows, etc.).
6. `styles` supports `@ref` selectors or returns an explicit actionable error if a stale ref cannot be resolved.
7. `cascade` output clearly distinguishes exact source mapping, computed-style fallback, and unresolved/opaque stylesheet IDs.
8. A deterministic local smoke page verifies `perceive`, `styles`, `cascade`, `record`, `batch`, `flow`, `press 1`, and quoted `fill` behavior against a real CDP browser.
9. Release metadata is consistent: command count, version/changelog, TODO roadmap, and docs match implemented commands.

---

## Feedback Synthesis / Problem List

### P0 — Planning input gap

- `CHROME-CDP-EX-FEEDBACK.md` is absent from the repo path the user specified.
- Risk: implementing from incomplete feedback may miss reviewer-specific concerns.
- Mitigation: add a lightweight feedback-ingestion task and explicitly amend the plan if the file is supplied later.

### P1 — Docs and roadmap overclaim/staleness

Current findings:

- `README.md` says `cascade` tells the exact file/line and says `inject`/`cascade`/`record` are available.
- `TODOS.md` still lists `inject`, `cascade`, and `record` as unchecked future work even though they are implemented.
- `DESIGN.md` release plan still describes v2.3/v2.4 features as future sketches and includes unimplemented `emulate`, `frame`, `components` without clear status boundaries.
- Skill memory notes real-app dogfood showed `cascade` can still return `No matching CSS rules found` while `styles` has computed styles.

Desired state:

- README/SKILL describe `cascade` as “source-origin tracing when CDP/source maps expose rules; falls back to computed style / opaque sheet id otherwise.”
- `styles` is documented as the reliable computed-style fallback.
- Roadmap separates shipped, best-effort, and future work.

### P1 — Shell parser / command parser weakness

Current findings:

- `parseFlowSteps(input)` uses `line.split(/\s+/)`, so quoted multi-word text is not preserved.
- `batch` pipe-mode parsing also uses `.split(/\s+/)`.
- Prior dogfood found direct `fill @ref 'look 訓練師'` works better than placing the same fill inside `flow`.

Desired state:

- Shared shell-like tokenizer supports single quotes, double quotes, and backslash escapes.
- `flow <target> "fill @1 'look 訓練師'; press Enter"` passes `['@1', 'look 訓練師']` to `fill`.
- `batch <target> "fill @1 'look 訓練師' | press Enter" --plain` behaves similarly.
- JSON batch mode remains unchanged.

### P1 — Keyboard input gap

Current findings:

- `KEY_MAP` supports named control/navigation keys but not numeric keys.
- Prior real-app QA found `press 1` did not work for quickbar/hotkey testing.

Desired state:

- `press 1` dispatches keyDown/keyUp with `key: '1'`, `code: 'Digit1'`, `windowsVirtualKeyCode: 49`.
- Support `0`-`9` and likely letters `a`-`z` if low-risk, but document exactly what is supported.
- Keep named aliases case-insensitive.

### P1 — `styles @ref` robustness

Current findings:

- `stylesStr(cdp, sid, selector)` currently appears selector-based; `handleCommand` calls `stylesStr(cdp, sessionId, args[0])` without `refMap`.
- A previous `styles @9` dogfood attempt produced `Error: Uncaught`.
- Many users naturally try `styles @ref` after `perceive` because `click`, `fill`, `hover`, `elshot`, and `cascade` support refs.

Desired state:

- `styles` accepts `@ref` and resolves it through shared ref resolution.
- Stale refs produce `Unknown ref: @N. Run "perceive" first.` or `element may have been removed from DOM. Run "perceive" to refresh refs.`
- CSS selector mode remains unchanged.

### P1 — `cascade` fallback clarity

Current findings:

- `cascadeStr` already initializes DOM/CSS and parses inline sourcemaps, but real Vite/CSS Modules apps can still fail to map rules or find matching explicit rules for some properties.
- Current no-rule property fallback returns `background-color: ... (computed, no explicit rule found)` only when a specific property is requested.
- Full cascade with no matched rules still returns `No matching CSS rules found`, which can look like a total failure even when computed styles exist.

Desired state:

- When no explicit rules are found, include computed style hints for either the requested property or a short curated subset.
- When source is an opaque `style-sheet-...`, annotate it as unresolved and suggest `styles` fallback / source-map limitation.
- Do not claim exact file/line unless source is not an opaque generated id.

### P2 — One-file maintainability pressure

Current findings:

- `cdp.mjs` is ~3,580 lines.
- CLAUDE.md says the implementation is single-file by design, but future features (`frame`, `components`, `emulate`) will increase complexity.

Desired state for this slice:

- Do not split files yet unless required.
- Add small pure helper functions with tests (`splitCommandLine`, `parsePipeline`, key mapping helpers, style-ref resolver), keeping distribution simple.
- Add TODO/design note proposing a later internal modularization boundary if feature growth continues.

---

## Task 0: Re-check for `CHROME-CDP-EX-FEEDBACK.md` and amend plan if present

**Objective:** Avoid implementing from stale/incomplete feedback if the review file is supplied after this plan was drafted.

**Files:**
- Read if present: `CHROME-CDP-EX-FEEDBACK.md`
- Modify if needed: `docs/plans/2026-04-27-review-feedback-improvement-plan.md`

**Step 1: Verify file presence**

Run:

```bash
cd /Users/simon/Code/chrome-cdp-ex
[ -f CHROME-CDP-EX-FEEDBACK.md ] && wc -l CHROME-CDP-EX-FEEDBACK.md && sed -n '1,240p' CHROME-CDP-EX-FEEDBACK.md || true
```

Expected if still absent: no output or a false branch.

**Step 2: If present, extract actionable items**

Create a short checklist inside this plan under `Feedback Synthesis / Problem List` with:

- exact feedback quote/summary;
- severity (`P0/P1/P2`);
- target file(s);
- test requirement.

**Step 3: Commit only the plan amendment if changed**

```bash
git add docs/plans/2026-04-27-review-feedback-improvement-plan.md
git commit -m "docs: amend chrome-cdp-ex review plan with feedback file"
```

Skip commit if no file exists and no amendment is needed.

---

## Task 1: Add a shared shell-like tokenizer for flow/batch command strings

**Objective:** Preserve quoted multi-word arguments consistently.

**Files:**
- Modify: `skills/chrome-cdp-ex/scripts/cdp.mjs`
- Test: `tests/cdp.test.mjs`

**Step 1: Write failing tests for tokenization**

Add tests near `parseFlowSteps`:

```js
describe('splitCommandLine', () => {
  it('preserves single-quoted multi-word arguments', () => {
    expect(splitCommandLine("fill @1 'look 訓練師'")).toEqual(['fill', '@1', 'look 訓練師']);
  });

  it('preserves double-quoted multi-word arguments', () => {
    expect(splitCommandLine('fill @1 "look 訓練師"')).toEqual(['fill', '@1', 'look 訓練師']);
  });

  it('supports backslash escaping outside quotes', () => {
    expect(splitCommandLine('type hello\\ world')).toEqual(['type', 'hello world']);
  });

  it('throws on unterminated quotes', () => {
    expect(() => splitCommandLine("fill @1 'unterminated")).toThrow(/Unterminated quote/);
  });
});
```

Add/update `parseFlowSteps` tests:

```js
it('preserves quoted multi-word fill text in command steps', () => {
  expect(parseFlowSteps("fill @1 'look 訓練師'; press Enter")).toEqual([
    { kind: 'command', cmd: 'fill', args: ['@1', 'look 訓練師'] },
    { kind: 'command', cmd: 'press', args: ['Enter'] },
  ]);
});
```

Add a pure parser test for batch pipeline if a helper is extracted:

```js
describe('parseBatchPipeline', () => {
  it('preserves quoted arguments across pipe-separated commands', () => {
    expect(parseBatchPipeline("fill @1 'look 訓練師' | press Enter")).toEqual([
      { cmd: 'fill', args: ['@1', 'look 訓練師'] },
      { cmd: 'press', args: ['Enter'] },
    ]);
  });
});
```

**Step 2: Run targeted tests and confirm failure**

Run:

```bash
npm test -- tests/cdp.test.mjs -t "splitCommandLine|parseFlowSteps|parseBatchPipeline"
```

Expected: FAIL because helpers do not exist or quoted args are split incorrectly.

**Step 3: Implement `splitCommandLine` and `parseBatchPipeline`**

Add near existing parser helpers:

```js
function splitCommandLine(input) {
  const out = [];
  let cur = '';
  let quote = null;
  let escape = false;
  for (const ch of String(input || '')) {
    if (escape) { cur += ch; escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; continue; }
    if (/\s/.test(ch)) {
      if (cur) { out.push(cur); cur = ''; }
      continue;
    }
    cur += ch;
  }
  if (escape) cur += '\\';
  if (quote) throw new Error(`Unterminated quote: ${quote}`);
  if (cur) out.push(cur);
  return out;
}

function parseBatchPipeline(input) {
  return String(input || '')
    .split('|')
    .map(segment => {
      const parts = splitCommandLine(segment.trim());
      return { cmd: parts[0], args: parts.slice(1) };
    })
    .filter(c => c.cmd);
}
```

**Step 4: Use it in `parseFlowSteps`**

Replace:

```js
const parts = line.split(/\s+/);
```

with:

```js
const parts = splitCommandLine(line);
```

Keep `wait` behavior as `parts.slice(1).join(' ').toLowerCase()`.

**Step 5: Use it in batch pipe mode**

Replace the inline pipe parser in `handleCommand`:

```js
commands = input.split('|').map(segment => {
  const parts = segment.trim().split(/\s+/);
  return { cmd: parts[0], args: parts.slice(1) };
}).filter(c => c.cmd);
```

with:

```js
commands = parseBatchPipeline(input);
```

**Step 6: Verify**

Run:

```bash
npm test -- tests/cdp.test.mjs -t "splitCommandLine|parseFlowSteps|parseBatchPipeline|flowStr|formatBatchResults"
npm test
```

Expected: targeted tests pass; full suite remains green.

**Step 7: Commit**

```bash
git add skills/chrome-cdp-ex/scripts/cdp.mjs tests/cdp.test.mjs
git commit -m "fix: preserve quoted args in flow and batch"
```

---

## Task 2: Add numeric and single-character key support to `press`

**Objective:** Make `press 1` and related hotkey testing work.

**Files:**
- Modify: `skills/chrome-cdp-ex/scripts/cdp.mjs`
- Test: `tests/cdp.test.mjs`

**Step 1: Write failing tests**

Add near `KEY_MAP` / `pressStr` tests:

```js
describe('keyForPress', () => {
  it('maps digit keys to DigitN codes', () => {
    expect(keyForPress('1')).toEqual({ key: '1', code: 'Digit1', keyCode: 49 });
    expect(keyForPress('0')).toEqual({ key: '0', code: 'Digit0', keyCode: 48 });
  });

  it('maps letters to KeyX codes', () => {
    expect(keyForPress('a')).toEqual({ key: 'a', code: 'KeyA', keyCode: 65 });
  });

  it('keeps named aliases case-insensitive', () => {
    expect(keyForPress('Enter')).toEqual(KEY_MAP.enter);
  });
});
```

Add/extend `pressStr` mock-CDP test:

```js
it('dispatches numeric key events for press 1', async () => {
  const calls = [];
  const cdp = { send: async (method, params, sid) => { calls.push({ method, params, sid }); return {}; } };
  await pressStr(cdp, 'sid', '1');
  expect(calls[0].params).toMatchObject({ type: 'keyDown', key: '1', code: 'Digit1', windowsVirtualKeyCode: 49 });
  expect(calls[1].params).toMatchObject({ type: 'keyUp', key: '1', code: 'Digit1', windowsVirtualKeyCode: 49 });
});
```

**Step 2: Run targeted test and confirm failure**

```bash
npm test -- tests/cdp.test.mjs -t "keyForPress|pressStr"
```

**Step 3: Implement `keyForPress`**

```js
function keyForPress(keyName) {
  const raw = String(keyName || '');
  const mapped = KEY_MAP[raw.toLowerCase()];
  if (mapped) return mapped;
  if (/^[0-9]$/.test(raw)) {
    return { key: raw, code: `Digit${raw}`, keyCode: raw.charCodeAt(0) };
  }
  if (/^[a-zA-Z]$/.test(raw)) {
    const upper = raw.toUpperCase();
    return { key: raw, code: `Key${upper}`, keyCode: upper.charCodeAt(0) };
  }
  return null;
}
```

Modify `pressStr` to use it:

```js
const mapped = keyForPress(keyName);
if (!mapped) throw new Error(`Unknown key: ${keyName}. Supported: ${Object.keys(KEY_MAP).join(', ')}, 0-9, a-z`);
```

**Step 4: Verify**

```bash
npm test -- tests/cdp.test.mjs -t "keyForPress|pressStr|KEY_MAP"
npm test
```

**Step 5: Commit**

```bash
git add skills/chrome-cdp-ex/scripts/cdp.mjs tests/cdp.test.mjs
git commit -m "fix: support numeric and letter key presses"
```

---

## Task 3: Add `styles @ref` support with actionable stale-ref errors

**Objective:** Align `styles` with user expectations established by `click`, `fill`, `hover`, `elshot`, and `cascade`.

**Files:**
- Modify: `skills/chrome-cdp-ex/scripts/cdp.mjs`
- Test: `tests/cdp.test.mjs`
- Docs: `README.md`, `skills/chrome-cdp-ex/SKILL.md`

**Step 1: Inspect current `stylesStr` implementation**

Run/read around function:

```bash
python3 - <<'PY'
from pathlib import Path
s=Path('skills/chrome-cdp-ex/scripts/cdp.mjs').read_text().splitlines()
for i,l in enumerate(s,1):
    if 'function stylesStr' in l:
        print(i)
PY
```

**Step 2: Write failing tests**

Add tests near `stylesStr` or create a new `describe('stylesStr', ...)` block:

```js
it('supports @ref by resolving backend node to object', async () => {
  const refMap = new Map([[9, 12345]]);
  const calls = [];
  const cdp = { send: async (method, params, sid) => {
    calls.push({ method, params, sid });
    if (method === 'DOM.resolveNode') return { object: { objectId: 'obj-1' } };
    if (method === 'Runtime.callFunctionOn') return { result: { value: {
      tag: 'BUTTON', id: '', className: 'btn primary', styles: { display: 'block', color: 'rgb(1, 2, 3)' }
    } } };
    return {};
  }};
  const out = await stylesStr(cdp, 'sid', '@9', refMap);
  expect(out).toContain('<BUTTON>.btn primary');
  expect(out).toContain('color: rgb(1, 2, 3)');
  expect(calls[0]).toMatchObject({ method: 'DOM.resolveNode', params: { backendNodeId: 12345 } });
});

it('throws actionable error for unknown @ref in styles', async () => {
  await expect(stylesStr({ send: async () => ({}) }, 'sid', '@9', new Map()))
    .rejects.toThrow(/Unknown ref: @9.*Run "perceive" first/);
});
```

**Step 3: Run targeted tests and confirm failure**

```bash
npm test -- tests/cdp.test.mjs -t "stylesStr"
```

**Step 4: Implement shared element style evaluation**

Refactor `stylesStr` into:

- CSS selector path: existing `document.querySelector(selector)` logic.
- `@ref` path: use existing `resolveRefNode(cdp, sid, refMap, selector)` to get `objectId`, then call the same style extraction function via `Runtime.callFunctionOn`.

Pseudo-shape:

```js
const STYLE_EXTRACTOR = `function() {
  const el = this;
  const cs = getComputedStyle(el);
  const props = ['display','opacity','position','width','height','border','box-sizing','overflow','align-items','justify-content','gap','color','background-color','font-size','font-weight','font-family','line-height','text-align','transition','cursor','box-shadow','border-radius','outline'];
  const styles = {};
  for (const p of props) {
    const v = cs.getPropertyValue(p);
    if (v) styles[p] = v;
  }
  return { tag: el.tagName, id: el.id || '', className: typeof el.className === 'string' ? el.className : '', styles };
}`;
```

Ensure selector path still reports `Element not found: ...`.

Change `handleCommand`:

```js
case 'styles': result = await stylesStr(cdp, sessionId, args[0], refMap); break;
```

**Step 5: Verify**

```bash
npm test -- tests/cdp.test.mjs -t "stylesStr|resolveRef"
npm test
```

**Step 6: Docs update**

In README command table and SKILL command reference, change:

```text
styles <target> <selector>
```

to:

```text
styles <target> <selector|@ref>
```

Add one short note:

```text
Use `styles` as the reliable computed-style fallback when `cascade` cannot resolve an exact source rule.
```

**Step 7: Commit**

```bash
git add skills/chrome-cdp-ex/scripts/cdp.mjs tests/cdp.test.mjs README.md skills/chrome-cdp-ex/SKILL.md
git commit -m "fix: support refs in styles command"
```

---

## Task 4: Make `cascade` fallback output honest and useful

**Objective:** Keep `cascade` valuable without overclaiming exact source lines when CDP/source maps cannot provide them.

**Files:**
- Modify: `skills/chrome-cdp-ex/scripts/cdp.mjs`
- Test: `tests/cdp.test.mjs`
- Docs: `README.md`, `skills/chrome-cdp-ex/SKILL.md`

**Step 1: Write failing tests for unresolved source annotation**

Add near `cascadeStr` tests:

```js
it('annotates opaque stylesheet ids as unresolved generated sources', async () => {
  const cdp = makeCascadeMock({
    rules: [{ selector: '.btn', prop: 'color', value: 'red', source: 'style-sheet-123:4' }],
    computed: { color: 'red' },
    sheetText: ''
  });
  const out = await cascadeStr(cdp, 'sid', '.btn', 'color', new Map());
  expect(out).toContain('style-sheet-');
  expect(out).toContain('unresolved generated stylesheet');
});
```

If `makeCascadeMock` does not exist, add a tiny local test helper that mocks `DOM.getDocument`, `DOM.querySelector`, `CSS.getMatchedStylesForNode`, `CSS.getComputedStyleForNode`, and `CSS.getStyleSheetText`.

**Step 2: Write failing test for no-explicit-rule computed fallback**

```js
it('shows computed fallback when no explicit rules match requested property', async () => {
  const cdp = makeCascadeMock({ rules: [], computed: { 'background-color': 'rgba(0, 0, 0, 0)' } });
  const out = await cascadeStr(cdp, 'sid', '.btn', 'background-color', new Map());
  expect(out).toContain('background-color: rgba(0, 0, 0, 0)');
  expect(out).toContain('computed fallback');
  expect(out).toContain('styles');
});
```

**Step 3: Run targeted test and confirm failure**

```bash
npm test -- tests/cdp.test.mjs -t "cascadeStr"
```

**Step 4: Implement helpers**

Add helpers:

```js
function isOpaqueStyleSource(source) {
  return /^style-sheet-[^:]+:\d+/.test(String(source || ''));
}

function formatStyleSourceForDisplay(source) {
  return isOpaqueStyleSource(source)
    ? `${source} (unresolved generated stylesheet; use styles for computed value or verify source maps)`
    : source;
}
```

Use in `cascadeStr` when printing `→ ${r.source}` and inherited source lines.

For property fallback, adjust existing branch:

```js
return computed
  ? `${property}: ${computed} (computed fallback; no explicit matching CSS rule found — use styles ${selector} for full computed styles)`
  : `Property "${property}" not found on this element`;
```

For full no-rule mode, consider returning a compact subset:

```js
const fallbackProps = ['display','color','background-color','font-size','font-weight','opacity','cursor'];
const available = fallbackProps.filter(p => computedMap.get(p)).map(p => `  ${p}: ${computedMap.get(p)}`);
return available.length
  ? ['No matching CSS rules found. Computed fallback:', ...available, 'Use `styles` for full computed styles.'].join('\n')
  : 'No matching CSS rules found for this element';
```

**Step 5: Verify**

```bash
npm test -- tests/cdp.test.mjs -t "cascadeStr|mapStyleSource"
npm test
```

**Step 6: Docs update**

Update README/SKILL phrasing:

- Replace “`cascade` tells exactly which file and line to edit” with “`cascade` traces matched CSS rules and source locations when available; Vite/CSS Modules source maps are best-effort; use `styles` as computed-style fallback.”
- Add a short example of computed fallback.

**Step 7: Commit**

```bash
git add skills/chrome-cdp-ex/scripts/cdp.mjs tests/cdp.test.mjs README.md skills/chrome-cdp-ex/SKILL.md
git commit -m "fix: clarify cascade fallbacks"
```

---

## Task 5: Reconcile roadmap, README, skill, and release metadata

**Objective:** Make docs match actual shipped behavior and avoid future agents following stale promises.

**Files:**
- Modify: `README.md`
- Modify: `skills/chrome-cdp-ex/SKILL.md`
- Modify: `TODOS.md`
- Modify: `DESIGN.md`
- Modify if needed: `CHANGELOG.md`
- Modify if needed: `package.json`

**Step 1: Audit command count and command list**

Run:

```bash
node - <<'JS'
const fs = require('fs');
const s = fs.readFileSync('skills/chrome-cdp-ex/scripts/cdp.mjs','utf8');
const m = s.match(/const NEEDS_TARGET = new Set\(\[([\s\S]*?)\]\)/);
console.log(m ? m[1].split(',').map(x=>x.trim().replace(/["']/g,'')).filter(Boolean).length : 'NEEDS_TARGET not found');
JS
```

Also inspect `USAGE` for listed commands.

**Step 2: Update `TODOS.md`**

Move shipped items out of unchecked future roadmap. Suggested structure:

```md
## Shipped / maintain

- [x] `inject` — shipped in v2.2.0; maintain security validation and removal semantics.
- [x] `cascade` — shipped; source mapping is best-effort and needs real-app dogfood.
- [x] `record` — shipped; maintain action/settle semantics.

## Next high-value repairs

- [ ] Real-app Vite/CSS Modules dogfood matrix for `cascade` source mapping.
- [ ] `emulate` — network/theme emulation.
- [ ] `frame` — cross-origin iframe discovery/observation.
- [ ] `components` — React/Vue component tree/state inspection.
```

**Step 3: Update `DESIGN.md` status headers**

Add a top status table:

```md
| Feature | Status | Notes |
|---|---|---|
| inject | Shipped | zero-dependency, URL validation |
| cascade | Shipped / best-effort source mapping | use styles fallback when rules/source unavailable |
| record | Shipped | action mode auto-settles |
| emulate | Not shipped | future |
| frame | Not shipped | future |
| components | Not shipped | future |
```

Mark old implementation sketches as historical design notes, not current truth.

**Step 4: Update README/SKILL command examples**

Ensure all command references include:

- `styles <target> <selector|@ref>`
- `press <target> <key>` supports named keys plus `0-9`, `a-z`
- `flow`/`batch` examples with quoted args:

```bash
flow <t> "fill @1 'look 訓練師'; press Enter; wait dom stable; summary"
batch <t> "styles @1 | cascade @1 color | console --errors" --plain
```

**Step 5: Verify docs do not overclaim**

Run searches:

```bash
grep -R "exactly which file\|exact file\|always" -n README.md skills/chrome-cdp-ex/SKILL.md DESIGN.md TODOS.md || true
grep -R "styles <target> <selector>" -n README.md skills/chrome-cdp-ex/SKILL.md || true
```

Expected: no stale exact/always claims for cascade; no old styles signature.

**Step 6: Commit**

```bash
git add README.md skills/chrome-cdp-ex/SKILL.md TODOS.md DESIGN.md CHANGELOG.md package.json
git commit -m "docs: reconcile shipped chrome-cdp-ex roadmap"
```

---

## Task 6: Add deterministic local CDP smoke page and manual smoke script

**Objective:** Verify fixed behavior in a real browser without depending on `3y-mud` availability.

**Files:**
- Create: `scripts/smoke-page.html`
- Create: `scripts/live-smoke.mjs` or `scripts/live-smoke.sh`
- Modify: `package.json` scripts if desired
- Docs: `CONTRIBUTING.md` or `README.md`

**Step 1: Create smoke page**

`scripts/smoke-page.html` should include:

- input `#cmd`;
- button `#hotkey-target` with `keydown` listener logging numeric key presses;
- button `#mutate` that appends DOM nodes, logs console output, and fires a fetch to a harmless local/data endpoint if feasible;
- CSS rule with `sourceURL` or inline sourcemap comment for cascade;
- CSS module-like generated class to test source fallback wording.

Minimal page skeleton:

```html
<!doctype html>
<meta charset="utf-8">
<title>chrome-cdp-ex smoke</title>
<style>
.btn { color: rgb(1, 2, 3); background-color: rgb(4, 5, 6); }
/*# sourceURL=/tmp/chrome-cdp-ex-smoke.css */
</style>
<input id="cmd" aria-label="command" />
<button id="hotkey-target" class="btn">Hotkey target</button>
<button id="mutate" class="btn">Mutate</button>
<div id="log"></div>
<script>
document.getElementById('hotkey-target').addEventListener('keydown', e => {
  document.getElementById('log').textContent = 'key:' + e.key;
  console.log('key', e.key);
});
document.getElementById('mutate').addEventListener('click', () => {
  const p = document.createElement('p');
  p.textContent = 'mutated ' + Date.now();
  document.getElementById('log').appendChild(p);
  console.warn('mutated');
});
</script>
```

**Step 2: Create smoke runner**

The script should:

1. Start a simple local static server (`python3 -m http.server`) in `scripts/`.
2. Launch isolated Chrome/Edge with `--remote-debugging-port=9333` and a temp profile.
3. Run:
   - `doctor`
   - `list`
   - `perceive -C -d 8`
   - `styles @ref`
   - `cascade @ref color`
   - `flow "fill @ref 'look 訓練師'; press Enter; summary"`
   - `press 1` after focusing `#hotkey-target`
   - `record --action click @mutateRef`
   - `batch "styles @ref | console --errors" --plain`
4. Print PASS/FAIL summary.
5. Clean up only the temp browser/profile/server.

Prefer a conservative script that skips if Chrome/Edge cannot be found, so CI does not become flaky.

**Step 3: Document smoke usage**

Add to `CONTRIBUTING.md`:

```bash
npm test
npm run lint
node scripts/live-smoke.mjs
```

**Step 4: Verify locally**

Run:

```bash
npm test
npm run lint
node scripts/live-smoke.mjs
```

Expected: unit tests and lint pass; smoke script either passes or explicitly skips with a clear reason.

**Step 5: Commit**

```bash
git add scripts/smoke-page.html scripts/live-smoke.mjs package.json CONTRIBUTING.md
git commit -m "test: add live CDP smoke coverage"
```

---

## Task 7: Final verification and release hygiene

**Objective:** Ensure all changes are coherent and ready for push/release.

**Files:**
- Possibly: `CHANGELOG.md`, `package.json`, `.claude-plugin/plugin.json`

**Step 1: Run full verification**

```bash
npm test
npm run lint
node scripts/live-smoke.mjs
```

Expected:

- `npm test`: all tests pass.
- `npm run lint`: no errors.
- live smoke: PASS or SKIP with clear environment reason.

**Step 2: Inspect git diff**

```bash
git diff --stat HEAD~6..HEAD
git log --oneline -8
```

Check that changes are scoped to parser/key/style/cascade/docs/smoke, not unrelated feature sprawl.

**Step 3: Check package/plugin version consistency**

Read:

```bash
node -p "require('./package.json').version"
cat .claude-plugin/plugin.json
```

If behavior changes warrant patch release, bump package/plugin version consistently and update changelog. If auto-release is configured by conventional commits, do not manually bump unless repo convention requires it.

**Step 4: Final manual dogfood on a real app if available**

If `3y-mud` or another Vite/React/CSS Modules app is running, run one real smoke:

```bash
CDP_PORT=9333 node skills/chrome-cdp-ex/scripts/cdp.mjs list
CDP_PORT=9333 node skills/chrome-cdp-ex/scripts/cdp.mjs perceive <target> -C -d 8
CDP_PORT=9333 node skills/chrome-cdp-ex/scripts/cdp.mjs styles <target> @1
CDP_PORT=9333 node skills/chrome-cdp-ex/scripts/cdp.mjs cascade <target> @1 color
CDP_PORT=9333 node skills/chrome-cdp-ex/scripts/cdp.mjs flow <target> "fill @1 'look 訓練師'; press Enter; summary"
```

Record exact output snippets in the PR/commit notes, especially whether `cascade` resolved source files or used fallback wording.

**Step 5: Push**

```bash
git status --short
git push origin main
```

---

## Implementation Order / Commit Plan

1. `docs: add chrome-cdp-ex review feedback improvement plan`
2. `fix: preserve quoted args in flow and batch`
3. `fix: support numeric and letter key presses`
4. `fix: support refs in styles command`
5. `fix: clarify cascade fallbacks`
6. `docs: reconcile shipped chrome-cdp-ex roadmap`
7. `test: add live CDP smoke coverage`
8. Optional release metadata commit if required by repo convention.

---

## Non-goals for this slice

- Do not implement `emulate`, `frame`, or `components` in this slice.
- Do not split `cdp.mjs` into multiple modules unless a tiny helper extraction becomes unavoidable.
- Do not claim `cascade` always maps to original source files in all bundlers.
- Do not replace Playwright or deterministic E2E testing; `chrome-cdp-ex` remains a live-browser inspection/dogfood tool.

---

## Risk Controls

- **Parser regressions:** Keep JSON batch mode unchanged; add targeted tests for old simple cases and new quoted cases.
- **Key event incompatibility:** Use standard Chrome key/code/keyCode values; verify in live smoke.
- **Ref staleness:** Reuse existing ref error hints; do not silently query stale DOM nodes.
- **Cascade false confidence:** Label unresolved generated stylesheet sources explicitly.
- **Live smoke flakiness:** Make smoke script skip gracefully when no supported browser binary is available.

---

## Current Baseline Verified During Planning

- Repo: `/Users/simon/Code/chrome-cdp-ex`
- Remote: `https://github.com/EndeavorYen/chrome-cdp-ex`
- Branch: `main`
- Worktree before plan: clean
- Baseline tests: `npm test` → `279 passed / 0 failed`
- Main implementation file: `skills/chrome-cdp-ex/scripts/cdp.mjs` (~3,580 lines)
- Test file: `tests/cdp.test.mjs` (~3,264 lines)
