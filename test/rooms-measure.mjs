/* Measures what the theme does to the file tree, in a real engine.
 *
 * Shared by rooms.test.mjs (which compares a build against the recorded
 * baseline) and by `node test/rooms-measure.mjs --record`, which writes that
 * baseline. The baseline is a MEASUREMENT of 1.4.0, the last release in which
 * every room rule was written out by hand, and it is what the data-driven
 * mechanism has to reproduce exactly: same border, same tint, same glyph,
 * same label, same colour, in both rooms.
 *
 * The fixture is the awkward tree on purpose: every room, named subfolders,
 * an unnamed folder inside a room (the family floor), a date-nested folder
 * and an AI-session folder (both excluded from the floor), a plain root
 * folder that must stay untouched, and the housekeeping files.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_BIN
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export const BASELINE = resolve(repo, 'test', 'fixtures', 'rooms-baseline.json');

/* Every path is a probe. The id is what the measurement is keyed on. */
export const TREE = [
  ['r00', '00 Daily Scratchpad'],
  ['r01', '01 Inbox'],
  ['r02', '02 Planner'],
  ['r03', '03 WiP'],
  ['r04', '04 Inner World'],
  ['r05', '05 Assets'],
  ['r06', '06 AI Team'],
  ['r07', '07 Databases'],
  ['r07data', '07 Data'],   /* the private-vault name; the prefix is the identity */
  ['n04journal', '04 Inner World/Journal'],
  ['n04mylife', '04 Inner World/My Life'],
  ['n04goals', '04 Inner World/My Life/Goals'],
  ['n01outer', '01 Inbox/Outer World'],
  ['n05images', '05 Assets/Images'],
  ['n06agents', '06 AI Team/Agents'],
  ['n06sessions', '06 AI Team/AI Sessions'],
  ['floor', '03 WiP/2026-08-31-some-work'],
  ['floor2', '06 AI Team/Agents/Penn - Journal Writer'],
  ['floor07', '07 Databases/mypka-health'],
  ['date', '04 Inner World/Journal/2026'],
  ['date2', '04 Inner World/Journal/2026/08'],
  ['session', '06 AI Team/AI Sessions/2026-08-30_1312_open-note_abc123'],
  ['plain', 'Notes'],
  ['plainsub', 'Notes/Ideas'],
  ['renamed', '04 Somewhere Else'],
];

export const FILES = [
  ['fclaude', 'CLAUDE.md'],
  ['freadme', 'README.md'],
  ['fnote', 'Notes/hello.md'],
];

function fixture(themeCss, room, extraAttrs = {}) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const folders = TREE.map(([id, path]) =>
    `<div class="nav-folder"><div id="${id}" class="nav-folder-title" data-path="${esc(path)}"${extraAttrs[id] || ''}>` +
    `<div class="nav-folder-collapse-indicator collapse-icon"><svg class="svg-icon"></svg></div>` +
    `<div class="nav-folder-title-content">${esc(path.split('/').pop())}</div></div></div>`).join('\n');
  const files = FILES.map(([id, path]) =>
    `<div class="nav-file"><div id="${id}" class="nav-file-title" data-path="${esc(path)}">` +
    `<div class="nav-file-title-content">${esc(path.split('/').pop())}</div></div></div>`).join('\n');
  const ids = JSON.stringify([...TREE.map((t) => t[0]), ...FILES.map((f) => f[0])]);

  return `<!doctype html><html><head><style>
  * { box-sizing: border-box; }
  body { margin: 0; width: 900px; --nav-item-size: 14px; }
${themeCss}
  </style></head><body class="${room}">
  <div class="workspace-leaf-content" data-type="file-explorer">
    <div class="nav-files-container"><div class="tree-item nav-folder mod-root"><div class="nav-folder-children">
${folders}
${files}
    </div></div></div>
  </div>
  <pre id="out"></pre>
  <script>
  const out = {};
  for (const id of ${ids}) {
    const el = document.getElementById(id);
    const cs = getComputedStyle(el);
    const content = el.querySelector('.nav-folder-title-content, .nav-file-title-content');
    const ccs = getComputedStyle(content);
    const before = getComputedStyle(content, '::before');
    const after = getComputedStyle(content, '::after');
    const arrow = el.querySelector('.collapse-icon');
    const mask = (s) => {
      const v = s.maskImage !== 'none' ? s.maskImage : s.webkitMaskImage;
      if (!v || v === 'none') return 'none';
      /* a 1KB data URI is not a readable diff; the hash is */
      let h = 0; for (let i = 0; i < v.length; i++) h = (h * 31 + v.charCodeAt(i)) | 0;
      return 'svg#' + (h >>> 0).toString(16) + ':' + v.length;
    };
    out[id] = {
      /* --room-tone is the per-room resolved colour from 1.5.0 on; 1.4.0 set
         --room-color directly per room. Reading tone-then-color keeps the
         1.4.0 baseline comparable. */
      roomColor: (cs.getPropertyValue('--room-tone').trim() || cs.getPropertyValue('--room-color').trim()),
      borderLeft: cs.borderLeftWidth + ' ' + cs.borderLeftStyle + ' ' + cs.borderLeftColor,
      background: cs.backgroundColor,
      opacity: cs.opacity,
      arrow: arrow ? getComputedStyle(arrow).display : 'n/a',
      textSize: ccs.fontSize,
      textColor: ccs.color,
      textDisplay: ccs.display,
      before: before.content === 'none' ? 'none' : {
        w: before.width, h: before.height, mr: before.marginRight,
        bg: before.backgroundColor, mask: mask(before),
      },
      after: after.content === 'none' || after.content === 'normal' ? 'none' : {
        content: after.content, color: after.color, size: after.fontSize, weight: after.fontWeight,
      },
    };
  }
  document.getElementById('out').textContent = JSON.stringify(out);
  </script></body></html>`;
}

const dir = mkdtempSync(join(tmpdir(), 'inkline-rooms-'));
let shot = 0;

export function measure(themeCss, room = 'theme-dark', extraAttrs = {}) {
  const file = join(dir, `r${shot++}.html`);
  writeFileSync(file, fixture(themeCss, room, extraAttrs));
  const dom = execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--virtual-time-budget=2000', '--dump-dom', `file://${file}`,
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
  const m = dom.match(/<pre id="out">([^<]*)<\/pre>/);
  if (!m) throw new Error('the fixture produced no measurement');
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
}

export function measureBoth(themeCss) {
  return { ink: measure(themeCss, 'theme-dark'), paper: measure(themeCss, 'theme-light') };
}

if (process.argv.includes('--record')) {
  const css = readFileSync(resolve(repo, 'theme.css'), 'utf8');
  const result = measureBoth(css);
  writeFileSync(BASELINE, JSON.stringify(result, null, 1) + '\n');
  console.log(`recorded ${Object.keys(result.ink).length} probes x 2 rooms -> ${BASELINE}`);
}
