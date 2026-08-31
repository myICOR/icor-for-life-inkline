/* The build's own gates.
 *
 * theme.css is generated, and a generated file that nobody checks is a file
 * that drifts from its source on the first hurried edit. These tests exist so
 * the drift is loud.
 *
 * The one that matters most is "every toggle reaches CSS". A Style Settings
 * block is YAML in a comment: it is never validated by anything, it fails by
 * rendering a switch that moves and changes nothing, and a user who flips a
 * dead switch concludes the theme is broken rather than the block. That is the
 * exact shape of a guard whose green is reachable without the thing being
 * true, so it gets a test that was watched going red.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const themeCss = readFileSync(resolve(repo, 'theme.css'), 'utf8');

/* The stylesheet with every comment removed. Anything asking "does this class
   appear in a selector" must read THIS: the comments in this theme discuss the
   class names they replaced, and a scan over the raw file finds .icor-keep-ribbon
   in a paragraph explaining why .icor-keep-ribbon is gone. */
const rules = themeCss.replace(/\/\*[\s\S]*?\*\//g, '');

/* The settings block, pulled out of its comment. Not a YAML parse - the repo
   has no dependencies and one is not worth adding to read a flat list - but a
   read strict enough to fail on a block that stopped being well-formed. */
function settingsBlock() {
  const m = themeCss.match(/\/\*\s*@settings\s*\n([\s\S]*?)\*\//);
  assert.ok(m, 'theme.css carries no @settings block, so Style Settings shows nothing at all');
  return m[1];
}

function toggles() {
  const block = settingsBlock();
  const out = [];
  const entries = block.split(/\n\s*-\s+id:\s*/).slice(1);
  for (const e of entries) {
    const id = e.split('\n')[0].trim();
    const type = (e.match(/\n\s*type:\s*(\S+)/) || [])[1];
    if (type === 'class-toggle') out.push(id);
  }
  return out;
}

test('theme.css is in sync with src/', () => {
  /* Exit 0 or the message says what to run. This is the whole reason the
     generated file is safe to commit. */
  execFileSync('node', [resolve(repo, 'build.mjs'), '--check'], { stdio: 'pipe' });
});

test('the settings block is well-formed enough to read', () => {
  const block = settingsBlock();
  assert.match(block, /^\s*name:\s*ICOR for Life - INKLINE\s*$/m, 'the settings block lost its name');
  assert.match(block, /^\s*id:\s*icor-for-life-inkline\s*$/m, 'the settings block lost its id');
  assert.ok(toggles().length >= 4, `expected at least 4 class-toggles, found ${toggles().length}`);
});

test('every class-toggle reaches at least one selector in theme.css', () => {
  for (const id of toggles()) {
    /* The class has to appear OUTSIDE the settings comment, in a real
       selector. Searching the whole file would find the block's own id line
       and pass on the strength of the thing being tested. */
    const afterBlock = themeCss.slice(themeCss.indexOf('*/', themeCss.indexOf('@settings')));
    assert.ok(
      afterBlock.includes(`.${id}`),
      `the "${id}" toggle appears in the settings block but in no selector, so flipping it `
      + 'in Style Settings moves a switch and changes nothing'
    );
  }
});

test('every guarded selector belongs to a declared toggle', () => {
  /* The other direction. A guard class that no toggle declares can never be
     turned on, so its rules are dead weight nobody can reach. */
  const declared = new Set(toggles());
  const used = new Set();
  for (const m of rules.matchAll(/\.(icor-[a-z-]+|inkline-no-hand)\b/g)) used.add(m[1]);
  for (const cls of used) {
    if (cls.startsWith('icor-') && !declared.has(cls) && /^icor-(hide|show|rooms|keep)/.test(cls)) {
      assert.ok(declared.has(cls), `theme.css guards on .${cls}, which no toggle declares`);
    }
  }
});

/* Polarity is not asserted here. It is a question about what RENDERS with no
   classes on <body>, the theme encodes "on by default" two different ways, and
   a string match has to know which one each feature uses - which makes it a
   second copy of the answer rather than a check on it. test/toggles.test.mjs
   measures it in a real engine instead. */

test('no guard was prepended in front of a body-level class', () => {
  /* The silent death. `.theme-light` is ON body, so a guard placed in front of
     it as an ancestor matches nothing, forever, without erroring. 60+ rules in
     src/60-rooms.css have this shape. */
  const bad = [...rules.matchAll(/body[^,{\s]*\s+\.theme-(light|dark)\b/g)];
  assert.equal(bad.length, 0,
    `${bad.length} selector(s) place a body-level guard in front of .theme-light/.theme-dark as an `
    + 'ancestor. .theme-light IS the body, so those rules match nothing and say nothing about it.\n'
    + bad.slice(0, 3).map((m) => `    ${m[0]}`).join('\n'));
});

test('the banner artwork is stored once per room, not once per consumer', () => {
  /* Two consumers read --icor-banner: the painted ::before and the anchor. If
     a future edit inlines the data URI at either site the theme grows 22KB and
     acquires a second copy that will be edited alone. */
  const uris = [...themeCss.matchAll(/data:image\/webp;base64,/g)].length;
  assert.equal(uris, 2,
    `expected exactly 2 embedded banner images (one per room), found ${uris}`);
  assert.match(themeCss, /--icor-banner:\s*url\("data:image\/webp;base64,/,
    'the artwork is no longer held in --icor-banner');
  const reads = [...themeCss.matchAll(/var\(--icor-banner\)/g)].length;
  assert.ok(reads >= 2, `--icor-banner has ${reads} reader(s); the painted banner and the anchor are two`);
});

test('the theme paints the banner without needing any plugin', () => {
  assert.match(themeCss, /\.nav-header::before\s*\{/,
    'the painted banner is gone, so a vault with no myICOR Connect gets no banner at all');
  assert.match(themeCss, /\.nav-header:has\(a\.micor-banner\)::before\s*\{\s*display:\s*none/,
    'the painted banner no longer stands down for the injected anchor, so a plugin vault draws it twice');
});
