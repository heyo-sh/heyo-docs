import type { ComponentProps } from "react";

import type { IconProps } from "../../types";

/**
 * The handful of glyphs the theme's own chrome needs.
 *
 * Configured icons — group, section and page icons — still come from the
 * application's icon set through `Icon`, because those names are the
 * application's to choose. Chrome is different: a disclosure chevron that
 * renders as nothing because the host forgot to map `chevronRight` is a
 * navigation you cannot read. Every path below is from `@tabler/icons`
 * (24×24 grid, 2px stroke, round caps), the same set heyo-ui inlines.
 */
function Glyph({ children, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...props}
    >
      {children}
    </svg>
  );
}

/** tabler: chevron-right */
export function ChevronRightGlyph(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M9 6l6 6l-6 6" />
    </Glyph>
  );
}

/** tabler: chevron-down */
export function ChevronDownGlyph(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6 9l6 6l6 -6" />
    </Glyph>
  );
}

/** tabler: check */
export function CheckGlyph(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M5 12l5 5l10 -10" />
    </Glyph>
  );
}

/** tabler: search */
export function SearchGlyph(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
      <path d="M21 21l-6 -6" />
    </Glyph>
  );
}

/** tabler: menu-2 */
export function MenuGlyph(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4 6l16 0" />
      <path d="M4 12l16 0" />
      <path d="M4 18l16 0" />
    </Glyph>
  );
}

/** tabler: sun */
export function SunGlyph(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
      <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" />
    </Glyph>
  );
}

/** tabler: moon */
export function MoonGlyph(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
    </Glyph>
  );
}

/** tabler: arrow-up-right */
export function ExternalGlyph(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M17 7l-10 10" />
      <path d="M8 7l9 0l0 9" />
    </Glyph>
  );
}

/** tabler: world */
export function GlobeGlyph(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M3.6 9h16.8" />
      <path d="M3.6 15h16.8" />
      <path d="M11.5 3a17 17 0 0 0 0 18" />
      <path d="M12.5 3a17 17 0 0 1 0 18" />
    </Glyph>
  );
}

/** tabler: brand-github */
export function GithubGlyph(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
    </Glyph>
  );
}
