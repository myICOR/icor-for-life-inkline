/* Builds theme.css from src/.
 *
 *   node build.mjs          write theme.css
 *   node build.mjs --check  exit 1 if theme.css differs from a fresh build
 *
 * Files concatenate in filename order, so the two-digit prefix is the cascade
 * and nothing else decides it. A file may declare, on its first line:
 *
 *   /* @guard <selector> *\/
 *
 * and every selector in that file is rewritten to sit under that guard. The
 * point is that a guarded file is written as PLAIN CSS - the person editing
 * src/60-rooms.css never types the guard, cannot forget it on one rule, and
 * cannot get it half-right on another. One declaration, applied 150 times.
 *
 * ---------------------------------------------------------------------------
 * THE ONE THING THAT MAKES THIS NON-TRIVIAL
 * ---------------------------------------------------------------------------
 * The guard targets <body>, and Obsidian puts a lot on <body>: theme-light,
 * theme-dark, mod-macos, is-frameless, and every Style Settings class. So a
 * selector already starting at body level must have the guard MERGED into its
 * first compound, not prepended as an ancestor:
 *
 *   .theme-light .nav-folder-title   ->  .theme-light:not(.icor-rooms-off) .nav-folder-title
 *                                  NOT  body:not(.icor-rooms-off) .theme-light .nav-folder-title
 *
 * The second form matches nothing, ever, because .theme-light IS the body -
 * and it fails silently, which is the whole danger. CSS that matches nothing
 * raises nothing.
 *
 * So the build classifies the first compound of every selector, and refuses to
 * build on anything it cannot classify. A new selector shape stops the build
 * with its own text quoted, rather than shipping a rule that renders nothing.
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'theme.css');

/* Classes and elements that live ON <body> in Obsidian. A selector whose first
   compound touches one of these starts at body level, so the guard merges into
   it. Extending this list is a deliberate act; that is why it is a list. */
const BODY_LEVEL = [
  'body',
  '.theme-light',
  '.theme-dark',
  '.mod-macos',
  '.mod-windows',
  '.mod-linux',
  '.is-frameless',
  '.is-fullscreen',
  '.is-mobile',
  '.is-tablet',
  '.is-phone',
];

/* Compound-selector prefixes that are unambiguously BELOW body. A first
   compound starting with one of these gets the guard as an ancestor. */
const DESCENDANT_LEVEL = [
  '.workspace',
  '.nav-',
  '.markdown-',
  '.cm-',
  '.view-',
  '.modal',
  '.menu',
  '.titlebar',
  '.status-bar',
  '.tooltip',
  '.suggestion',
  '.prompt',
  '.side-dock',
  '.mod-root',
  /* The banner anchor myICOR Connect injects into the file-explorer header.
     Named here rather than matched by a wildcard, because `a` on its own is
     the one element that could plausibly sit at either level. */
  'a.micor-banner',
];

/* Split a selector list on top-level commas. Commas inside (), [] or a string
   are part of a selector, not a separator: :not(a, b) and [data-path="a, b"]
   both appear in this theme. */
function splitSelectorList(sel) {
  const out = [];
  let depth = 0, quote = null, buf = '';
  for (let i = 0; i < sel.length; i++) {
    const c = sel[i];
    if (quote) {
      buf += c;
      if (c === '\\') { buf += sel[++i] ?? ''; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; buf += c; continue; }
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    if (c === ',' && depth === 0) { out.push(buf); buf = ''; continue; }
    buf += c;
  }
  if (buf.trim()) out.push(buf);
  return out;
}

/* The first compound is everything up to the first top-level combinator
   (whitespace, >, +, ~). Same bracket/quote awareness as above. */
function firstCompound(sel) {
  const s = sel.trim();
  let depth = 0, quote = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (depth === 0 && (c === ' ' || c === '>' || c === '+' || c === '~' || c === '\t' || c === '\n')) {
      return s.slice(0, i);
    }
  }
  return s;
}

/* The guard splits into the element it targets and the qualifier it adds.
   `body:not(.icor-rooms-off)` -> element `body`, qualifier `:not(.icor-rooms-off)`.
   The qualifier is what merges; the element is what prepends. */
function parseGuard(guard) {
  const g = guard.trim();
  if (!g.startsWith('body')) {
    throw new Error(`@guard must target body, got: ${guard}`);
  }
  return { element: 'body', qualifier: g.slice('body'.length) };
}

function applyGuard(selectorList, guard, file) {
  const { qualifier } = parseGuard(guard);
  const problems = [];

  const rewritten = splitSelectorList(selectorList).map((raw) => {
    const lead = raw.match(/^\s*/)[0];
    const sel = raw.trim();
    const head = firstCompound(sel);

    if (BODY_LEVEL.some((t) => head === t || head.startsWith(t))) {
      /* Body level: merge. `body` keeps its element, a bare `.theme-light`
         keeps its class; either way the qualifier lands on the same element
         the guard class is on. */
      return lead + head + qualifier + sel.slice(head.length);
    }

    if (DESCENDANT_LEVEL.some((t) => head.startsWith(t))) {
      return lead + guard + ' ' + sel;
    }

    problems.push(head);
    return lead + sel;
  });

  if (problems.length) {
    throw new Error(
      `${file}: cannot place the guard on ${problems.length} selector(s), because it is not\n` +
      `known whether they start at body level or below it. Prefixing the wrong way\n` +
      `produces a rule that matches nothing and says nothing about it.\n\n` +
      problems.map((p) => `    ${p}`).join('\n') +
      `\n\nAdd the shape to BODY_LEVEL or DESCENDANT_LEVEL in build.mjs, deliberately.`
    );
  }
  return rewritten.join(',');
}

/* Walk the stylesheet and hand every top-level selector list to applyGuard.
   Comments pass through untouched - which is what keeps the @settings block
   in 00-settings.css intact - and so do at-rule preludes. Rules nested inside
   an at-rule (@media, @supports) are guarded at their own depth. */
function guardStylesheet(css, guard, file) {
  let out = '';
  let buf = '';          // the pending selector list / at-rule prelude
  let depth = 0;
  let i = 0;

  const AT_BLOCK_NO_SELECTORS = /@(font-face|keyframes|-webkit-keyframes|property|counter-style|page)\b/;
  const atStack = [];

  while (i < css.length) {
    const two = css.slice(i, i + 2);

    if (two === '/*') {
      const end = css.indexOf('*/', i + 2);
      const stop = end === -1 ? css.length : end + 2;
      buf += css.slice(i, stop);
      i = stop;
      continue;
    }

    const c = css[i];

    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== c) {
        if (css[j] === '\\') j++;
        j++;
      }
      buf += css.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    if (c === '{') {
      const prelude = buf;
      const isAt = prelude.trimStart().startsWith('@') || /(^|\})\s*@/.test(prelude);
      const trimmedAt = prelude.slice(prelude.lastIndexOf('}') + 1).trimStart();
      const opaque = trimmedAt.startsWith('@') && AT_BLOCK_NO_SELECTORS.test(trimmedAt);

      if (depth === 0 && !trimmedAt.startsWith('@')) {
        /* A top-level rule: everything before the prelude is comments and
           whitespace and passes through; the prelude itself gets guarded. */
        const cut = prelude.lastIndexOf('*/');
        const lead = cut === -1 ? '' : prelude.slice(0, cut + 2);
        const sel = cut === -1 ? prelude : prelude.slice(cut + 2);
        out += lead + applyGuard(sel, guard, file) + '{';
      } else if (depth === 1 && atStack[0] && !atStack[0].opaque && !trimmedAt.startsWith('@')) {
        /* A rule inside @media / @supports: same treatment, one level in. */
        const cut = prelude.lastIndexOf('*/');
        const lead = cut === -1 ? '' : prelude.slice(0, cut + 2);
        const sel = cut === -1 ? prelude : prelude.slice(cut + 2);
        out += lead + applyGuard(sel, guard, file) + '{';
      } else {
        out += prelude + '{';
      }

      atStack.unshift({ opaque: opaque || (isAt && trimmedAt.startsWith('@')) && opaque });
      depth++;
      buf = '';
      i++;
      continue;
    }

    if (c === '}') {
      out += buf + '}';
      atStack.shift();
      depth--;
      buf = '';
      i++;
      continue;
    }

    buf += c;
    i++;
  }

  return out + buf;
}

function build() {
  const files = readdirSync(SRC).filter((f) => f.endsWith('.css')).sort();
  if (!files.length) throw new Error('src/ holds no css');

  const parts = files.map((f) => {
    const css = readFileSync(join(SRC, f), 'utf8');
    const m = css.match(/^\/\*\s*@guard\s+([^*]+?)\s*\*\//);
    const banner =
      `/* ---------------------------------------------------------------------\n` +
      `   src/${f}${m ? `   guarded by  ${m[1].trim()}` : ''}\n` +
      `   Generated by build.mjs. Edit the file under src/, never this one.\n` +
      `   --------------------------------------------------------------------- */\n`;
    if (!m) return banner + css;
    const body = css.slice(m[0].length);
    return banner + guardStylesheet(body, m[1].trim(), `src/${f}`);
  });

  const header =
    `/* GENERATED FILE - do not edit.\n` +
    `   Built from src/ by build.mjs. Run \`npm run build\` after editing src/.\n` +
    `   \`npm test\` fails if this file and src/ have drifted apart. */\n\n`;

  return header + parts.join('\n');
}

const result = build();

if (process.argv.includes('--check')) {
  let current = '';
  try { current = readFileSync(OUT, 'utf8'); } catch { /* not built yet */ }
  if (current !== result) {
    console.error('theme.css does not match a fresh build of src/. Run: npm run build');
    process.exit(1);
  }
  console.log('theme.css is in sync with src/');
} else {
  writeFileSync(OUT, result);
  console.log(`theme.css written: ${result.length} bytes`);
}
