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
function fixture({ extraCss = '', scaffoldHides = true, paneWidth = null } = {}) {
  const icon = (cls) =>
    `<svg class="${cls}" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>`;
  const btn = (id, svgCls, extra = '') =>
    `<div id="${id}" class="clickable-icon nav-action-button ${extra}">${icon(svgCls)}</div>`;
  return `<!doctype html><html><head><style>
  * { box-sizing: border-box; }
  body { margin: 0; }
  /* STAND-IN for the HOST. These two declarations are Obsidian's own, from
     app.css, and they are in the fixture because the theme is not free to
     ignore them: the wrap is the host's decision and the theme only gets to
     say what happens to the box when the host takes it. Without them the
     fixture measures a theme talking to nobody. Literals rather than the
     host's tokens because the fixture carries no Obsidian variable sheet:
     8px is --size-4-2. */
  .nav-header { padding: 8px; }
  .nav-buttons-container { flex-wrap: wrap; }
  /* STAND-IN for the scaffold's icor-rooms.css, which hides these two. They
     are in the fixture rather than omitted so the assumption is visible: the
     numbers below are true given the host controls the scaffold LEAVES.
     The scaffold also hides sort; that is the snippet's decision, so the
     THEME gate keeps sort visible and orders it. Switched OFF for the
     narrow-pane gate, where the vault under test is a plain community one
     that never installed the snippet and therefore shows every control. */
${scaffoldHides ? `  .nav-buttons-container .clickable-icon:has(svg.lucide-pen-box),
  .nav-buttons-container .clickable-icon:has(svg.lucide-folder-plus) { display: none !important; }` : ''}
${themeCss}
${paneWidth === null ? '' : `  .workspace-leaf-content { width: ${paneWidth}px; }`}
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
    seen[id] = {
      left: Math.round(b.left - r.left), width: Math.round(b.width),
      top: Math.round(b.top - r.top), height: Math.round(b.height),
    };
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
/* Every control the fixture builds, which is what a vault without the
   scaffold snippet actually renders. */
const ALL = ['newnote', 'newfolder', 'sort', 'collapse', 'focus', 'robot'];

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

/* THE NARROW-PANE GATE. Reported by Olivier Van Biervliet, theme channel,
 * 2026-09-14; ruled by Iris 2026-09-15.
 *
 * The wrap is the HOST's decision, not the theme's: Obsidian's own
 * `.nav-buttons-container` ships `flex-wrap: wrap`, and a narrow sidebar is
 * a supported sidebar. What the theme owes is a box that GROWS when the host
 * uses that wrap. A fixed `height` cannot grow, so the second line renders
 * outside the row and paints over the file tree below it.
 *
 * 180px of pane with six controls is the smallest real case, and it is
 * measured rather than argued: the scaffold snippet is off, because the
 * vault that reported this is a community vault that installed the theme
 * for its typography and never installed the snippet, so every host control
 * and both launchers render. Six 24px controls with 4px gaps want 164px; at
 * a 180px pane the host's 8px nav-header padding and the theme's own 8px
 * side padding leave the row 148px of content, so five controls take the
 * first line and one wraps to a second. Two 24px lines with the row's own
 * 4px gap between them is 52px.
 *
 * The second assertion is the defect itself stated as geometry. Row height
 * alone is not enough: a row could report 52px and still let a control hang
 * below its own box. Nothing may sit past the bottom edge, because past the
 * bottom edge is the tree.
 */
test('the row grows to fit when the host wraps it', () => {
  const m = measure({ paneWidth: 180, scaffoldHides: false });

  const secondLine = ALL.filter((id) => m.controls[id] && m.controls[id].top >= 24);
  assert.ok(secondLine.length > 0,
    'six controls did not wrap at a 180px pane, so this gate is measuring the wrong case '
    + `and would go green on a row that never grew.\n${JSON.stringify(m, null, 2)}`);

  assert.equal(m.rowHeight, 52,
    `the row is ${m.rowHeight}px tall on two wrapped lines; a row that grows with its content `
    + 'is 24px + 4px gap + 24px = 52px. A fixed height pins it at 24px and the second line '
    + `escapes the box.\n${JSON.stringify(m, null, 2)}`);

  for (const id of ALL) {
    const c = m.controls[id];
    assert.ok(c, `${id} is not rendered at all`);
    assert.ok(c.top + c.height <= m.rowHeight,
      `${id} ends ${c.top + c.height}px down while the row is only ${m.rowHeight}px tall, `
      + 'so it paints over the file tree');
  }
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
