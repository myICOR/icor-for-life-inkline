/* The rooms mechanism reproduces the hand-written 1.4.0 rules exactly.
 *
 * test/fixtures/rooms-baseline.json is a MEASUREMENT of 1.4.0 - the last
 * release in which every room rule was written out per folder - across 25
 * probes in both rooms: border, tint, arrow, hidden text, glyph geometry and
 * mask, label, colour. The data-driven mechanism that replaced those rules has
 * to hit every value. A refactor that "looks the same" is not a claim this
 * file accepts.
 *
 * To change the look deliberately: make the change, eyeball it, then
 * `node test/rooms-measure.mjs --record` and commit the new baseline with the
 * change so the diff shows what moved.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { measureBoth, measure, BASELINE, TREE } from './rooms-measure.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const themeCss = readFileSync(resolve(repo, 'theme.css'), 'utf8');
const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
const now = measureBoth(themeCss);

for (const room of ['ink', 'paper']) {
  test(`every probe renders as 1.4.0 did in the ${room} room`, () => {
    const diffs = [];
    for (const [id] of TREE) {
      const a = JSON.stringify(baseline[room][id]);
      const b = JSON.stringify(now[room][id]);
      if (a !== b) diffs.push(`  ${id}\n    was ${a}\n    now ${b}`);
    }
    assert.equal(diffs.length, 0, `${diffs.length} probe(s) moved in the ${room} room:\n${diffs.join('\n')}`);
  });
}

test('the fixture is actually being styled', () => {
  assert.equal(now.ink.r04.arrow, 'none', 'a room still shows its collapse arrow; theme.css did not apply');
  assert.notEqual(now.ink.r04.before, 'none', 'a room draws no glyph');
});

/* ---------------------------------------------------------------------------
   THE CONTRACT A PLUGIN WRITES. These are the four properties and one
   attribute that ICOR for Life - Interface sets per row. If any stops
   working, the plugin's settings UI moves switches that change nothing.
   --------------------------------------------------------------------------- */

const PLUGIN_ROWS = {
  /* a plain root folder becomes a room by attribute + inline properties */
  plain: ' data-icor-kind="room" style="--room-color:#123456;--room-color-paper:#654321;--room-icon:url(&quot;data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Ccircle cx=%2712%27 cy=%2712%27 r=%2710%27/%3E%3C/svg%3E&quot;);--room-label:&quot;Custom&quot;"',
  /* a plain subfolder becomes family */
  plainsub: ' data-icor-kind="family" style="--room-color:#abcdef;--room-icon:url(&quot;data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Crect width=%2720%27 height=%2720%27/%3E%3C/svg%3E&quot;)"',
  /* a default room, taken over by the plugin with a different colour */
  r04: ' data-icor-kind="room" style="--room-color:#ff0000;--room-icon:url(&quot;data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Ccircle cx=%2712%27 cy=%2712%27 r=%2710%27/%3E%3C/svg%3E&quot;);--room-label:&quot;Mine&quot;"',
  /* a default room the plugin explicitly switches OFF */
  r05: ' data-icor-kind="none"',
};

test('a plugin can make any folder a room with four properties and one attribute', () => {
  const p = measure(themeCss, 'theme-dark', PLUGIN_ROWS).plain;
  assert.equal(p.arrow, 'none', 'the plugin-marked room still shows its arrow');
  assert.equal(p.textSize, '0px', 'the plugin-marked room still shows its real name');
  assert.match(p.borderLeft, /2px solid rgb\(18, 52, 86\)/, `border did not take the inline colour: ${p.borderLeft}`);
  assert.equal(p.after.content, '"Custom"', 'the inline --room-label did not render');
  assert.notEqual(p.before.mask, 'none', 'the inline --room-icon did not render');
});

test('a plugin can make any folder family', () => {
  const p = measure(themeCss, 'theme-dark', PLUGIN_ROWS).plainsub;
  assert.equal(p.textColor, 'rgb(171, 205, 239)', `family text did not take the inline colour: ${p.textColor}`);
  assert.equal(p.before.w, '14px', 'family glyph is not the 14px size');
  assert.equal(p.arrow, 'block', 'family must keep its collapse arrow');
});

test('the paper room falls back to --room-color when a plugin sets only one colour', () => {
  const p = measure(themeCss, 'theme-light', PLUGIN_ROWS).plainsub;
  assert.equal(p.textColor, 'rgb(171, 205, 239)', 'paper room did not fall back to the single --room-color');
  const r = measure(themeCss, 'theme-light', PLUGIN_ROWS).plain;
  assert.match(r.borderLeft, /rgb\(101, 67, 33\)/, 'paper room ignored --room-color-paper when it was given');
});

test('a plugin overrides a default room outright', () => {
  const r = measure(themeCss, 'theme-dark', PLUGIN_ROWS).r04;
  assert.match(r.borderLeft, /rgb\(255, 0, 0\)/, 'the default Inner World colour beat the plugin\'s inline colour');
  assert.equal(r.after.content, '"Mine"', 'the default "Inner World" label beat the plugin\'s label');
});

test('a plugin can switch a default room off with data-icor-kind="none"', () => {
  const r = measure(themeCss, 'theme-dark', PLUGIN_ROWS).r05;
  assert.equal(r.arrow, 'block', 'Assets is still a room after the plugin said none');
  assert.equal(r.before, 'none', 'Assets still draws a glyph after the plugin said none');
  assert.notEqual(r.textSize, '0px', 'Assets still hides its real name after the plugin said none');
});
