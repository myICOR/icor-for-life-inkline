# Changelog

All notable changes to ICOR for Life - INKLINE.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/).

Releases before 1.6.1 are described by their tags and release notes on
GitHub; this file starts with 1.6.1.

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
