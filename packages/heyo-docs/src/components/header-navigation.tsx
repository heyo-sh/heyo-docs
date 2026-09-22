import { DocsLink } from "./docs-link";
import { Button } from "./ui/button";
import type { HeaderNavigationItem } from "../types";

/** The serialisable default implementation for theme header navigation slots. */
export function HeaderNavigation({ items }: { items: HeaderNavigationItem[] }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Primary navigation" className="heyo-docs-header-links">
      {items.map((item) => {
        const external = /^(?:https?:)?\/\//.test(item.href);
        return (
          <Button
            key={`${item.label}:${item.href}`}
            nativeButton={false}
            render={
              <DocsLink
                href={item.href}
                {...(external ? { rel: "noreferrer", target: "_blank" } : {})}
              />
            }
            variant={item.variant}
          >
            {item.label}
          </Button>
        );
      })}
    </nav>
  );
}
