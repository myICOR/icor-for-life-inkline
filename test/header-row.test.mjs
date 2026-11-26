/* THE HEADER-ROW GATE: the file-tree button row is Obsidian's (1.9.0).
 *
 * Until 1.8.0 the theme drew `.micor-tree-slot` - the class myICOR Connect put
 * on Obsidian's `.nav-buttons-container` - as a branded launcher row: centred
 * on a 24px grid, its own 4px gap and 8px margin, every suite launcher ranked
 * before the host's controls, all of it measured here. On 2026-11-23 Tom moved
 * every plugin launcher into Obsidian's left ribbon, so what is left in the row
 * is Obsidian's own (new note, new folder, sort, auto-reveal, collapse), and
 * the theme stops styling the slot. The gate now asserts the opposite of what
 * it used to: with the theme on, the row is laid out exactly as app.css lays
 * it out with the theme off, and the tree still sits right under the header.
 *
 * WHY THE HOST STYLESHEET IS IN THE DOCUMENT. "Looks native" is a comparison
 * with the host, and a comparison needs the host on the page: app.css is read
 * out of the Obsidian installs on this machine (test/obsidian-host.mjs) and the
 * same fixture is rendered twice per build, once with the theme and once
 * without, and the two are compared. When no install is found the host passes
 * are SKIPPED, loudly, because a stand-in for app.css is the second copy that
 * drifted into 1.6.0.
 *
 * The scaffold's dated hides (src/85-chrome.css, behind icor-scaffold-chrome)
 * are a product decision and are unchanged; they are checked here so the row
 * the ICOR for Life vault renders is measured too.
 *
 * Chrome is REQUIRED: a skip would be a gate reporting green having measured
 * nothing. THEME_CSS=<path> renders another build.
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
const themeCss = readFileSync(process.env.THEME_CSS || resolve(repo, 'theme.css'), 'utf8');
const rules = themeCss.replace(/\/\*[\s\S]*?\*\//g, '');

const CHROME = process.env.CHROME_BIN
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/* Obsidian's file-explorer toolbar in the DOM order the host builds it (the
   `addNavButton` sequence: new note, new folder, sort, auto-reveal, collapse).
   No launchers: they are in the ribbon now. The row still carries Connect's
   `micor-tree-slot` class, because a Connect build from before the move puts
   it there and the theme must ignore it. Under the header, the tree. */
const CONTROLS = ['newnote', 'newfolder', 'sort', 'autoreveal', 'collapse'];
function fixture(host, { theme = true, extraCss = '', scaffoldChrome = false, paneWidth = 260, empty = false } = {}) {
  const icon = (cls) => `<svg class="${cls}" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>`;
  const btn = (id, svgCls) => `<div id="${id}" class="clickable-icon nav-action-button">${icon(svgCls)}</div>`;
  return `<!doctype html><html><head><style>
  * { box-sizing: border-box; }
  body { margin: 0; }
  .workspace-leaf-content { width: ${paneWidth}px; }
  </style>
  <style>${host.css}</style>
  <style>${theme ? themeCss : ''}
${extraCss}</style></head>
  <body class="theme-dark mod-macos is-frameless obsidian-app${scaffoldChrome ? ' icor-scaffold-chrome' : ''}">
  <div class="workspace-leaf-content" data-type="file-explorer">
    <div class="nav-header" id="header">
      <div id="row" class="nav-buttons-container micor-tree-slot">${empty ? '' : `
        ${btn('newnote', 'lucide-edit')}
        ${btn('newfolder', 'lucide-folder-plus')}
        ${btn('sort', 'lucide-sort-asc')}
        ${btn('autoreveal', 'lucide-gallery-vertical')}
        ${btn('collapse', 'lucide-chevrons-down-up')}`}
      </div>
    </div>
    <div class="nav-files-container" id="tree"><div class="tree-item nav-folder mod-root"><div class="nav-folder-children">
      <div class="tree-item nav-folder"><div id="first" class="tree-item-self nav-folder-title" data-path="Notes">
        <div class="tree-item-inner nav-folder-title-content">Notes</div></div></div>
      <div class="tree-item nav-folder"><div id="second" class="tree-item-self nav-folder-title" data-path="Ideas">
        <div class="tree-item-inner nav-folder-title-content">Ideas</div></div></div>
    </div></div></div>
  </div>
  <pre id="out"></pre>
  <script>
  const rect = (el) => el.getBoundingClientRect();
  const row = document.getElementById('row');
  const r = rect(row);
  const controls = {};
  for (const id of ${JSON.stringify(CONTROLS)}) {
    const el = document.getElementById(id);
    if (!el) { controls[id] = 'absent'; continue; }
    const cs = getComputedStyle(el);
    if (cs.display === 'none') { controls[id] = null; continue; }
    const b = rect(el);
    controls[id] = { left: Math.round(b.left - r.left), top: Math.round(b.top - r.top),
      width: Math.round(b.width), height: Math.round(b.height), padding: cs.padding };
  }
  const rcs = getComputedStyle(row);
  const h = rect(document.getElementById('header'));
  document.getElementById('out').textContent = JSON.stringify({
    controls,
    row: { width: Math.round(r.width), height: Math.round(r.height), gap: rcs.columnGap,
      justify: rcs.justifyContent, padding: rcs.padding, margin: rcs.margin,
      top: Math.round(r.top - h.top), bottom: Math.round(r.bottom) },
    header: { top: Math.round(h.top), bottom: Math.round(h.bottom), height: Math.round(h.height) },
    first: Math.round(rect(document.getElementById('first')).top),
    second: Math.round(rect(document.getElementById('second')).top),
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
    assert.fail(`could not run Chrome at ${CHROME}. This gate MEASURES layout and fails rather `
      + `than skipping. Set CHROME_BIN. Underlying error: ${e && e.message}`);
  }
  const m = dom.match(/<pre id="out">([^<]*)<\/pre>/);
  assert.ok(m && m[1], 'the fixture produced no measurement; the page script did not run');
  return JSON.parse(m[1]);
}

/* The row's own layout, without the header's position (the banner above it is
   the theme's and moves the row down; that is not the row's look). Colour and
   corner are left out on purpose: they come from the theme's tokens for every
   icon button in Obsidian (--clickable-icon-radius, the icon inks), which is
   what native looks like under this theme. What this compares is everything
   the 1.8.0 slot rule changed: size, padding, gap, alignment, margin. */
const layout = (m) => ({ controls: m.controls, width: m.row.width, height: m.row.height,
  gap: m.row.gap, justify: m.row.justify, padding: m.row.padding, margin: m.row.margin });

/* SOURCE, needing neither Chrome nor an install. */
test('no rule styles the launcher slot any more', () => {
  assert.doesNotMatch(rules, /\.micor-tree-slot\b/,
    'theme.css still has a rule on .micor-tree-slot; the launchers moved to the ribbon and the row is Obsidian\'s');
  /* What may still reach the row: the scaffold's dated hides, each one a
     display:none on a named host control, behind icor-scaffold-chrome. */
  for (const m of rules.matchAll(/([^{}]*\.nav-buttons-container[^{}]*)\{([^}]*)\}/g)) {
    assert.match(m[1], /icor-scaffold-chrome/,
      `a rule outside the scaffold switch reaches the button row:\n${m[1].trim().slice(0, 200)}`);
    assert.match(m[2].trim(), /^display:\s*none;?$/,
      `a rule on the button row does more than hide a control: ${m[2].trim()}`);
  }
});

test('the banner inset is read by the banner and the anchor, and nothing else', () => {
  const readers = rules.match(/var\(--icor-header-inset\)/g) || [];
  assert.equal(readers.length, 2,
    `--icor-header-inset has ${readers.length} reader(s); it exists for the painted banner and the anchor`);
  const declared = rules.match(/--icor-header-inset\s*:/g) || [];
  assert.equal(declared.length, 1, 'the inset is declared more than once');
});

function suite(host) {
  const tag = ` [behind app.css ${host.version}]`;

  /* CARDINALITY FIRST: the fixture has to be styled by both sheets, or the
     equality below compares two unstyled rows. The banner is the theme's
     (it moves the row down), the row's flex and wrap are the host's. */
  test('the fixture is styled by app.css and by theme.css' + tag, () => {
    const on = measure(host);
    const off = measure(host, { theme: false });
    assert.equal(off.row.justify, 'center', 'app.css did not reach the row');
    assert.ok(on.row.top > off.row.top + 20,
      `the row sits ${on.row.top}px into the header with the theme and ${off.row.top}px without; `
      + 'the theme\'s banner did not paint, so theme.css did not reach the fixture');
  });

  for (const scaffoldChrome of [false, true]) {
    const which = scaffoldChrome ? 'the scaffold row' : 'the community row';
    test(`${which} is laid out exactly as Obsidian lays it out` + tag, () => {
      const on = layout(measure(host, { scaffoldChrome }));
      const off = layout(measure(host, { theme: false }));
      if (scaffoldChrome) {
        /* the hides are the scaffold's; compare what remains with the host
           row that has the same controls */
        for (const id of ['newnote', 'newfolder', 'sort']) {
          assert.equal(on.controls[id], null, `${id} survives icor-scaffold-chrome`);
        }
        const offSame = layout(measure(host, { theme: false,
          extraCss: '#newnote, #newfolder, #sort { display: none; }' }));
        assert.deepEqual(on, offSame,
          'with the scaffold switch on, the row the theme renders differs from Obsidian\'s row '
          + 'with the same controls hidden');
      } else {
        assert.deepEqual(on, off, 'the theme still changes the button row\'s layout');
      }
    });
  }

  test('auto-reveal and collapse-all render with the switch on and off' + tag, () => {
    for (const scaffoldChrome of [false, true]) {
      const m = measure(host, { scaffoldChrome });
      for (const id of ['autoreveal', 'collapse']) {
        assert.ok(m.controls[id], `${id} does not render with the scaffold switch ${scaffoldChrome ? 'on' : 'off'}`);
      }
    }
  });

  /* THE TREE SITS RIGHT: under the header, never under the row. Full row,
     scaffold row, a narrow pane where the host wraps the row, and a row a
     plugin has emptied. */
  const cases = {
    'a full row': {},
    'the scaffold row': { scaffoldChrome: true },
    'a 180px pane, where the host wraps the row': { paneWidth: 180 },
    'an empty row': { empty: true },
  };
  for (const [name, opts] of Object.entries(cases)) {
    test(`the tree starts below the header with ${name}` + tag, () => {
      const m = measure(host, opts);
      assert.ok(m.row.bottom <= m.header.bottom,
        `the row ends at ${m.row.bottom}px, below the header's ${m.header.bottom}px: it paints over the tree`);
      assert.ok(m.first >= m.header.bottom,
        `the first folder starts at ${m.first}px, inside the header (ends ${m.header.bottom}px)`);
      assert.ok(m.second > m.first, 'the folder rows overlap');
      for (const [id, c] of Object.entries(m.controls)) {
        if (c && c !== 'absent') {
          assert.ok(c.top + c.height <= m.row.height, `${id} hangs below its own row`);
        }
      }
    });
  }

  test('an empty row takes no room above the tree' + tag, () => {
    const empty = measure(host, { empty: true });
    const offEmpty = measure(host, { theme: false, empty: true });
    assert.equal(empty.row.height, 0, `an empty row is ${empty.row.height}px tall`);
    assert.equal(empty.row.height, offEmpty.row.height, 'the theme gives the empty row a height Obsidian does not');
  });

  /* NEGATIVE CONTROL: hand the harness the 1.8.0 slot rule and it must see a
     row that is no longer Obsidian's. */
  test('the harness can see a branded row when handed one' + tag, () => {
    const on = layout(measure(host, { extraCss:
      '.micor-tree-slot { gap: 4px; margin-bottom: 8px; padding: 0 8px; }'
      + ' .micor-tree-slot .clickable-icon { width: 24px; height: 24px; padding: 0; }' }));
    const off = layout(measure(host, { theme: false }));
    assert.notDeepEqual(on, off, 'the harness reports the planted 1.8.0 slot as Obsidian\'s own row');
  });
}

const hosts = hostBuilds();
if (hosts.length === 0) {
  test('the header row, behind Obsidian\'s own app.css', {
    skip: 'no Obsidian install found on this machine, so the button row was NOT compared with '
      + 'Obsidian\'s. Install Obsidian, or point OBSIDIAN_ASAR at an obsidian.asar, to run this gate.',
  }, () => {});
} else {
  for (const host of hosts) suite(host);
}
