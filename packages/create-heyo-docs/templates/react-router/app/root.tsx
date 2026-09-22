import type { ReactNode } from "react";
import { pathnameFromMarkdownPath } from "@heyo-sh/heyo-docs/llm";
import { ThemeProvider } from "@heyo-sh/heyo-docs/theme/provider";
import {
  DEFAULT_THEME_STORAGE_KEY,
  themeBootstrapScript,
} from "@heyo-sh/heyo-docs/theme/script";
import { IntegrationScripts } from "@heyo-sh/heyo-docs/integrations";
import { siteSeoMeta } from "@heyo-sh/heyo-docs/seo/react-router";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  type LinksFunction,
  type MetaFunction,
} from "react-router";
import type { Route } from "./+types/root";

import "virtual:heyo-docs-theme.css";
import "./app.css";
import { config } from "virtual:heyo-docs-config";

export const meta: MetaFunction = () => siteSeoMeta(config);

export const links: LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", sizes: "any" },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  {
    rel: "icon",
    href: "/favicon-96x96.png",
    sizes: "96x96",
    type: "image/png",
  },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
  { rel: "manifest", href: "/site.webmanifest" },
  ...(config.groups.some((group) => group.type === "changelog")
    ? [
        {
          rel: "alternate",
          href: "/rss.xml",
          type: "application/rss+xml",
          title: `${config.title} updates`,
        },
      ]
    : []),
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: themeBootstrapScript(
              DEFAULT_THEME_STORAGE_KEY,
              config.mode,
            ),
          }}
        />
        <IntegrationScripts
          integrations={config.integrations}
          placement="head"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <IntegrationScripts
          integrations={config.integrations}
          placement="body"
        />
        <ThemeProvider
          defaultTheme={config.mode}
          storageKey={DEFAULT_THEME_STORAGE_KEY}
        >
          {children}
          <ScrollRestoration />
          <Scripts />
        </ThemeProvider>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

const MARKDOWN_RESOURCE_PREFIX = "/__heyo-docs/markdown";

/** Exposes `/<page>.md` without making the resource implementation public. */
const markdownMiddleware: Route.MiddlewareFunction = async (
  { request },
  next,
) => {
  const url = new URL(request.url);
  if (
    !url.pathname.startsWith(`${MARKDOWN_RESOURCE_PREFIX}/`) &&
    pathnameFromMarkdownPath(url.pathname) !== undefined
  ) {
    return Response.redirect(
      new URL(`${MARKDOWN_RESOURCE_PREFIX}${url.pathname}${url.search}`, url),
      307,
    );
  }
  return next();
};

export const middleware = [markdownMiddleware];
