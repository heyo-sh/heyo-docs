import { DocsLink } from "./docs-link";
import type { HeaderNavigationItem } from "../types";

/** The serialisable default implementation for theme header navigation slots. */
export function HeaderNavigation({ items }: { items: HeaderNavigationItem[] }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Primary navigation" className="heyo-docs-header-links">
      {items.map((item) => {
        const external = /^(?:https?:)?\/\//.test(item.href);
        return (
          <DocsLink
            href={item.href}
            key={`${item.label}:${item.href}`}
            {...(external ? { rel: "noreferrer", target: "_blank" } : {})}
          >
            {item.label}
          </DocsLink>
        );
      })}
    </nav>
  );
}
