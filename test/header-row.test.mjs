/* THE HEADER-ROW GEOMETRY GATE.
 *
 * This one is measured in a real layout engine rather than read off the
 * source, because the property that matters is not a rule, it is a
 * consequence of several rules together: order, gap, padding, and where
 * the cluster sits in the pane. No source scan can see that, and neither
 * can a screenshot - a still frame cannot show what is anchored to what.
 *
 * The row is CENTERED (user ruling, 2026-08-30) and collapse-all is a
 * PERMANENT control. The earlier conditional treatment - the control
 * appeared only when the tree could collapse - is withdrawn with the
 * ruling, so the gate now asserts presence unconditionally.
 *
 * Chrome is REQUIRED, not optional. A skip here would be a gate reporting
 * green having measured nothing. If the browser is missing this file fails
 * and says how to fix it.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const themeCss = readFileSync(resolve(repo, 'theme.css'), 'utf8');

const CHROME = process.env.CHROME_BIN
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/* Obsidian's own file-explorer toolbar, in the DOM order the host builds it,
   with the two suite launchers appended after as plugins actually append
   them. The theme centers and reorders; the fixture is what it starts from. */
function fixture({ extraCss = '' } = {}) {
  const icon = (cls) =>
    `<svg class="${cls}" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>`;
  const btn = (id, svgCls, extra = '') =>
    `<div id="${id}" class="clickable-icon nav-action-button ${extra}">${icon(svgCls)}</div>`;
  return `<!doctype html><html><head><style>
  * { box-sizing: border-box; }
  body { margin: 0; }
  /* STAND-IN for the scaffold's icor-rooms.css, which hides these two. They
     are in the fixture rather than omitted so the assumption is visible: the
     numbers below are true given the host controls the scaffold LEAVES.
     The scaffold also hides sort; that is the snippet's decision, so the
     THEME gate keeps sort visible and orders it. */
  .nav-buttons-container .clickable-icon:has(svg.lucide-pen-box),
  .nav-buttons-container .clickable-icon:has(svg.lucide-folder-plus) { display: none !important; }
${themeCss}
${extraCss}
  </style></head><body>
  <div class="workspace-leaf-content" data-type="file-explorer"><div class="nav-header">
    <div id="row" class="nav-buttons-container micor-tree-slot">
      ${btn('newnote', 'lucide-pen-box')}
      ${btn('newfolder', 'lucide-folder-plus')}
      ${btn('sort', 'lucide-sort-asc')}
      ${btn('collapse', 'lucide-chevrons-down-up')}
      ${btn('focus', 'lucide-focus', 'ifocus-launcher')}
      ${btn('robot', 'lucide-bot', 'aic-tree-launcher')}
    </div>
  </div></div>
  <pre id="out"></pre>
  <script>
  const row = document.getElementById('row');
  const r = row.getBoundingClientRect();
  const seen = {};
  for (const id of ['newnote','newfolder','sort','collapse','focus','robot']) {
    const el = document.getElementById(id);
    const cs = getComputedStyle(el);
    if (cs.display === 'none') { seen[id] = null; continue; }
    const b = el.getBoundingClientRect();
    seen[id] = { left: Math.round(b.left - r.left), width: Math.round(b.width) };
  }
  document.getElementById('out').textContent = JSON.stringify({
    controls: seen,
    rowHeight: Math.round(r.height),
    rowWidth: Math.round(r.width),
  });
  </script></body></html>`;
}

const dir = mkdtempSync(join(tmpdir(), 'inkline-headerrow-'));
let shot = 0;

function measure(opts) {
  const file = join(dir, `f${shot++}.html`);
  writeFileSync(file, fixture(opts));
  let dom;
  try {
    dom = execFileSync(CHROME, [
      '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      '--virtual-time-budget=2000', '--dump-dom', `file://${file}`,
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    assert.fail(
      `could not run Chrome at ${CHROME}. This gate MEASURES layout and cannot be `
      + `approximated by reading the CSS, so it fails rather than skipping. Set CHROME_BIN `
      + `to a Chrome or Chromium binary. Underlying error: ${e && e.message}`);
  }
  const m = dom.match(/<pre id="out">([^<]*)<\/pre>/);
  assert.ok(m && m[1], 'the fixture produced no measurement; the page script did not run');
  return JSON.parse(m[1]);
}

const VISIBLE = ['sort', 'collapse', 'focus', 'robot'];

function gaps(m) {
  const ls = VISIBLE.map((id) => m.controls[id].left);
  const rs = VISIBLE.map((id) => m.controls[id].left + m.controls[id].width);
  return {
    left: Math.min(...ls),
    right: m.rowWidth - Math.max(...rs),
    span: Math.max(...rs) - Math.min(...ls),
  };
}

/* CARDINALITY FIRST. Every assertion below is about numbers the THEME
   produces. If the fixture stopped matching the theme's selectors, the
   numbers would be a bare flex row's defaults and the whole file would go
   green describing nothing. 24px controls and a 24px row are the theme's
   own values and nothing else in the fixture sets them. */
test('the fixture is actually being styled by theme.css', () => {
  assert.match(themeCss, /\.micor-tree-slot\s*\{/, 'the slot rule is gone from theme.css');
  const m = measure();
  assert.equal(m.rowHeight, 24, 'the row is not 24px tall, so theme.css did not apply to the fixture');
  for (const id of VISIBLE) {
    assert.ok(m.controls[id], `${id} is not rendered at all`);
    assert.equal(m.controls[id].width, 24, `${id} is not 24px wide, so the theme's control rule missed it`);
  }
  assert.equal(m.controls.newnote, null, 'the stand-in for the scaffold hide did not take');
});

/* The ruling itself: collapse-all is PERMANENT. No state class, no gating -
   the fixture carries no micor-can-collapse and the control must render. */
test('collapse-all renders unconditionally', () => {
  const m = measure();
  assert.ok(m.controls.collapse,
    'collapse-all does not render without a state class; the conditional gating was supposed '
    + 'to be withdrawn (user ruling, 2026-08-30)');
});

/* The ruling's other half: the cluster is CENTERED in the row. Centered
   means anchored to the row's own box - equal space both sides - and to
   nothing else: not the banner, not the room glyph column. */
test('the cluster is centered in the row', () => {
  const g = gaps(measure());
  assert.ok(Math.abs(g.left - g.right) <= 1,
    `the cluster sits ${g.left}px from the left and ${g.right}px from the right; `
    + 'a centered row has equal space both sides (1px rounding allowed)');
});

/* The inset token is neither consumed nor restated. It existed to align the
   row's LEFT edge to the banner, and a centered row has no left anchor. A
   surviving var() would be a dead declaration; a 14px literal would be the
   second copy of another file's number. Both are drift. */
test('the banner inset is neither consumed nor restated', () => {
  const slot = themeCss.slice(themeCss.indexOf('.micor-tree-slot {'));
  const decl = slot.slice(0, slot.indexOf('}'));
  assert.doesNotMatch(decl, /--icor-header-inset/,
    'the slot still references the banner inset; centering removed that anchor and a dead '
    + 'consumption reads as a live one to the next editor');
  assert.doesNotMatch(decl, /\b14px\b/,
    'the slot restates the banner inset as a literal, which is the two-copies drift the '
    + 'token existed to prevent');
});

test('the visual order is launchers, sort, collapse last', () => {
  const m = measure();
  const order = ['focus', 'robot', 'sort', 'collapse'];
  const lefts = order.map((id) => m.controls[id].left);
  assert.deepEqual([...lefts].sort((a, b) => a - b), lefts,
    'the controls do not lay out in the order launchers, sort, collapse.\n'
    + JSON.stringify(m.controls, null, 2));
});

/* The stated width, which is a spec rather than an observation: four
   controls at 24px with 4px gaps occupy 108px. It is here so a future gap
   or size change has to be a deliberate edit to this file rather than a
   silent drift. */
test('the settled width is the specified 108', () => {
  assert.equal(gaps(measure()).span, 108, 'four controls no longer occupy 108px');
});

/* NEGATIVE CONTROL. Every assertion above is a comparison of numbers, and a
   harness that measured the same thing twice would satisfy all of them
   forever. Hand it the exact regression this ruling reverses - a packed
   row - and it must go red. */
test('the harness can see a packed row when handed one', () => {
  const g = gaps(measure({
    extraCss: '.micor-tree-slot { justify-content: flex-start !important; }',
  }));
  assert.ok(Math.abs(g.left - g.right) > 10,
    `the harness reports a planted flex-start row as centered (left ${g.left}, right ${g.right}); `
    + 'it cannot be trusted to detect the defect it exists to catch');
});
