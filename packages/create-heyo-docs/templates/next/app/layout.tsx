import type { Metadata } from "next";
import type { ReactNode } from "react";
import { adobeAnalyticsScript } from "@heyo-sh/heyo-docs/integrations/analytics/adobe";
import { osanoConsentScript } from "@heyo-sh/heyo-docs/integrations/consent/osano";
import { intercomBootstrapScript } from "@heyo-sh/heyo-docs/integrations/support/intercom";

import config from "../heyo-docs.config";
import "./app.css";
import { ThemeProvider } from "./components/theme-provider";
import { getThemeScript, THEME_STORAGE_KEY } from "./lib/theme";

export const metadata: Metadata = {
  ...(config.siteUrl ? { metadataBase: new URL(config.siteUrl) } : {}),
  title: config.title,
  description: config.description,
  robots: { index: true, follow: true },
  alternates: {
    ...(config.siteUrl ? { canonical: "/" } : {}),
    ...(config.groups.some((group) => group.type === "changelog")
      ? { types: { "application/rss+xml": "/rss.xml" } }
      : {}),
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: config.title,
    title: config.title,
    description: config.description,
    ...(config.siteUrl ? { url: config.siteUrl } : {}),
  },
  twitter: {
    card: "summary",
    title: config.title,
    description: config.description,
  },
};

const osano = config.integrations.consent.osano
  ? osanoConsentScript(config.integrations.consent.osano)
  : undefined;
const adobe = config.integrations.analytics.adobe
  ? adobeAnalyticsScript(config.integrations.analytics.adobe)
  : undefined;
const intercom = config.integrations.support.intercom
  ? intercomBootstrapScript()
  : undefined;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <script
          dangerouslySetInnerHTML={{
            __html: getThemeScript(THEME_STORAGE_KEY, config.mode),
          }}
        />
        {osano && <script src={osano.src} />}
        {adobe && <script async={adobe.async} src={adobe.src} />}
        {intercom && (
          <script
            data-intercom-app-id={config.integrations.support.intercom?.appId}
            dangerouslySetInnerHTML={{ __html: intercom }}
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: config.title,
              description: config.description,
              ...(config.siteUrl ? { url: config.siteUrl } : {}),
            }).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body>
        <ThemeProvider
          defaultTheme={config.mode}
          storageKey={THEME_STORAGE_KEY}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
