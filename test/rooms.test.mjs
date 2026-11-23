/* The folder mechanism renders exactly what the baseline measured.
 *
 * test/fixtures/rooms-baseline.json is a MEASUREMENT across every probe in
 * both rooms: border, tint, arrow, hidden text, glyph geometry and mask,
 * label, colour. Until 1.7.2 it measured 1.4.0, the last release in which
 * every rule was written out per folder; 1.8.0 re-recorded it on purpose for
 * the ICOR stage layout, and the stage colours are pinned separately below so
 * a re-record cannot quietly move them. A refactor that "looks the same" is
 * not a claim this file accepts.
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
  test(`every probe renders as the baseline measured in the ${room} room`, () => {
    const diffs = [];
    for (const [id] of TREE) {
      const a = JSON.stringify(baseline[room][id]);
      const b = JSON.stringify(now[room][id]);
      if (a !== b) diffs.push(`  ${id}\n    was ${a}\n    now ${b}`);
    }
    assert.equal(diffs.length, 0, `${diffs.length} probe(s) moved in the ${room} room:\n${diffs.join('\n')}`);
  });
}

/* ---------------------------------------------------------------------------
   THE ICOR STAGES (1.8.0, the ICOR stages contract, Tom 2026-11-23). Each top
   folder wears its stage's colour: INKLINE's stage colour in the ink room, the
   same hue darkened to 4.5:1 on paper in the paper room (the rule ICOR for
   Life - Interface uses on the schema's colours).
   --------------------------------------------------------------------------- */

const rgb = (hex) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
const STAGE = {
  input: { ink: '#5271fc', paper: '#4863de' },
  control: { ink: '#52f49a', paper: '#2a7c4f' },
  output: { ink: '#fd63ff', paper: '#ac43ad' },
};
const TOP = {
  s00: ['input', 'Daily Notes'], s01: ['input', 'Inbox'],
  s02: ['control', 'Inner World'], s03: ['control', 'Outer World'], s04: ['control', 'Assets'], s05: ['control', 'Databases'],
  s06: ['output', 'Planner'],
};

test('each new top folder wears its ICOR stage colour, its icon and its name minus the number, in both rooms', () => {
  const wrong = [];
  for (const room of ['ink', 'paper']) {
    for (const [id, [stage, label]] of Object.entries(TOP)) {
      const p = now[room][id];
      const want = STAGE[stage][room];
      const got = { color: p.roomColor, border: p.borderLeft, glyph: p.before === 'none' ? 'none' : p.before.bg, label: p.after === 'none' ? 'none' : p.after.content };
      const ok = p.roomColor.toLowerCase() === want && p.borderLeft === `2px solid ${rgb(want)}`
        && p.before !== 'none' && p.before.bg === rgb(want) && p.before.mask !== 'none'
        && p.after !== 'none' && p.after.content === JSON.stringify(label) && p.arrow === 'none';
      if (!ok) wrong.push(`  ${room} ${id} (${stage}): want ${want} "${label}", got ${JSON.stringify(got)}`);
    }
  }
  assert.equal(wrong.length, 0, `${wrong.length} top folder(s) do not wear their stage:\n${wrong.join('\n')}`);
});

test('a folder inside a stage folder takes the stage colour, a named one keeps its own glyph', () => {
  for (const room of ['ink', 'paper']) {
    assert.equal(now[room].n02journal.textColor, rgb(STAGE.control[room]), `Journal is not Control in the ${room} room`);
    assert.equal(now[room].floor06.textColor, rgb(STAGE.output[room]), `a Planner subfolder is not Output in the ${room} room`);
    assert.notEqual(now[room].n02journal.before.mask, now[room].floor.before.mask, 'Journal lost its own glyph');
  }
});

test('folders match by full name, not by number: 06 AI Team, 03 WiP and 02 Somewhere Else are in no stage', () => {
  for (const room of ['ink', 'paper']) {
    for (const id of ['aiteam', 'wip', 'renamed']) {
      assert.deepEqual(now[room][id], now[room].plain, `${id} is styled as a stage folder in the ${room} room`);
    }
    assert.deepEqual(now[room].aiteamsub, now[room].plainsub, `06 AI Team/Agents is styled in the ${room} room`);
  }
});

test('a vault from before the stage layout keeps its colours, by stage', () => {
  const was = { l00: 'input', l02: 'output', l04: 'control', l05: 'control', l06: 'control', l07: 'control' };
  for (const [id, stage] of Object.entries(was)) {
    assert.equal(now.ink[id].roomColor.toLowerCase(), STAGE[stage].ink, `${id} is not ${stage}`);
  }
});

test('the fixture is actually being styled', () => {
  assert.equal(now.ink.s02.arrow, 'none', 'a stage folder still shows its collapse arrow; theme.css did not apply');
  assert.notEqual(now.ink.s02.before, 'none', 'a stage folder draws no glyph');
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
  /* a default stage folder, taken over by the plugin with a different colour */
  s02: ' data-icor-kind="room" style="--room-color:#ff0000;--room-icon:url(&quot;data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Ccircle cx=%2712%27 cy=%2712%27 r=%2710%27/%3E%3C/svg%3E&quot;);--room-label:&quot;Mine&quot;"',
  /* a default stage folder the plugin explicitly switches OFF */
  s04: ' data-icor-kind="none"',
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

test('a plugin overrides a default stage folder outright', () => {
  const r = measure(themeCss, 'theme-dark', PLUGIN_ROWS).s02;
  assert.match(r.borderLeft, /rgb\(255, 0, 0\)/, 'the default Control colour beat the plugin\'s inline colour');
  assert.equal(r.after.content, '"Mine"', 'the default "Inner World" label beat the plugin\'s label');
});

test('a plugin can switch a default stage folder off with data-icor-kind="none"', () => {
  const r = measure(themeCss, 'theme-dark', PLUGIN_ROWS).s04;
  assert.equal(r.arrow, 'block', 'Assets is still a room after the plugin said none');
  assert.equal(r.before, 'none', 'Assets still draws a glyph after the plugin said none');
  assert.notEqual(r.textSize, '0px', 'Assets still hides its real name after the plugin said none');
});
