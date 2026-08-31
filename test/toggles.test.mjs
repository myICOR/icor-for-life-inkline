/* Every toggle, measured in a real engine.
 *
 * WHY THIS IS NOT A STRING MATCH. The first version of this gate asserted that
 * a default-ON feature carries a `:not(.x)` guard. It went red on
 * `inkline-no-hand`, correctly, because the theme encodes "on by default" two
 * different ways and both are right:
 *
 *   a guard    body:not(.icor-hide-banner) .banner { ... }   absent = shown
 *   a reset    body.inkline-no-hand { --ink-font-hand: ... } absent = hand
 *
 * A test that reads the CSS has to know which encoding each feature uses,
 * which means it is a second copy of the answer rather than a check on it. So
 * this one renders the page and looks. The question every toggle has to answer
 * is behavioural anyway: with no classes on <body>, is the feature on or off,
 * and does adding the class flip it?
 *
 * THE DEFAULTS ARE THE POINT. Three of the five are on out of the box because
 * they are what the theme IS. Two are off because they take a control away
 * from Obsidian - the ribbon, and three toolbar buttons - and a theme that
 * removes a stranger's navigation on install has broken their vault. The
 * ICOR for Life scaffold turns those two on for its own vault, where every one
 * of those routes exists somewhere else.
 *
 * WHAT THIS FILE DOES NOT COVER, stated so its silence never reads as
 * completeness: the fixture renders the INK room only. The paper room's
 * selectors start `.theme-light`, which is a class ON body, so a guard placed
 * in front of it as an ancestor kills 38 rules silently and this file would
 * not notice. That exact shape has its own gate in build.test.mjs ("no guard
 * was prepended in front of a body-level class"), watched going red on
 * 2026-08-31 by moving .theme-light out of BODY_LEVEL in build.mjs.
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

/* One page carrying a probe for each toggle: the sidebar header where the
   banner is painted, a room folder, the ribbon, the toolbar's sort button, and
   a blockquote for the handwritten layer. Obsidian's own markup, reduced to
   the parts the guards touch. */
function fixture(bodyClass) {
  return `<!doctype html><html><head><style>
  * { box-sizing: border-box; }
  body { margin: 0; width: 900px; }
  .workspace-ribbon.mod-left { width: 44px; height: 200px; }
  .nav-header { width: 250px; }
  .workspace-sidedock-vault-profile { height: 30px; }
${themeCss}
  </style></head><body class="theme-dark ${bodyClass}">
  <div class="workspace">
    <div class="workspace-ribbon mod-left"><div class="side-dock-actions"></div></div>
    <div class="workspace-leaf-content" data-type="file-explorer">
      <div class="nav-header">
        <div class="nav-buttons-container micor-tree-slot">
          <div id="sort" class="clickable-icon nav-action-button">
            <svg class="lucide-sort-asc" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>
          </div>
        </div>
      </div>
      <div class="nav-files-container">
        <div class="nav-folder">
          <div id="room" class="nav-folder-title" data-path="04 Inner World">
            <div id="roomlabel" class="nav-folder-title-content">04 Inner World</div>
          </div>
        </div>
      </div>
    </div>
    <div class="workspace-sidedock-vault-profile" id="vault"></div>
  </div>
  <div class="markdown-reading-view"><div class="markdown-preview-view markdown-rendered">
    <blockquote id="quote"><p>a margin note</p></blockquote>
  </div></div>
  <pre id="out"></pre>
  <script>
  const px = (v) => Math.round(parseFloat(v) || 0);
  const header = document.querySelector('.nav-header');
  const before = getComputedStyle(header, '::before');
  const label  = getComputedStyle(document.getElementById('roomlabel'), '::before');
  const read = (el) => { const cs = getComputedStyle(el); return cs.display === 'none' ? null : cs; };
  document.getElementById('out').textContent = JSON.stringify({
    /* the banner paints as a ::before with a background image */
    banner: before.display !== 'none' && before.backgroundImage !== 'none',
    /* a room carries an inked glyph, drawn as a masked ::before on its label */
    roomGlyph: label.display !== 'none'
      && (label.maskImage !== 'none' || label.webkitMaskImage !== 'none'),
    /* and the numeric prefix is replaced by the room's own word */
    roomLabel: (label.content || '') + '|' + (getComputedStyle(
      document.getElementById('roomlabel'), '::after').content || ''),
    ribbon: !!read(document.querySelector('.workspace-ribbon.mod-left')),
    sort: !!read(document.getElementById('sort')),
    vaultProfile: !!read(document.getElementById('vault')),
    /* the handwritten layer is a different family at a bigger size */
    quoteFont: getComputedStyle(document.getElementById('quote')).fontFamily,
    quoteSize: px(getComputedStyle(document.getElementById('quote')).fontSize),
  });
  </script></body></html>`;
}

const dir = mkdtempSync(join(tmpdir(), 'inkline-toggles-'));
let shot = 0;
const cache = new Map();

function render(bodyClass = '') {
  if (cache.has(bodyClass)) return cache.get(bodyClass);
  const file = join(dir, `t${shot++}.html`);
  writeFileSync(file, fixture(bodyClass));
  let dom;
  try {
    dom = execFileSync(CHROME, [
      '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      '--virtual-time-budget=2000', '--dump-dom', `file://${file}`,
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    assert.fail(
      `could not run Chrome at ${CHROME}. This gate MEASURES what the toggles do and cannot be `
      + `approximated by reading the CSS - that was the previous version of it and it was wrong. `
      + `Set CHROME_BIN. Underlying error: ${e && e.message}`);
  }
  const m = dom.match(/<pre id="out">([^<]*)<\/pre>/);
  assert.ok(m && m[1], 'the fixture produced no measurement; the page script did not run');
  const parsed = JSON.parse(m[1]);
  cache.set(bodyClass, parsed);
  return parsed;
}

/* ---------------------------------------------------------------------------
   THE DEFAULTS. No classes on body: what a theme-store user sees on install.
   --------------------------------------------------------------------------- */

test('out of the box the theme is itself: banner, rooms and handwriting are on', () => {
  const d = render();
  assert.ok(d.banner, 'no banner is painted on a fresh install');
  assert.ok(d.roomGlyph, 'a 00-06 room draws no icon on a fresh install');
  assert.ok(/Caveat/i.test(d.quoteFont),
    `a blockquote renders in ${d.quoteFont}, not the handwriting face`);
});

test('out of the box the theme takes nothing away from Obsidian', () => {
  const d = render();
  assert.ok(d.ribbon,
    'the left ribbon is hidden on a fresh install. A theme that removes a navigation surface '
    + 'from a stranger\'s vault on install has broken it to make a point about ours.');
  assert.ok(d.sort,
    'the Change sort order button is hidden on a fresh install, and it is sort\'s only route: '
    + 'no Obsidian command changes sort order, so this removes the function from their vault');
  assert.ok(d.vaultProfile, 'the vault switcher is hidden on a fresh install');
});

/* ---------------------------------------------------------------------------
   THE FLIPS. Each class does what its settings entry promises, and nothing
   more: a toggle that also moved something else would be a switch the user
   cannot predict.
   --------------------------------------------------------------------------- */

test('icor-hide-banner removes the banner and leaves the rooms alone', () => {
  const d = render('icor-hide-banner');
  assert.equal(d.banner, false, 'the banner still paints with .icor-hide-banner on body');
  assert.ok(d.roomGlyph, 'hiding the banner also took the room icons');
});

test('icor-rooms-off returns the rooms to Obsidian and leaves the banner alone', () => {
  const d = render('icor-rooms-off');
  assert.equal(d.roomGlyph, false, 'a room still draws its icon with .icor-rooms-off on body');
  assert.ok(d.roomLabel.startsWith('none'),
    `the room label is still rewritten (${d.roomLabel}); the numeric prefix should come back`);
  assert.ok(d.banner, 'turning off the rooms also took the banner');
});

test('inkline-no-hand returns the handwritten layer to the body face', () => {
  const on = render();
  const off = render('inkline-no-hand');
  assert.ok(/Caveat/i.test(on.quoteFont), 'the default is not the handwriting face');
  assert.ok(!/Caveat/i.test(off.quoteFont),
    `a blockquote still renders in ${off.quoteFont} with .inkline-no-hand on body`);
  assert.ok(off.quoteSize < on.quoteSize,
    `the handwriting size ${on.quoteSize}px did not come down (${off.quoteSize}px); the layer `
    + 'returns as body text at handwriting size');
});

test('icor-hide-ribbon hides the ribbon, and only when asked', () => {
  assert.ok(render().ribbon, 'the ribbon is already gone before the toggle is touched');
  assert.equal(render('icor-hide-ribbon').ribbon, false,
    'the ribbon survives .icor-hide-ribbon, so the scaffold cannot turn it off');
});

test('icor-scaffold-chrome hides the toolbar buttons and the vault switcher', () => {
  const d = render('icor-scaffold-chrome');
  assert.equal(d.sort, false, 'the sort button survives .icor-scaffold-chrome');
  assert.equal(d.vaultProfile, false, 'the vault switcher survives .icor-scaffold-chrome');
  assert.ok(d.banner, 'reducing the chrome also took the banner');
  assert.ok(d.roomGlyph, 'reducing the chrome also took the room icons');
});

/* ---------------------------------------------------------------------------
   The state the ICOR for Life scaffold actually ships, in one render, because
   four toggles that each work alone can still collide with each other.
   --------------------------------------------------------------------------- */

test('the scaffold preset renders the vault ICOR for Life expects', () => {
  const d = render('icor-scaffold-chrome icor-hide-ribbon');
  assert.ok(d.banner, 'the scaffold vault has no banner');
  assert.ok(d.roomGlyph, 'the scaffold vault has no room icons');
  assert.ok(/Caveat/i.test(d.quoteFont), 'the scaffold vault lost the handwritten layer');
  assert.equal(d.ribbon, false, 'the scaffold vault still shows the ribbon');
  assert.equal(d.sort, false, 'the scaffold vault still shows the sort button');
  assert.equal(d.vaultProfile, false, 'the scaffold vault still shows the vault switcher');
});
