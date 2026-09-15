# Changelog

All notable changes to ICOR for Life - INKLINE.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/).

Releases before 1.6.1 are described by their tags and release notes on
GitHub; this file starts with 1.6.1.

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
