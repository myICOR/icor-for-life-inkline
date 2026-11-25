/* THE TYPE GATE: INKLINE's one tooltip, and no handwriting in interface text.
 *
 * Two rulings from 2026-11-23, measured in a real engine in both rooms, with
 * the theme alone and behind every Obsidian app.css this machine has:
 *
 *   1. The tooltip is INKLINE's `.ik-tip` (inkline.css, DESIGN 13): a solid
 *      label, the body face at 600 12.5px/1.25, 7px 10px of padding, an 8px
 *      corner, no tilt, no arrow, no shadow; a shortcut inside it is the kbd
 *      chip. 1.8.0 drew Obsidian's tooltip as a tilted handwritten note.
 *   2. Handwriting is the one deliberate aside (DESIGN 16), never interface
 *      text: the Tags pane, tag pills, tags in notes and in the editor, the
 *      word count, empty states, quotes, cite callouts, comments, canvas
 *      labels and Mermaid notes all read in the body face.
 *
 * THEME_CSS=<path> renders another build, which is how this file is shown
 * failing on 1.8.0 and passing on 1.9.0. The positive controls (.ink-hand and
 * the opt-in .inkline-hand page keep Caveat) prove the harness can see the
 * hand at all, so a green "no Caveat" is never a fixture that styles nothing.
 *
 * Chrome is REQUIRED, as in the other geometry gates: a skip would be a gate
 * reporting green having measured nothing.
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

/* INKLINE's solid and on-solid, per room: paper on ink, ink on paper. */
const SOLID = {
  'theme-dark': { bg: 'rgb(246, 243, 236)', fg: 'rgb(9, 10, 12)' },
  'theme-light': { bg: 'rgb(23, 26, 32)', fg: 'rgb(246, 243, 236)' },
};

/* Every surface ruling 2 names, as Obsidian builds it, reduced to the parts the
   selectors touch. Tooltips are placed by hand the way Obsidian places them
   (inline top/left on a fixed element), one per direction. */
const NO_HAND = {
  tagPane: '#tagpane',
  tagPill: '#tagpill',
  wordCount: '#wordcount',
  emptyTitle: '#emptytitle',
  emptyAction: '#emptyaction',
  noteTag: '#notetag',
  editorTag: '#editortag',
  quote: '#quote',
  citeCallout: '#cite',
  comment: '#comment',
  canvasLabel: '#canvaslabel',
  mermaidNote: '#mermaidnote',
};

function fixture(room, host) {
  return `<!doctype html><html><head><style>
  * { box-sizing: border-box; }
  body { margin: 0; width: 900px; height: 700px; }
  </style>
  <style>${host ? host.css : ''}</style>
  <style>${themeCss}</style></head>
  <body class="${room} mod-macos is-frameless obsidian-app">
  <div class="tooltip" id="tip" style="top: 40px; left: 120px">Collapse all<div class="tooltip-arrow"></div></div>
  <div class="tooltip mod-top" id="tiptop" style="top: 90px; left: 320px">New note <kbd id="kbd">⌘N</kbd><div class="tooltip-arrow"></div></div>
  <div class="tooltip mod-left" id="tipleft" style="top: 140px; left: 520px">Search<div class="tooltip-arrow"></div></div>
  <div class="tooltip mod-right" id="tipright" style="top: 190px; left: 620px">Graph view<div class="tooltip-arrow"></div></div>

  <div class="workspace-leaf-content" data-type="tag"><div class="tag-container">
    <div class="tree-item"><div class="tree-item-self tag-pane-tag is-clickable">
      <div class="tree-item-inner"><div class="tree-item-inner-text" id="tagpane"><span class="tag-pane-tag-parent">topic/</span><span class="tree-item-inner-text" id="tagleaf">method</span></div></div>
      <div class="tree-item-flair-outer"><span class="tree-item-flair tag-pane-tag-count">3</span></div>
    </div></div>
  </div></div>

  <div class="metadata-container"><div class="metadata-property" data-property-key="tags">
    <div class="metadata-property-value"><div class="multi-select-container">
      <div class="multi-select-pill"><div class="multi-select-pill-content" id="tagpill">method</div></div>
    </div></div>
  </div></div>

  <div class="status-bar"><div class="status-bar-item plugin-word-count">
    <span class="status-bar-item-segment" id="wordcount">120 words</span>
  </div></div>

  <div class="workspace-leaf-content" data-type="empty"><div class="empty-state"><div class="empty-state-container">
    <div class="empty-state-title" id="emptytitle">No file is open</div>
    <div class="empty-state-action-list"><div class="empty-state-action" id="emptyaction">Create new note</div></div>
  </div></div></div>

  <div class="markdown-reading-view"><div class="markdown-preview-view markdown-rendered">
    <p><a class="tag" id="notetag" href="#method">#method</a></p>
    <blockquote id="quote"><p>a quote</p></blockquote>
    <div class="callout" data-callout="cite"><div class="callout-content" id="cite"><p>a cite</p></div></div>
    <p><span class="ink-hand" id="inkhand">the one aside</span></p>
  </div></div>
  <div class="markdown-preview-view markdown-rendered inkline-hand"><p id="handpage">a page in the hand</p></div>

  <div class="markdown-source-view mod-cm6 cm-s-obsidian"><div class="cm-content"><div class="cm-line">
    <span class="cm-hashtag cm-hashtag-begin cm-meta">#</span><span class="cm-hashtag cm-hashtag-end cm-meta" id="editortag">method</span>
    <span class="cm-comment" id="comment">%%a comment%%</span>
  </div></div></div>

  <div class="canvas-node"><div class="canvas-node-label" id="canvaslabel">A card</div></div>
  <div class="mermaid"><svg width="200" height="40"><text class="noteText" id="mermaidnote" x="4" y="20">a note</text></svg></div>

  <pre id="out"></pre>
  <script>
  const q = (s) => document.querySelector(s);
  const font = (s) => getComputedStyle(q(s)).fontFamily;
  const tip = (s) => {
    const cs = getComputedStyle(q(s));
    return {
      font: cs.fontFamily, weight: cs.fontWeight, size: cs.fontSize, lh: cs.lineHeight,
      radius: cs.borderTopLeftRadius, bg: cs.backgroundColor, fg: cs.color,
      padding: cs.paddingTop + ' ' + cs.paddingRight, display: cs.display, shadow: cs.boxShadow,
      border: cs.borderTopWidth, transform: cs.transform, rotate: cs.rotate,
      from: cs.getPropertyValue('--ink-tip-from').trim(),
      arrow: getComputedStyle(q(s + ' .tooltip-arrow')).display,
    };
  };
  const kbd = getComputedStyle(q('#kbd'));
  const tagPane = getComputedStyle(q('#tagpane'));
  const tagLeaf = getComputedStyle(q('#tagleaf'));
  const noteTag = getComputedStyle(q('#notetag'));
  const fonts = {};
  for (const [k, s] of Object.entries(${JSON.stringify(NO_HAND)})) fonts[k] = font(s);
  document.getElementById('out').textContent = JSON.stringify({
    tips: { below: tip('#tip'), top: tip('#tiptop'), left: tip('#tipleft'), right: tip('#tipright') },
    kbd: { height: kbd.height, radius: kbd.borderTopLeftRadius, opacity: kbd.opacity, font: kbd.fontFamily, shadow: kbd.boxShadow },
    fonts,
    tagPane: { radius: tagPane.borderTopLeftRadius, shadow: tagPane.boxShadow, weight: tagPane.fontWeight },
    tagLeaf: { shadow: tagLeaf.boxShadow, padding: tagLeaf.paddingLeft },
    noteTag: { radius: noteTag.borderTopLeftRadius, border: noteTag.borderTopWidth, bg: noteTag.backgroundColor },
    inkHand: font('#inkhand'),
    handPage: font('#handpage'),
  });
  </script></body></html>`;
}

const dir = mkdtempSync(join(tmpdir(), 'inkline-type-'));
let shot = 0;
const cache = new Map();

function render(room, host) {
  const key = `${room}|${host ? host.version : ''}`;
  if (cache.has(key)) return cache.get(key);
  const file = join(dir, `t${shot++}.html`);
  writeFileSync(file, fixture(room, host));
  let dom;
  try {
    dom = execFileSync(CHROME, [
      '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      '--virtual-time-budget=2000', '--dump-dom', `file://${file}`,
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    assert.fail(`could not run Chrome at ${CHROME}; this gate measures computed style and `
      + `fails rather than skipping. Set CHROME_BIN. Underlying error: ${e && e.message}`);
  }
  const m = dom.match(/<pre id="out">([^<]*)<\/pre>/);
  assert.ok(m && m[1], 'the fixture produced no measurement; the page script did not run');
  const parsed = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  cache.set(key, parsed);
  return parsed;
}

/* A computed transform is `none` or a matrix; a rotation shows as non-zero b
   or c. Obsidian's own centring is a pure translate and passes. */
function rotated(transform) {
  if (!transform || transform === 'none') return false;
  const v = transform.match(/matrix\(([^)]+)\)/);
  if (!v) return true;
  const [, b, c] = v[1].split(',').map(Number);
  return Math.abs(b) > 1e-6 || Math.abs(c) > 1e-6;
}

const BODY = /^"?Instrument Sans"?/;

function suite(room, host) {
  const tag = ` [${room === 'theme-dark' ? 'ink' : 'paper'}, ${host ? `behind app.css ${host.version}` : 'theme alone'}]`;
  const r = () => render(room, host);

  test('the harness can see handwriting: .ink-hand and the inkline-hand page keep Caveat' + tag, () => {
    const d = r();
    assert.match(d.inkHand, /Caveat/, `.ink-hand renders in ${d.inkHand}; the one aside lost its hand`);
    assert.match(d.handPage, /Caveat/, `an inkline-hand page renders in ${d.handPage}; the opt-in mode is untouched by 1.9.0`);
  });

  test('the tooltip is INKLINE\'s solid label: body face, solid ground, 8px corner, no tilt' + tag, () => {
    const { tips } = r();
    for (const [side, t] of Object.entries(tips)) {
      const at = `the ${side} tooltip`;
      assert.doesNotMatch(t.font, /Caveat/, `${at} is still handwriting (${t.font})`);
      assert.match(t.font, BODY, `${at} is in ${t.font}, not the body face`);
      assert.equal(t.weight, '600', `${at} weighs ${t.weight}`);
      assert.equal(t.size, '12.5px', `${at} is ${t.size}`);
      assert.equal(t.radius, '8px', `${at} has a ${t.radius} corner`);
      assert.equal(t.bg, SOLID[room].bg, `${at} is on ${t.bg}, not the room's solid`);
      assert.equal(t.fg, SOLID[room].fg, `${at} writes in ${t.fg}, not the room's on-solid`);
      assert.equal(t.padding, '7px 10px', `${at} has ${t.padding} of padding`);
      assert.equal(t.shadow, 'none', `${at} casts ${t.shadow}`);
      assert.equal(t.border, '0px', `${at} has a ${t.border} border`);
      assert.match(t.display, /flex/, `${at} is display ${t.display}, not inline-flex`);
      assert.equal(t.rotate, 'none', `${at} is rotated (${t.rotate})`);
      assert.ok(!rotated(t.transform), `${at} is tilted: transform ${t.transform}`);
      assert.equal(t.arrow, 'none', `${at} shows an arrow`);
    }
  });

  test('the tooltip springs in from its control\'s side' + tag, () => {
    const { tips } = r();
    assert.deepEqual(
      { below: tips.below.from, top: tips.top.from, left: tips.left.from, right: tips.right.from },
      { below: '0 -6px', top: '0 6px', left: '6px 0', right: '-6px 0' },
      'mod-top / mod-left / mod-right and the unmarked default (below) no longer map to the travel '
      + 'that brings each label in from its control');
  });

  test('a shortcut in a tooltip is the kbd chip' + tag, () => {
    const { kbd } = r();
    assert.equal(kbd.height, '18px', `the kbd chip is ${kbd.height} tall`);
    assert.equal(kbd.radius, '5px', `the kbd chip has a ${kbd.radius} corner`);
    assert.equal(kbd.opacity, '0.75', `the kbd chip is at opacity ${kbd.opacity}`);
    assert.match(kbd.font, BODY, `the kbd chip is in ${kbd.font}; INKLINE has no monospace`);
    assert.match(kbd.shadow, /inset/, `the kbd chip has no inset ring (${kbd.shadow})`);
  });

  test('no interface text is handwriting' + tag, () => {
    const { fonts } = r();
    const hand = Object.entries(fonts).filter(([, f]) => /Caveat/.test(f));
    assert.deepEqual(hand, [], `still in the hand: ${hand.map(([k, f]) => `${k} (${f})`).join(', ')}`);
    /* Behind the host every surface resolves to the body face. A cite callout
       sets no face of its own and inherits Obsidian's text stack, which leads
       with the empty user override "??" and then the theme's face; with the
       theme alone there is no stack to inherit, so only "not the hand" holds. */
    if (host) {
      for (const [k, f] of Object.entries(fonts)) {
        assert.match(f.replace(/^"\?\?",\s*/, ''), BODY, `${k} renders in ${f}, not the body face`);
      }
    }
  });

  test('the Tags pane draws each tag as a quiet chip' + tag, () => {
    const { tagPane } = r();
    assert.equal(tagPane.radius, '999px', `a tag in the Tags pane has a ${tagPane.radius} corner, not a pill`);
    assert.match(tagPane.shadow, /inset/, `a tag in the Tags pane has no hairline ring (${tagPane.shadow})`);
    assert.equal(tagPane.weight, '500', `a tag in the Tags pane weighs ${tagPane.weight}`);
  });

  /* Obsidian nests a second .tree-item-inner-text (the tag's last segment)
     inside the one the chip is drawn on; ringing both drew a pill in a pill. */
  test('a tag in the Tags pane has one ring, not a pill inside a pill' + tag, () => {
    const { tagLeaf } = r();
    assert.equal(tagLeaf.shadow, 'none', `the tag's inner segment draws its own ring (${tagLeaf.shadow})`);
    assert.equal(tagLeaf.padding, '0px', `the tag's inner segment is padded (${tagLeaf.padding}) like a second chip`);
  });

  if (host) {
    test('a tag in a note is a quiet chip through Obsidian\'s own tag rule' + tag, () => {
      const { noteTag } = r();
      assert.equal(noteTag.radius, '999px', `a note tag has a ${noteTag.radius} corner, not a pill`);
      assert.equal(noteTag.border, '1px', `a note tag has a ${noteTag.border} ring`);
      assert.equal(noteTag.bg, 'rgba(0, 0, 0, 0)', `a note tag is filled (${noteTag.bg}); the chip is quiet`);
    });
  }
}

const hosts = hostBuilds();
for (const room of ['theme-dark', 'theme-light']) {
  suite(room, null);
  for (const host of hosts) suite(room, host);
}
if (hosts.length === 0) {
  test('the type gate, behind Obsidian\'s own app.css', {
    skip: 'no Obsidian install found on this machine, so the tooltip and the tag chips were NOT '
      + 'measured against app.css (which centres the tooltip with its own transform and draws '
      + 'tags from the --tag-* channels). Point OBSIDIAN_ASAR at an obsidian.asar to run this pass.',
  }, () => {});
}
