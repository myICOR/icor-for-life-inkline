# Changelog

All notable changes to ICOR for Life - INKLINE.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/).

Releases before 1.6.1 are described by their tags and release notes on
GitHub; this file starts with 1.6.1.


## 1.9.0 (2026-11-23)

- Tooltips are INKLINE's one tooltip (`.ik-tip`, DESIGN 13): a small solid label in the body face (600 12.5px/1.25),
  7px 10px of padding, an 8px corner, no tilt, no hand, no arrow, no shadow; paper on ink in the dark theme, ink on
  paper in the light one (new `--ink-solid` / `--ink-on-solid`). A shortcut inside one is the kbd chip. Each label
  springs in from its control's side (6px and a 0.94 scale on the SOFT spring), by Obsidian's `mod-top`, `mod-left`,
  `mod-right` and the unmarked default below. Obsidian keeps its own timing: it waits a beat before the first label and
  swaps the next one at once; it removes a label on leave, so there is no fade-out to draw. Fixed on the way: the
  1.8.0 `transform: rotate(-2deg)` replaced Obsidian's own centring transform, so every label sat half its width off
  its control; the entrance now moves only `translate` and `scale`. Reduced motion still turns it off.
- No handwriting in interface text (INKLINE DESIGN 3 and 16). The Tags pane, tag pills in properties and tags in notes
  and in the editor are quiet chips in the `.ik-chip` look (transparent, a hairline ring, the body face at 500, the
  dim ink, no marker). The word count, empty states, blockquotes, note/tip/quote/cite callouts, `%%comments%%`, canvas
  node labels and Mermaid notes are plain text in the body face in normal colours. Handwriting stays only in
  `.ink-hand` (a page's one aside) and in the opt-in `cssclasses: inkline-hand` page, which is unchanged. The unused
  `--ink-hand-overhang` is gone; Style Settings says "Turn off handwriting" and what it still reaches.
- The file-tree button row is Obsidian's. The suite launchers moved to the left ribbon, so the theme no longer styles
  `.micor-tree-slot` (centring, 24px grid, gap, margin, launcher order): the row renders as app.css draws it, with
  Obsidian's own new note, new folder, sort, auto-reveal and collapse; the banner above it is unchanged, and the
  scaffold's hides stay behind `icor-scaffold-chrome`. The settings and comments no longer say the ribbon is safe to
  hide in an ICOR for Life vault: the launchers live there now.
- Tests: `test/type.test.mjs` pins the tooltip (no rotation, body face, solid ground, 8px corner, padding, kbd chip,
  direction) and no hand font on the Tags pane, tag pills, tags, word count, empty states, quotes, callouts, comments,
  canvas labels and Mermaid notes, in both themes, alone and behind app.css. `test/header-row.test.mjs` now holds the
  button row equal to Obsidian's own and checks the tree still starts below the header (full, scaffold, narrow and
  empty row). The toggles gate probes handwriting on an `inkline-hand` page. `THEME_CSS=<path>` runs the type and
  header-row gates against another build.

## 1.8.0 (2026-11-23)

- The file tree follows the ICOR stage layout. Each top folder wears its stage's colour: Input (#5271FC) for
  00 Daily Notes and 01 Inbox, Control (#52F49A) for 02 Inner World, 03 Outer World, 04 Assets and 05 Databases,
  Output (#FD63FF) for 06 Planner; Refine has no folder. In the light theme each is darkened just enough to read
  (#4863DE, #2A7C4F, #AC43AD). Every folder inside a stage folder takes the stage colour; named ones (Journal,
  Contacts, Images...) keep their own icon. Labels are the folder name minus its number.
- Folders are matched by their full name, no longer by the number in front: a `06 AI Team` or `03 WiP` left from 2.x
  looks like any plain folder, and so do its subfolders (the AI Team subfolder icons are gone). The same folders under
  their names from before the stage layout (00 Daily Scratchpad, 02 Planner, 04 Inner World, 05 Assets,
  06 Outer World, 07 Databases) keep a colour, by stage, until the vault moves.
- These are the theme's own colours for a vault without ICOR for Life - Interface; with Interface 0.10, the vault's
  `_System/schema.json` decides.
- Style Settings says folders: "ICOR for Life folders", "Turn off folder icons and colors".
- The file-tree baseline (test/fixtures/rooms-baseline.json) is re-recorded for the stage layout, and a new test pins
  each top folder's stage colour in both themes.

## 1.7.2 (2026-11-23)

- No WiP room. ICOR for Life 3.0 has no `03 WiP`, so the theme no longer colours, labels or marks a `03` folder: one a
  migrated vault still holds looks like any other plain folder. The other rooms are unchanged.

## 1.7.1 (2026-11-21)

- The banner carries the current myICOR mark: the closed figure-eight with the right loop a little larger, one round
  marker stroke (brand/mark.svg), in place of the old symmetric infinity. Wordmark and underline unchanged.
- The properties bar: one row, opened and closed anywhere on it (with ICOR for Life - Interface 0.9), slim when folded,
  a hover; no marker ring after a click, the focus ring only for the keyboard.

## [1.7.0] - unreleased

### Changed
- Root folder `06` is labelled **Outer World** (globe icon); `AGENTS.md` is a quiet housekeeping file like README.

### Added
- **A Look switch: Flat or Gradient** (the ICOR for Life Objects plugin's
  settings, or Style Settings, ICOR for Life - INKLINE, The look). Flat is the theme as it was, and
  stays the default. Gradient puts INKLINE's brand layer on top, as
  myICOR wears it since November 2026: glass cards with depth for callouts, embeds, the
  properties panel and Bases cards, floating dialogs, menus and the
  command palette, and a soft light under the one orange action. Text,
  links and buttons never carry light. Needs the Style Settings plugin to
  switch; without it the theme stays Flat.

## [1.6.2] - 2026-09-17

### Fixed
- **"New note" is hidden again on Obsidian 1.13.7, and in every interface
  language.** The scaffold's chrome option hides New note, New folder and
  Change sort order from the file-tree toolbar. Obsidian renamed the New
  note icon, and the theme still named only the two older names, so on
  1.13.7 the hide held only for people running Obsidian in English and the
  button came back for everyone else. All three names are now listed, so
  the option does the same thing on every build and in every language.
  This is the scaffold option `Reduce Obsidian's own controls`, which is
  off unless you turn it on; a vault that leaves it off is unaffected.
- **The file-explorer toolbar puts the app launchers first and Obsidian's
  own buttons after them, in Obsidian's own order.** Obsidian's
  auto-reveal button came back to that row with ICOR for Life - Interface
  0.7.0, and the theme had no place for it, so it sat in the middle of the
  launchers. The row now reads as two groups: everything that opens
  something, then everything that acts on the file tree, ending with
  collapse-all. Nothing was added or taken away, and the row keeps its
  spacing.

### Changed
- `test/header-row.test.mjs` measures the theme's own hide rule instead of
  a hand-written copy of it, and measures the auto-reveal button, which it
  had never seen. The row is checked twice now, once with the scaffold
  option on (four buttons, 108px) and once off (seven buttons, 192px),
  behind every Obsidian build on the machine. Eleven of its checks were
  watched fail against 1.6.1 before the fix landed.

Nothing else changed in this release. `minAppVersion` stays at 1.5.8, so
every vault that could install 1.6.1 can install 1.6.2.

[1.6.2]: https://github.com/myICOR/icor-for-life-inkline/releases/tag/1.6.2

## [1.6.1] - 2026-09-15

### Fixed
- **The file-explorer toolbar row grows when a narrow sidebar wraps its
  icons instead of painting them over the tree. Reported by Olivier Van
  Biervliet in the theme channel.** Obsidian's own toolbar wraps onto a
  second line once the left sidebar is narrow enough. The theme had pinned
  that row to a fixed height of 24px, which cannot grow, so the second line
  rendered outside the row and painted over the top of the file tree. The
  row now carries a minimum height rather than a fixed one: one line looks
  exactly as it did, and two lines get the room they need. Six controls
  wrap at a pane of 180px, seven at 216px.
- A measured gate for it in `test/header-row.test.mjs`, watched red against
  the 1.6.0 CSS first: six controls in a 180px pane, the row measures 52px,
  and no control's bottom edge sits below the row's own bottom edge.

Nothing else changed in this release. `minAppVersion` stays at 1.5.8, so
every vault that could install 1.6.0 can install 1.6.1.

[1.6.1]: https://github.com/myICOR/icor-for-life-inkline/releases/tag/1.6.1
