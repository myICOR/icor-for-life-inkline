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
 * WHY THE HOST STYLESHEET IS IN THE DOCUMENT (2026-09-16). Until now this
 * fixture carried two hand-written declarations standing in for Obsidian -
 * `.nav-header { padding: 8px }` and `.nav-buttons-container { flex-wrap:
 * wrap }` - and that stand-in is how the tree-slot overlap reached 1.6.0.
 * A stand-in is a second copy of the host's behaviour, written by us, and a
 * second copy drifts: ours named padding and wrap and knew nothing about
 * the host's `gap`, so every number below was measured in a row where the
 * theme's own `gap: 4px` had no contest to win. It won by default in the
 * fixture and by luck in the app. The fixture now loads app.css out of the
 * Obsidian installs on this machine, every build of it that can be found,
 * and runs the whole set once per build in front of the theme. The two
 * stand-ins are DELETED rather than kept alongside: keeping them would
 * leave the copy that drifts sitting next to the source that cannot.
 *
 * AND THE THIRD STAND-IN IS GONE TOO (Iris ruling, 2026-09-17). A third
 * one outlived the other two: a hand-written copy of the scaffold's hides,
 * attributed to `icor-rooms.css`. It had drifted in both directions the
 * comment above predicts. It named a file that no longer holds the rule -
 * the hides moved into this repo as `src/85-chrome.css` behind the
 * `icor-scaffold-chrome` toggle - and it hid `lucide-pen-box` where
 * Obsidian 1.13.7 stamps `lucide-edit`, so it was hiding a button the
 * shipped theme did not hide. The switch is now the real thing: the body
 * carries `icor-scaffold-chrome` or it does not, and the hide under test
 * is the theme's own, built by build.mjs with its own guard.
 *
 * There is no theme-alone pass here, and the absence is deliberate. This
 * file measures geometry, and the geometry of this row is a contest - the
 * host wraps, the theme grows; the host sets a 2px gap, the theme sets 4px.
 * Rendered with no host on the page the theme is talking to nobody, and the
 * numbers it produces are about a document Obsidian never builds.
 *
 * Chrome is REQUIRED, not optional. A skip there would be a gate reporting
 * green having measured nothing. If the browser is missing this file fails
 * and says how to fix it. A missing Obsidian install is the other case and
 * is treated the way test/toggles.test.mjs treats it: the host passes are
 * SKIPPED, loudly, naming what was not measured, because a visible skip is
 * honest and a silent downgrade to a stand-in is the bug at the top of this
 * comment.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { hostBuilds } from './obsidian-host.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const themeCss = readFileSync(resolve(repo, 'theme.css'), 'utf8');

const CHROME = process.env.CHROME_BIN
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/* Obsidian's own file-explorer toolbar, in the DOM order the host builds it
   (the `addNavButton` sequence read off the 1.13.7 asar: new note, new folder,
   sort, auto-reveal, collapse-all), with the two suite launchers appended
   after as plugins actually append them, and Obsidian's own stylesheet in
   front of the theme. The theme centers and reorders; the fixture is what it
   starts from.

   `lucide-edit` is the id 1.13.7 stamps on the new-note button, measured on
   the asar rather than assumed. The older `lucide-edit-3` and `lucide-pen-box`
   are still covered by the theme; they are not what this fixture renders,
   because the fixture's job is to be the host that exists.

   The body classes are the host's own defaults, not decoration: app.css
   hangs its variables off the theme class, and every spacing token this row
   reads - --size-4-2 on the header, --size-2-1 on the row - resolves
   through them. `icor-scaffold-chrome` is the scaffold's own toggle, OFF by
   default, and it is what src/85-chrome.css is guarded by: with it on the
   theme hides the host controls the scaffold relocated, with it off a
   community vault keeps every one of them. */
function fixture(host, { extraCss = '', scaffoldChrome = true, paneWidth = null } = {}) {
  const icon = (cls) =>
    `<svg class="${cls}" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>`;
  const btn = (id, svgCls, extra = '') =>
    `<div id="${id}" class="clickable-icon nav-action-button ${extra}">${icon(svgCls)}</div>`;
  return `<!doctype html><html><head><style>
  * { box-sizing: border-box; }
  body { margin: 0; }
  </style>
  <style>${host.css}</style>
  <style>
${themeCss}
${paneWidth === null ? '' : `  .workspace-leaf-content { width: ${paneWidth}px; }`}
${extraCss}
  </style></head>
  <body class="theme-dark mod-macos is-frameless obsidian-app${scaffoldChrome ? ' icor-scaffold-chrome' : ''}">
  <div class="workspace-leaf-content" data-type="file-explorer"><div class="nav-header">
    <div id="row" class="nav-buttons-container micor-tree-slot">
      ${btn('newnote', 'lucide-edit')}
      ${btn('newfolder', 'lucide-folder-plus')}
      ${btn('sort', 'lucide-sort-asc')}
      ${btn('autoreveal', 'lucide-gallery-vertical')}
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
  for (const id of ['newnote','newfolder','sort','autoreveal','collapse','focus','robot']) {
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
    rowGap: getComputedStyle(row).rowGap,
    headerPadding: getComputedStyle(document.querySelector('.nav-header')).padding,
  });
  </script></body></html>`;
}

const dir = mkdtempSync(join(tmpdir(), 'inkline-headerrow-'));
let shot = 0;

function measure(host, opts) {
  const file = join(dir, `f${shot++}.html`);
  writeFileSync(file, fixture(host, opts));
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

/* What the scaffold vault renders: the two launchers, plus the two host
   controls the scaffold keeps (auto-reveal, which Interface 0.7.0 restored
   and which is the host's own only route to the setting, and collapse-all,
   permanent under the 2026-08-30 ruling). */
const VISIBLE = ['focus', 'robot', 'autoreveal', 'collapse'];
/* Every control the fixture builds, which is what a community vault - one
   that installed INKLINE for its typography and never turned the scaffold
   toggle on - actually renders. */
const ALL = ['newnote', 'newfolder', 'sort', 'autoreveal', 'collapse', 'focus', 'robot'];

function gaps(m, ids = VISIBLE) {
  const ls = ids.map((id) => m.controls[id].left);
  const rs = ids.map((id) => m.controls[id].left + m.controls[id].width);
  return {
    left: Math.min(...ls),
    right: m.rowWidth - Math.max(...rs),
    span: Math.max(...rs) - Math.min(...ls),
  };
}

/* The one assertion in this file that reads the source rather than the
   render, and therefore the one that needs neither Chrome nor an install.
   The inset token is neither consumed nor restated: it existed to align the
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

/* The geometry set, once per Obsidian build on this machine. */
function suite(host) {
  const tag = ` [behind app.css ${host.version}]`;
  const m0 = (opts) => measure(host, opts);

  /* CARDINALITY FIRST. Every assertion below is about numbers the THEME
     produces. If the fixture stopped matching the theme's selectors, the
     numbers would be a bare flex row's defaults and the whole file would go
     green describing nothing. 24px controls and a 24px row are the theme's
     own values and nothing else in the fixture sets them.

     Auto-reveal is named here on purpose. It is the newest control on the
     row, it was absent from this fixture until 2026-09-17, and a roster that
     silently loses it again is exactly the drift that let Connect hide the
     button in the first place. */
  test('the fixture is actually being styled by theme.css' + tag, () => {
    assert.match(themeCss, /\.micor-tree-slot\s*\{/, 'the slot rule is gone from theme.css');
    const m = m0();
    assert.equal(m.rowHeight, 24, 'the row is not 24px tall, so theme.css did not apply to the fixture');
    for (const id of VISIBLE) {
      assert.ok(m.controls[id], `${id} is not rendered at all`);
      assert.equal(m.controls[id].width, 24, `${id} is not 24px wide, so the theme's control rule missed it`);
    }
    assert.equal(m.controls.newnote, null,
      'the theme\'s own new-note hide did not take under body.icor-scaffold-chrome. On 1.13.7 the '
      + 'host stamps `lucide-edit`; a theme that only names `lucide-edit-3` and `lucide-pen-box` '
      + 'matches nothing here and survives in the app only on the English aria label');
  });

  /* Both halves of the toggle, in one place, because the toggle is the
     product decision and a gate that only ever measured one side could not
     tell "hidden by the scaffold" from "never rendered". */
  test('auto-reveal renders in both passes' + tag, () => {
    for (const scaffoldChrome of [true, false]) {
      const m = m0({ scaffoldChrome });
      assert.ok(m.controls.autoreveal,
        `auto-reveal does not render with the scaffold toggle ${scaffoldChrome ? 'on' : 'off'}; `
        + 'it is the host\'s only route to that setting and nothing in this theme may hide it');
      assert.equal(m.controls.autoreveal.width, 24,
        'auto-reveal is not 24px wide, so this file is measuring the old roster');
    }
  });

  /* THE HOST IS ON THE PAGE AND IS THE ONE THE THEME HAS TO BEAT. Without
     this, a fixture that loaded an app.css the selectors never reached would
     be indistinguishable from the stand-in it replaced, and every number
     below would again be measured against nobody. Two host declarations
     touch this row and both are checked: the header's padding, which sets
     how much width the row has to work with, and the row's own gap, which
     app.css puts at --size-2-1 and the theme overrides at 4px. The second is
     a contest the old stand-in never staged. */
  test('app.css is in front of the theme, and the theme wins the gap' + tag, () => {
    const m = m0();
    assert.match(m.headerPadding, /^8px$/,
      `the nav-header reports ${m.headerPadding} of padding; app.css ${host.version} sets `
      + '--size-4-2 there, so a different number means the host sheet did not reach this '
      + 'fixture and the row is being measured in a document Obsidian never builds');
    assert.equal(m.rowGap, '4px',
      `the row's gap is ${m.rowGap}; app.css sets --size-2-1 (2px) on .nav-buttons-container `
      + 'and the theme sets 4px on .micor-tree-slot. 2px means the theme lost that contest, '
      + 'and the wrapped-row height below is computed from the 4px');
  });

  /* The ruling itself: collapse-all is PERMANENT. No state class, no gating -
     the fixture carries no micor-can-collapse and the control must render. */
  test('collapse-all renders unconditionally' + tag, () => {
    const m = m0();
    assert.ok(m.controls.collapse,
      'collapse-all does not render without a state class; the conditional gating was supposed '
      + 'to be withdrawn (user ruling, 2026-08-30)');
  });

  /* The ruling's other half: the cluster is CENTERED in the row. Centered
     means anchored to the row's own box - equal space both sides - and to
     nothing else: not the banner, not the room glyph column. */
  test('the cluster is centered in the row' + tag, () => {
    const g = gaps(m0());
    assert.ok(Math.abs(g.left - g.right) <= 1,
      `the cluster sits ${g.left}px from the left and ${g.right}px from the right; `
      + 'a centered row has equal space both sides (1px rounding allowed)');
  });

  /* THE ORDER, ruled by Iris 2026-09-17. Two groups and one boundary: every
     suite launcher at order 0 in the order its plugin created it, every HOST
     control at order 1, and inside that group nothing is ranked - flex ties
     break on DOM order, so the host's own `addNavButton` sequence decides and
     there is no per-control rank in the stylesheet to drift.
     No separator glyph and no wider gap at the boundary; it reads by glyph
     vocabulary, destinations then panel verbs. */
  test('launchers first, then the host controls in the host\'s own order' + tag, () => {
    const m = m0();
    const order = ['focus', 'robot', 'autoreveal', 'collapse'];
    const lefts = order.map((id) => m.controls[id].left);
    assert.deepEqual([...lefts].sort((a, b) => a - b), lefts,
      'with the scaffold toggle on, the row does not read launchers then host controls.\n'
      + JSON.stringify(m.controls, null, 2));
  });

  test('the community row keeps the same boundary with every control on it' + tag, () => {
    const m = m0({ scaffoldChrome: false });
    const order = ['focus', 'robot', 'newnote', 'newfolder', 'sort', 'autoreveal', 'collapse'];
    const lefts = order.map((id) => m.controls[id].left);
    assert.deepEqual([...lefts].sort((a, b) => a - b), lefts,
      'with the scaffold toggle off, the seven controls do not read launchers then the host\'s '
      + 'own DOM order (new note, new folder, sort, auto-reveal, collapse-all).\n'
      + JSON.stringify(m.controls, null, 2));
  });

  /* The stated widths, which are specs rather than observations: four
     controls at 24px with 4px gaps occupy 108px, seven occupy 192px. They are
     here so a future gap or size change has to be a deliberate edit to this
     file rather than a silent drift. */
  test('the settled width is the specified 108' + tag, () => {
    assert.equal(gaps(m0()).span, 108, 'four controls no longer occupy 108px');
  });

  test('the community row settles at the specified 192' + tag, () => {
    const m = m0({ scaffoldChrome: false });
    assert.equal(gaps(m, ALL).span, 192, 'seven controls no longer occupy 192px');
    const g = gaps(m, ALL);
    assert.ok(Math.abs(g.left - g.right) <= 1,
      `the community cluster sits ${g.left}px from the left and ${g.right}px from the right; `
      + 'the centering is the theme\'s and does not depend on which controls the vault shows');
  });

  /* THE NARROW-PANE GATE. Reported by Olivier Van Biervliet, theme channel,
   * 2026-09-14; ruled by Iris 2026-09-15, re-measured for the seven-control
   * roster 2026-09-17.
   *
   * The wrap is the HOST's decision, not the theme's: Obsidian's own
   * `.nav-buttons-container` ships `flex-wrap: wrap`, and a narrow sidebar is
   * a supported sidebar. What the theme owes is a box that GROWS when the host
   * uses that wrap. A fixed `height` cannot grow, so the second line renders
   * outside the row and paints over the file tree below it.
   *
   * 180px of pane is the smallest real case, and it is measured rather than
   * argued: the scaffold toggle is off, because the vault that reported this
   * is a community vault that installed the theme for its typography and never
   * turned the toggle on, so every host control and both launchers render. At
   * a 180px pane the host's own nav-header padding (--size-4-2, 8px a side)
   * and the theme's own 8px side padding leave the row 148px of content; five
   * 24px controls with 4px gaps want 136px and fit, the remaining two wrap.
   * Two 24px lines with the row's own 4px gap between them is 52px. Every one
   * of those numbers comes off app.css or theme.css, none off a stand-in.
   *
   * The second assertion is the defect itself stated as geometry. Row height
   * alone is not enough: a row could report 52px and still let a control hang
   * below its own box. Nothing may sit past the bottom edge, because past the
   * bottom edge is the tree.
   */
  test('the row grows to fit when the host wraps it' + tag, () => {
    const m = m0({ paneWidth: 180, scaffoldChrome: false });

    const secondLine = ALL.filter((id) => m.controls[id] && m.controls[id].top >= 24);
    assert.deepEqual(secondLine.sort(), ['autoreveal', 'collapse'].sort(),
      'the wrap did not put exactly auto-reveal and collapse-all on the second line, so this '
      + 'gate is measuring a different row than the one it describes and would go green on a '
      + `row that never grew.\n${JSON.stringify(m, null, 2)}`);

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
  test('the harness can see a packed row when handed one' + tag, () => {
    const g = gaps(m0({
      extraCss: '.micor-tree-slot { justify-content: flex-start !important; }',
    }));
    assert.ok(Math.abs(g.left - g.right) > 10,
      `the harness reports a planted flex-start row as centered (left ${g.left}, right ${g.right}); `
      + 'it cannot be trusted to detect the defect it exists to catch');
  });
}

const hosts = hostBuilds();
if (hosts.length === 0) {
  test('the header row, behind Obsidian\'s own app.css', {
    skip: 'no Obsidian install found on this machine, so the header row was NOT measured. '
      + 'Every number this file checks - the 108px cluster, the 192px community cluster, the '
      + '52px wrapped row, the no-overlap bound - is a consequence of app.css and theme.css '
      + 'together, and the hand-written stand-in for app.css that used to stand here is what '
      + 'let the 1.6.0 overlap through. Install Obsidian, or point OBSIDIAN_ASAR at an '
      + 'obsidian.asar, to run this gate.',
  }, () => {});
} else {
  for (const host of hosts) suite(host);
}
