/** Normalises a site-relative pathname without altering the host or protocol. */
export function normalisePathname(pathname: string): string {
  const withoutQueryOrHash = pathname.split(/[?#]/, 1)[0] ?? "";
  const segments = withoutQueryOrHash.split("/").filter(Boolean);
  return segments.length ? `/${segments.join("/")}` : "/";
}

/** Appends a docs-relative pathname to a site URL pathname without losing its prefix. */
export function pathnameAtBasePath(
  basePathname: string,
  pathname: string,
): string {
  const base = normalisePathname(basePathname);
  const path = normalisePathname(pathname);
  return `${base === "/" ? "" : base}${path === "/" ? "/" : path}`;
}

/** Resolves a docs-relative pathname beneath a site URL, including a path prefix. */
export function absoluteUrlAtBasePath(
  siteUrl: string,
  pathname: string,
): string {
  const url = new URL(siteUrl);
  url.pathname = pathnameAtBasePath(url.pathname, pathname);
  url.search = "";
  url.hash = "";
  return url.toString();
}
