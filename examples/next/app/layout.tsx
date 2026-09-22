import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@heyo-sh/heyo-docs/theme/provider";
import {
  DEFAULT_THEME_STORAGE_KEY,
  themeBootstrapScript,
} from "@heyo-sh/heyo-docs/theme/script";
import { IntegrationScripts } from "@heyo-sh/heyo-docs/integrations";
import { nextSiteSeo } from "@heyo-sh/heyo-docs/seo/next";
import { serializeJsonLd } from "@heyo-sh/heyo-docs/seo";

import config from "../heyo-docs.config";
import "./_heyo-docs/theme.css";
import "./app.css";

const siteSeo = nextSiteSeo(config);

export const metadata: Metadata = {
  ...siteSeo.metadata,
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
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(siteSeo.structuredData),
          }}
        />
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
        </ThemeProvider>
      </body>
    </html>
  );
}
