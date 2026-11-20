/* The Look switch is a class-select, not a class-toggle, so build.test.mjs
 * does not see it. Each option must reach a selector, or Gradient is a switch
 * that moves and changes nothing. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'theme.css'), 'utf8');
const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');

test('the Look switch offers Flat and Gradient, Flat by default', () => {
  const block = css.match(/\/\*\s*@settings\s*\n([\s\S]*?)\*\//)[1];
  assert.match(block, /- id: inkline-look\n\s+title: Look\n[\s\S]*?type: class-select\n\s+allowEmpty: false\n\s+default: inkline-flat/);
  assert.match(block, /value: inkline-flat/);
  assert.match(block, /value: inkline-gradient/);
});

test('Gradient reaches the main area, the cards and the marker', () => {
  for (const sel of ['body.inkline-gradient .workspace-split.mod-root', 'body.inkline-gradient .markdown-rendered .callout', 'body.inkline-gradient .modal button.mod-cta']) {
    assert.ok(rules.includes(sel), `no rule for ${sel}`);
  }
});

test('Flat changes nothing: no rule depends on inkline-flat', () => {
  assert.ok(!/\.inkline-flat\b/.test(rules), 'Flat is the foundation; it needs no rules of its own');
});

test('no light on text: the gradient file sets no text-shadow', () => {
  const start = rules.indexOf('body.inkline-gradient{');
  assert.ok(start > 0);
  assert.ok(!/text-shadow/.test(rules.slice(start)), 'INKLINE: no glow on text');
});
