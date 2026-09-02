import type { ReactNode } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  type LinksFunction,
  type MetaFunction,
} from "react-router";
import { pathnameFromMarkdownPath } from "@heyo-sh/heyo-docs";
import { adobeAnalyticsScript } from "@heyo-sh/heyo-docs/integrations/analytics/adobe";
import { osanoConsentScript } from "@heyo-sh/heyo-docs/integrations/consent/osano";
import { intercomBootstrapScript } from "@heyo-sh/heyo-docs/integrations/support/intercom";
import type { Route } from "./+types/root";

import "./app.css";
import { ThemeProvider } from "./components/theme-provider";
import config from "../heyo-docs.config";
import { getThemeScript, THEME_STORAGE_KEY } from "./lib/theme";

export const meta: MetaFunction = () => {
  const canonical = config.siteUrl ? `${config.siteUrl}/` : undefined;

  return [
    { title: config.title },
    { name: "description", content: config.description },
    { name: "robots", content: "index, follow" },
    { name: "referrer", content: "strict-origin-when-cross-origin" },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: config.title },
    { property: "og:title", content: config.title },
    { property: "og:description", content: config.description },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: config.title },
    { name: "twitter:description", content: config.description },
    ...(canonical
      ? [
          { property: "og:url", content: canonical },
          {
            tagName: "link" as const,
            rel: "canonical",
            href: canonical,
          },
        ]
      : []),
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: config.title,
        description: config.description,
        ...(config.siteUrl ? { url: config.siteUrl } : {}),
      },
    },
  ];
};

export const links: LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", sizes: "any" },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  {
    rel: "icon",
    href: "/favicon-96x96.png",
    sizes: "96x96",
    type: "image/png",
  },
  {
    rel: "apple-touch-icon",
    href: "/apple-touch-icon.png",
    sizes: "180x180",
  },
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

const osano = config.integrations.consent.osano
  ? osanoConsentScript(config.integrations.consent.osano)
  : undefined;
const adobe = config.integrations.analytics.adobe
  ? adobeAnalyticsScript(config.integrations.analytics.adobe)
  : undefined;
const intercom = config.integrations.support.intercom
  ? intercomBootstrapScript()
  : undefined;

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        {osano && <script src={osano.src} />}
        <script
          dangerouslySetInnerHTML={{
            __html: getThemeScript(THEME_STORAGE_KEY, config.mode),
          }}
        />
        {adobe && <script async={adobe.async} src={adobe.src} />}
        {intercom && (
          <script
            data-intercom-app-id={config.integrations.support.intercom?.appId}
            dangerouslySetInnerHTML={{ __html: intercom }}
          />
        )}
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider
          defaultTheme={config.mode}
          storageKey={THEME_STORAGE_KEY}
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

/**
 * Follows the Fumadocs React Router pattern: Markdown needs a resource route,
 * while this middleware keeps the public URL as `/<page>.md`.
 */
const markdownMiddleware: Route.MiddlewareFunction = async (
  { request },
  next,
) => {
  const url = new URL(request.url);
  if (
    !url.pathname.startsWith(`${MARKDOWN_RESOURCE_PREFIX}/`) &&
    pathnameFromMarkdownPath(url.pathname) !== undefined
  ) {
    const target = new URL(
      `${MARKDOWN_RESOURCE_PREFIX}${url.pathname}${url.search}`,
      url,
    );
    return Response.redirect(target, 307);
  }
  return next();
};

export const middleware = [markdownMiddleware];
