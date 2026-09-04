/* Every toggle, measured in a real engine, with Obsidian's own stylesheet in
 * front of the theme.
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
 * WHY THE HOST STYLESHEET IS IN THE DOCUMENT. The second version of this gate
 * rendered theme.css alone, and every "still hidden" it reported proved only
 * that the theme's rule MATCHED the element, never that it BEAT app.css. On
 * 2026-09-04 that green covered a regression: the vault-switcher hide lost
 * its !important, the host sets `display: var(--vault-profile-display)` on
 * that row at (0,4,1), the theme's (0,2,1) rule lost, and this file stayed
 * green because the host was not on the page (Flint, review of 1.6.0). So
 * the fixture now loads app.css from the Obsidian install on this machine,
 * every build of it that can be found, and runs the whole toggle set once per
 * build in front of the theme, plus once with the theme alone. The theme-alone
 * pass still proves the rules match; the host passes prove they win. When no
 * install is found the host passes are SKIPPED with a message, never quietly
 * reduced to the theme-alone pass, because a skip is visible and a silent
 * downgrade is exactly the false green this paragraph is about.
 *
 * app.css is read out of Obsidian's asar at test time and never written into
 * the repo: it is Obsidian's file, not ours.
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
import {
  readFileSync, writeFileSync, mkdtempSync, existsSync, readdirSync,
  openSync, readSync, closeSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { tmpdir, homedir } from 'node:os';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const themeCss = readFileSync(resolve(repo, 'theme.css'), 'utf8');
const CHROME = process.env.CHROME_BIN
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/* ---------------------------------------------------------------------------
   THE HOST. Obsidian ships app.css inside an asar archive; the format is a
   16-byte header, a JSON directory, then every file's bytes back to back. Ten
   lines read one entry out of it, which is cheaper than a dependency in a repo
   that has none, and it works offline.
   --------------------------------------------------------------------------- */

function readAsarEntry(asar, name) {
  const fd = openSync(asar, 'r');
  try {
    const head = Buffer.alloc(16);
    readSync(fd, head, 0, 16, 0);
    const pickleSize = head.readUInt32LE(4);
    const jsonLen = head.readUInt32LE(12);
    const json = Buffer.alloc(jsonLen);
    readSync(fd, json, 0, jsonLen, 16);
    let node = JSON.parse(json.toString('utf8'));
    for (const seg of name.split('/')) node = node && node.files && node.files[seg];
    if (!node || node.size === undefined) return null;
    const buf = Buffer.alloc(node.size);
    readSync(fd, buf, 0, node.size, 8 + pickleSize + Number(node.offset));
    return buf;
  } finally {
    closeSync(fd);
  }
}

/* Where an install keeps its asar. The installer's copy sits in the app
   bundle; every in-app update lands a versioned copy beside the config, and
   the app runs the newest of those. Both are worth rendering against, because
   the two builds on the reviewing machine have disagreed on plenty before.
   OBSIDIAN_ASAR names one more, for a machine laid out differently. */
function hostCandidates() {
  const home = homedir();
  const versioned = (dir) => (existsSync(dir)
    ? readdirSync(dir).filter((f) => /^obsidian-.*\.asar$/.test(f)).map((f) => join(dir, f))
    : []);
  const list = [];
  if (process.env.OBSIDIAN_ASAR) list.push(process.env.OBSIDIAN_ASAR);
  list.push('/Applications/Obsidian.app/Contents/Resources/obsidian.asar');
  list.push(...versioned(join(home, 'Library', 'Application Support', 'obsidian')));
  list.push(...versioned(join(home, '.config', 'obsidian')));
  list.push('/opt/Obsidian/resources/obsidian.asar');
  if (process.env.APPDATA) list.push(...versioned(join(process.env.APPDATA, 'obsidian')));
  if (process.env.LOCALAPPDATA) {
    list.push(join(process.env.LOCALAPPDATA, 'Obsidian', 'resources', 'obsidian.asar'));
  }
  return list.filter((p) => existsSync(p));
}

function hostBuilds() {
  const byVersion = new Map();
  for (const asar of hostCandidates()) {
    let pkg, css;
    try {
      pkg = readAsarEntry(asar, 'package.json');
      css = readAsarEntry(asar, 'app.css');
    } catch {
      continue;
    }
    if (!pkg || !css) continue;
    const version = JSON.parse(pkg.toString('utf8')).version;
    if (!byVersion.has(version)) byVersion.set(version, { version, asar, css: css.toString('utf8') });
  }
  return [...byVersion.values()].sort((a, b) => a.version.localeCompare(b.version, 'en', { numeric: true }));
}

/* One page carrying a probe for each toggle: the sidebar header where the
   banner is painted, a room folder, the ribbon, the toolbar's sort button, the
   vault-switcher row, and a blockquote for the handwritten layer. Obsidian's
   own markup, reduced to the parts the guards touch, and nested the way the
   app nests it: the vault row is a direct child of the left sidedock split,
   because that is the ancestor chain the host's own rule on it requires.

   `show-ribbon` is on body because Obsidian puts it there by default; without
   it the host hides the ribbon on its own and the theme would get credit for a
   hide it never made. The theme does not read the class. */
function fixture(bodyClass, host) {
  return `<!doctype html><html><head><style>
  * { box-sizing: border-box; }
  body { margin: 0; width: 900px; }
  .workspace-ribbon.mod-left { width: 44px; height: 200px; }
  .nav-header { width: 250px; }
  .workspace-sidedock-vault-profile { height: 30px; }
  </style>
  <style>${host ? host.css : ''}</style>
  <style>${themeCss}</style></head>
  <body class="theme-dark mod-macos is-frameless show-ribbon obsidian-app ${bodyClass}">
  <div class="app-container"><div class="horizontal-main-container"><div class="workspace">
    <div class="workspace-ribbon side-dock-ribbon mod-left"><div class="side-dock-actions"></div></div>
    <div class="workspace-split mod-horizontal mod-sidedock mod-left-split">
      <div class="workspace-tabs mod-top mod-top-left-space"><div class="workspace-leaf">
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
      </div></div>
      <div id="vault" class="workspace-sidedock-vault-profile">
        <div class="workspace-drawer-vault-switcher">
          <div class="workspace-drawer-vault-switcher-icon"></div>
          <div class="workspace-drawer-vault-name">ICOR for Life</div>
        </div>
        <div class="workspace-drawer-vault-actions"></div>
      </div>
    </div>
  </div></div></div>
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

function render(host, bodyClass = '') {
  const key = `${host ? host.version : ''}|${bodyClass}`;
  if (cache.has(key)) return cache.get(key);
  const file = join(dir, `t${shot++}.html`);
  writeFileSync(file, fixture(bodyClass, host));
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
  cache.set(key, parsed);
  return parsed;
}

/* The toggle set, once per document shape. `host` is null for the theme
   alone and a build for the theme behind app.css. */
function suite(host) {
  const tag = host ? ` [behind app.css ${host.version}]` : ' [theme alone]';
  const r = (bodyClass) => render(host, bodyClass);

  /* -------------------------------------------------------------------------
     THE DEFAULTS. No classes on body: what a theme-store user sees on install.
     ------------------------------------------------------------------------- */

  test('out of the box the theme is itself: banner, rooms and handwriting are on' + tag, () => {
    const d = r();
    assert.ok(d.banner, 'no banner is painted on a fresh install');
    assert.ok(d.roomGlyph, 'a 00-06 room draws no icon on a fresh install');
    assert.ok(/Caveat/i.test(d.quoteFont),
      `a blockquote renders in ${d.quoteFont}, not the handwriting face`);
  });

  test('out of the box the theme takes nothing away from Obsidian' + tag, () => {
    const d = r();
    assert.ok(d.ribbon,
      'the left ribbon is hidden on a fresh install. A theme that removes a navigation surface '
      + 'from a stranger\'s vault on install has broken it to make a point about ours.');
    assert.ok(d.sort,
      'the Change sort order button is hidden on a fresh install, and it is sort\'s only route: '
      + 'no Obsidian command changes sort order, so this removes the function from their vault');
    assert.ok(d.vaultProfile, 'the vault switcher is hidden on a fresh install');
  });

  /* -------------------------------------------------------------------------
     THE FLIPS. Each class does what its settings entry promises, and nothing
     more: a toggle that also moved something else would be a switch the user
     cannot predict.
     ------------------------------------------------------------------------- */

  test('icor-hide-banner removes the banner and leaves the rooms alone' + tag, () => {
    const d = r('icor-hide-banner');
    assert.equal(d.banner, false, 'the banner still paints with .icor-hide-banner on body');
    assert.ok(d.roomGlyph, 'hiding the banner also took the room icons');
  });

  test('icor-rooms-off returns the rooms to Obsidian and leaves the banner alone' + tag, () => {
    const d = r('icor-rooms-off');
    assert.equal(d.roomGlyph, false, 'a room still draws its icon with .icor-rooms-off on body');
    assert.ok(d.roomLabel.startsWith('none'),
      `the room label is still rewritten (${d.roomLabel}); the numeric prefix should come back`);
    assert.ok(d.banner, 'turning off the rooms also took the banner');
  });

  test('inkline-no-hand returns the handwritten layer to the body face' + tag, () => {
    const on = r();
    const off = r('inkline-no-hand');
    assert.ok(/Caveat/i.test(on.quoteFont), 'the default is not the handwriting face');
    assert.ok(!/Caveat/i.test(off.quoteFont),
      `a blockquote still renders in ${off.quoteFont} with .inkline-no-hand on body`);
    assert.ok(off.quoteSize < on.quoteSize,
      `the handwriting size ${on.quoteSize}px did not come down (${off.quoteSize}px); the layer `
      + 'returns as body text at handwriting size');
  });

  test('icor-hide-ribbon hides the ribbon, and only when asked' + tag, () => {
    assert.ok(r().ribbon, 'the ribbon is already gone before the toggle is touched');
    assert.equal(r('icor-hide-ribbon').ribbon, false,
      'the ribbon survives .icor-hide-ribbon, so the scaffold cannot turn it off');
  });

  test('icor-scaffold-chrome hides the toolbar buttons and the vault switcher' + tag, () => {
    const d = r('icor-scaffold-chrome');
    assert.equal(d.sort, false, 'the sort button survives .icor-scaffold-chrome');
    assert.equal(d.vaultProfile, false,
      'the vault switcher survives .icor-scaffold-chrome'
      + (host ? `: the host's display rule on the row outweighs the theme's in app.css ${host.version}` : ''));
    assert.ok(d.banner, 'reducing the chrome also took the banner');
    assert.ok(d.roomGlyph, 'reducing the chrome also took the room icons');
  });

  /* -------------------------------------------------------------------------
     The state the ICOR for Life scaffold actually ships, in one render, because
     four toggles that each work alone can still collide with each other.
     ------------------------------------------------------------------------- */

  test('the scaffold preset renders the vault ICOR for Life expects' + tag, () => {
    const d = r('icor-scaffold-chrome icor-hide-ribbon');
    assert.ok(d.banner, 'the scaffold vault has no banner');
    assert.ok(d.roomGlyph, 'the scaffold vault has no room icons');
    assert.ok(/Caveat/i.test(d.quoteFont), 'the scaffold vault lost the handwritten layer');
    assert.equal(d.ribbon, false, 'the scaffold vault still shows the ribbon');
    assert.equal(d.sort, false, 'the scaffold vault still shows the sort button');
    assert.equal(d.vaultProfile, false, 'the scaffold vault still shows the vault switcher');
  });
}

suite(null);

const hosts = hostBuilds();
if (hosts.length === 0) {
  test('every toggle, behind Obsidian\'s own app.css', {
    skip: 'no Obsidian install found on this machine, so the host contest was NOT measured. '
      + 'The theme-alone pass above proves the rules match, not that they beat app.css. '
      + 'Install Obsidian, or point OBSIDIAN_ASAR at an obsidian.asar, to run this pass.',
  }, () => {});
} else {
  for (const host of hosts) suite(host);
}
