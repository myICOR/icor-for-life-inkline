# ICOR for Life - INKLINE

An Obsidian theme with two rooms: an ink room (dark) and a paper room
(light). One marker orange, drawn hairlines, and a teacher's handwriting
in the margin.

Most themes add color; INKLINE takes it away. Almost everything on the
page is ink on paper, one orange is reserved for the few places that need
your attention, and your highlights and comments render the way they
would in a well-marked book: marker wash and handwriting. The result is a
vault that reads like pages, not like an interface.

![INKLINE screenshot](screenshot.png)

**Beta release.** This theme works and is in daily use in a real vault,
but you will find rough edges. If something looks off, open an issue on
this repo and it gets fixed fast.

## What you get

- **Two full modes.** Ink (dark) and Paper (light), designed as one system,
  not an inversion. Both are derived from the myICOR application design
  tokens; every color in both modes rides the same token grammar.
- **The handwritten layer.** Blockquotes, `[!note]` / `[!tip]` / `[!quote]`
  callouts and `%%comments%%` render in a handwriting face, like a teacher
  writing in your margin. `==highlights==` are one marker wash, no glow.
- **Mermaid diagrams in ink.** Flowcharts and sequence diagrams are styled
  as part of the system: your reading typeface inside the nodes, drawn
  strokes, edge labels and arrowheads in theme colors, and correct color
  in dark mode. Obsidian's core dark mode renders mermaid by inverting the
  whole SVG, which turns a careful diagram into a photo negative; INKLINE
  switches that off and colors the diagram properly in both rooms.
- **Embedded fonts, zero requests.** Four typefaces ship inside the CSS as
  base64 woff2, each under the SIL Open Font License 1.1 and named in
  `THIRD-PARTY-NOTICES.md`. The theme makes no network requests at all.
- **A token grammar for plugins.** Every `--ink-*` token falls back to
  Obsidian defaults, and first-party ICOR plugins style themselves with the
  same tokens, so their dashboards match the theme in both modes.

## Install

Requires Obsidian 1.5.0 or newer.

- **From Obsidian:** Settings, Appearance, Themes, Manage, search "myICOR
  INKLINE", install, use.
- **Manually:** copy `theme.css` and `manifest.json` from the latest
  release into `.obsidian/themes/ICOR for Life - INKLINE/`, then select the theme
  under Settings, Appearance.

## ICOR for Life Obsidian Edition

ICOR for Life - INKLINE is the visual system of the **ICOR for Life Obsidian
Edition**: ICOR (Input, Control, Output, Refine), the productivity
methodology by Paperless Movement / myICOR, implemented as a ready-to-use
Obsidian vault. The Edition's dashboards are built on INKLINE's tokens,
so the theme is not an accessory here; it is the layer the other parts
draw themselves with. Best to be used in combination with:

- **[ICOR for Life - Planner](https://obsidian.md/plugins?id=icor-for-life-planner)**, the weekly
  planning board: Todoist, ClickUp, starred email and Google Calendar
  synced into the vault, planned by drag and drop. Its cards, lanes and
  tray are styled with INKLINE tokens.
- **[ICOR for Life - Focus](https://obsidian.md/plugins?id=icor-for-life-focus)**, the gravity map
  of your vault: what you touched today sits close, older work ripples
  outward. Drawn with the same token grammar, in both rooms.
- **[ICOR for Life - Diagrams](https://obsidian.md/plugins?id=icor-for-life-diagrams)**, a
  fullscreen viewer with zoom and pan for the mermaid diagrams this theme
  styles, so a diagram keeps the ink look at every zoom level.
- **[ICOR for Life - Connect](https://obsidian.md/plugins?id=icor-for-life-connect)**, your
  app.myicor.com courses, progress and knowledge base inside the vault.
  Its dashboards ship with zero palette of their own and take every color
  from the theme.
- **[ICOR for Life - Chat](https://obsidian.md/plugins?id=icor-for-life-chat)**, your AI team
  in a tab beside your notes. Its cards, tool rows and decision blocks are
  drawn with this theme's tokens, and a shipped gate measures them against
  it in all four rooms.

The theme styles whatever you run it with, first-party or not: the tokens
fall back to Obsidian's defaults, so your own plugin choices keep working.

The complete, preconfigured experience (theme, all plugins, the seven-room
vault structure and the AI team) ships free as the **ICOR for Life**
vault: https://myicor.com. The method behind it is taught in the ICOR
Journey there.

## License

Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International
(CC BY-NC-ND 4.0); see [LICENSE](LICENSE). The embedded fonts remain under
their own SIL Open Font License 1.1, detailed in
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md). Free to install and use;
not for resale or re-publication.
