/* OBSIDIAN'S OWN app.css, READ OFF THE INSTALLS ON THIS MACHINE.
 *
 * Every geometry and toggle gate in this repo has to render the theme
 * BEHIND the host, because a rule that matches an element has still proved
 * nothing until it beats app.css. On 2026-09-04 a green toggle pass covered
 * exactly that hole (Flint, review of 1.6.0), and on 2026-09-14 a header row
 * measured against a hand-written stand-in for the host missed the wrap that
 * put the toolbar on top of the file tree. Both failures have the same
 * shape: a second copy of Obsidian's behaviour, written by us, drifting.
 * This module is the one place that copy is not written - the bytes come
 * from the installed app.
 *
 * app.css is read at test time and never written into the repo: it is
 * Obsidian's file, not ours.
 *
 * NOTE: test/toggles.test.mjs still carries the original inline copy of this
 * reader, from before the module existed. Repointing it here is a follow-up
 * and is the reason this file is a module rather than a second inline copy.
 */

import {
  existsSync, readdirSync, openSync, readSync, closeSync,
} from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

/* Obsidian ships app.css inside an asar archive; the format is a 16-byte
   header, a JSON directory, then every file's bytes back to back. Ten lines
   read one entry out of it, which is cheaper than a dependency in a repo
   that has none, and it works offline. */
export function readAsarEntry(asar, name) {
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
   the app runs the newest of those. Both are worth rendering against,
   because the two builds on the reviewing machine have disagreed on plenty
   before. OBSIDIAN_ASAR names one more, for a machine laid out differently. */
export function hostCandidates() {
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

/* One entry per distinct Obsidian version found, oldest first. */
export function hostBuilds() {
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
    if (!byVersion.has(version)) {
      byVersion.set(version, { version, asar, css: css.toString('utf8') });
    }
  }
  return [...byVersion.values()]
    .sort((a, b) => a.version.localeCompare(b.version, 'en', { numeric: true }));
}
