/* THE PROPERTIES BAR GATE: folding never moves the bar.
 *
 * Tom, 2026-11-25: "clicking and collapsing feels glitchy, the design seems
 * off". Measured on 1.9.0 behind app.css 1.15.1, in the gradient look:
 *   - the heading moved 6px between folded and open (the card's padding and the
 *     heading's own padding both changed with .is-collapsed), so the bar jumped
 *     under the pointer on every click;
 *   - app.css hangs the fold arrow 22px outside the heading, which put it on
 *     the card's left edge;
 *   - app.css's 8px margin under the heading sat the folded title high.
 *
 * Each state is rendered as Obsidian builds it (setCollapse() toggles
 * .is-collapsed on the box, the heading and the arrow, and slides
 * .metadata-content shut, ending at display:none), in both looks and rooms,
 * with the theme alone and behind every app.css this machine has.
 * THEME_CSS=<path> renders another build. Chrome is REQUIRED.
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
const CHROME = process.env.CHROME_BIN
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const box = (id, folded) => `
  <div class="markdown-source-view cm-s-obsidian mod-cm6 is-live-preview show-properties" style="width: 700px; padding: 0 40px; margin-bottom: 40px">
    <div class="metadata-container${folded ? ' is-collapsed' : ''}" id="${id}" data-property-count="2">
      <div class="metadata-properties-heading${folded ? ' is-collapsed' : ''}" tabindex="0">
        <div class="collapse-indicator collapse-icon${folded ? ' is-collapsed' : ''}"><svg class="svg-icon right-triangle" width="24" height="24" viewBox="0 0 24 24"><path d="M3 8L12 17L21 8"></path></svg></div>
        <div class="metadata-properties-title">Properties</div>
      </div>
      <div class="metadata-content"${folded ? ' style="display: none"' : ''}>
        <div class="metadata-properties">
          <div class="metadata-property"><div class="metadata-property-key"><input class="metadata-property-key-input" value="type"></div><div class="metadata-property-value">note</div></div>
          <div class="metadata-property"><div class="metadata-property-key"><input class="metadata-property-key-input" value="tags"></div><div class="metadata-property-value">x</div></div>
        </div>
        <div class="metadata-add-button text-icon-button">Add property</div>
      </div>
    </div>
  </div>`;

function fixture(room, look, host) {
  return `<!doctype html><html><head><style>* { box-sizing: border-box; } body { margin: 0; width: 900px; }</style>
  <style>${host ? host.css : ''}</style><style>${themeCss}</style></head>
  <body class="${room} ${look} obsidian-app">
  ${box('folded', true)}${box('open', false)}
  <pre id="out"></pre>
  <script>
  const rect = (s) => { const r = document.querySelector(s).getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, h: r.height }; };
  const m = {};
  for (const id of ['folded', 'open']) {
    const b = rect('#' + id);
    const h = rect('#' + id + ' .metadata-properties-heading');
    const t = rect('#' + id + ' .metadata-properties-title');
    const a = rect('#' + id + ' .collapse-indicator');
    m[id] = { headTop: h.top - b.top, headLeft: h.left - b.left, arrowLeft: a.left - b.left,
      titleMid: (t.top + t.bottom) / 2 - b.top, boxH: b.h, headBottom: h.bottom - b.top };
  }
  document.getElementById('out').textContent = JSON.stringify(m);
  </script></body></html>`;
}

const dir = mkdtempSync(join(tmpdir(), 'inkline-props-'));
let shot = 0;
function render(room, look, host) {
  const file = join(dir, `p${shot++}.html`);
  writeFileSync(file, fixture(room, look, host));
  let dom;
  try {
    dom = execFileSync(CHROME, [
      '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      '--virtual-time-budget=2000', '--dump-dom', `file://${file}`,
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    assert.fail(`could not run Chrome at ${CHROME}; set CHROME_BIN. ${e && e.message}`);
  }
  const m = dom.match(/<pre id="out">([^<]*)<\/pre>/);
  assert.ok(m && m[1], 'the fixture produced no measurement');
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
}

function suite(room, look, host) {
  const tag = ` [${room === 'theme-dark' ? 'ink' : 'paper'}, ${look || 'flat'}, ${host ? `behind app.css ${host.version}` : 'theme alone'}]`;
  let cached;
  const r = () => (cached ||= render(room, look, host));

  test('folding does not move the properties bar' + tag, () => {
    const { folded, open } = r();
    assert.ok(Math.abs(folded.headTop - open.headTop) < 0.5,
      `the heading sits ${folded.headTop}px into the folded card and ${open.headTop}px into the open one`);
    assert.ok(Math.abs(folded.titleMid - open.titleMid) < 0.5,
      `the title moves from ${folded.titleMid}px to ${open.titleMid}px when the card opens`);
  });

  test('the fold arrow sits inside the properties card' + tag, () => {
    const { folded, open } = r();
    for (const [k, v] of Object.entries({ folded, open })) {
      assert.ok(v.arrowLeft >= 0, `the ${k} arrow hangs ${-v.arrowLeft}px outside the card`);
    }
  });

  if (look) {
    test('the folded title is centred in the bar' + tag, () => {
      const { folded } = r();
      const gap = Math.abs(folded.titleMid - folded.boxH / 2);
      assert.ok(gap < 1.5, `the folded title sits ${gap}px off the bar's middle (bar ${folded.boxH}px)`);
    });
  }
}

const hosts = hostBuilds();
for (const room of ['theme-dark', 'theme-light']) {
  for (const look of ['', 'inkline-gradient']) {
    suite(room, look, null);
    for (const host of hosts) suite(room, look, host);
  }
}
if (hosts.length === 0) {
  test('the properties gate, behind Obsidian\'s own app.css', {
    skip: 'no Obsidian install found; point OBSIDIAN_ASAR at an obsidian.asar to run this pass.',
  }, () => {});
}
