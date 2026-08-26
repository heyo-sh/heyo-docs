import {
  createContext,
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from "react";

/** Props shared by framework-specific links supplied to the docs runtime. */
export type DocsLinkProps = ComponentPropsWithoutRef<"a">;

/**
 * A framework-aware link component. Applications can provide a small adapter
 * around their router's Link component, while the default remains a normal
 * anchor for static sites.
 */
export type DocsLinkComponent = ElementType;

const DocsLinkContext = createContext<DocsLinkComponent | undefined>(undefined);

export function DocsLinkProvider({
  children,
  link,
}: {
  children: ReactNode;
  link?: DocsLinkComponent;
}) {
  return (
    <DocsLinkContext.Provider value={link}>{children}</DocsLinkContext.Provider>
  );
}

/** Renders an internal documentation link with the host application's router. */
export const DocsLink = forwardRef<HTMLAnchorElement, DocsLinkProps>(
  function DocsLink({ children, ...props }, ref) {
    const Link = useContext(DocsLinkContext) ?? "a";

    return (
      <Link {...props} ref={ref}>
        {children}
      </Link>
    );
  },
);
