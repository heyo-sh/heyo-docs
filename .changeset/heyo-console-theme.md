---
"@heyo-sh/heyo-docs": minor
"@heyo-sh/create-heyo-docs": minor
---

Add `heyo`, a console theme built on the heyo-ui design language.

Select it with `theme: "heyo"`, import `@heyo-sh/heyo-docs/theme/heyo.css`, and
render `heyoTheme` — or pick **Heyo** in `create-heyo-docs`.

What it is:

- **A monochrome accent.** `--primary` is the inverse of the page, near-black on
  light and near-white on dark, so hue is left to mean one thing: status.
- **Flat surfaces and translucent edges.** The sidebar shares the page fill and
  a single hairline separates it; nothing floats on its own tint. Edge colours
  are translucent, so one value is correct on every surface.
- **A dense 12 / 13 / 14 / 16px scale**, with hierarchy from weight and colour
  rather than size, and shadows reduced to a hairline plus a whisper of drop.

What it composes differently:

- The group switcher is a `Select`-shaped control at the top of the sidebar
  instead of header tabs, and it disappears when there is only one group. Header
  tabs and segmented tracks both need room proportional to the number of groups,
  which a 15rem rail does not have.
- Search sits directly under it, with the shortcut spelled out as keycaps.
- The breadcrumb owns the 48px header; colour mode is toggled there so it stays
  reachable while the sidebar is a closed drawer.
- Sidebar sections disclose their pages, count them, and hang them off a guide
  rail at every depth. Changelog entries use the same rail with a marker for the
  entry under the reading line.
- External links pin to the sidebar footer, which renders nothing when no
  website or repository is configured.
- The 404 body is styled rather than inheriting browser defaults.

The shared search component now accepts `triggerClassName` and `triggerContent`
for its button trigger, and labels it `Search documentation`. Themes that want a
search affordance of their own no longer have to reach for the read-only input:
browsers always treat a focused text field as keyboard-focused, so restoring
focus to one after the dialog closes parks a focus ring on it.
