import { createContext, type ReactNode, useContext } from "react";

import type { IconProps, IconSet, SemanticIcon } from "../types";

const iconAliases: Record<string, SemanticIcon> = {
  book: "book",
  changelog: "changelog",
  code: "code",
  file: "file",
  filetext: "file",
  github: "github",
  globe: "globe",
  global: "globe",
  signin: "signIn",
  login: "signIn",
  chevrondown: "chevronDown",
  chevronright: "chevronRight",
  arrowdown: "arrowDown",
  arrowup: "arrowUp",
  arrowright: "arrowRight",
  close: "close",
  cornerdownleft: "cornerDownLeft",
  menu: "menu",
  search: "search",
  sun: "sun",
  moon: "moon",
  checkcircle: "checkCircle",
  check: "check",
  closecircle: "closeCircle",
  externallink: "externalLink",
  folder: "folder",
  gitfork: "gitFork",
  gitrepository: "gitRepository",
  information: "information",
  lightbulb: "lightbulb",
  copy: "copy",
  star: "star",
  bot: "bot",
  cursor: "cursor",
  chat: "chat",
};

const IconSetContext = createContext<IconSet>({});

function normaliseIconName(name: string): SemanticIcon | undefined {
  return iconAliases[name.replace(/[^a-z0-9]/gi, "").toLowerCase()];
}

/** Provides the application's statically imported semantic icon set. */
export function IconProvider({
  children,
  icons,
}: {
  children: ReactNode;
  icons: IconSet;
}) {
  return (
    <IconSetContext.Provider value={icons}>{children}</IconSetContext.Provider>
  );
}

/**
 * Renders a semantic Heyo Docs icon from the application's icon set.
 * Unknown names or omitted icon mappings are deliberately rendered as empty.
 */
export function Icon({
  name,
  className,
  ...props
}: {
  name?: string;
  className?: string;
} & IconProps) {
  const icons = useContext(IconSetContext);
  const semanticName = name ? normaliseIconName(name) : undefined;
  const SvgIcon = semanticName ? icons[semanticName] : undefined;

  if (!SvgIcon) return null;

  return <SvgIcon aria-hidden="true" className={className} {...props} />;
}
