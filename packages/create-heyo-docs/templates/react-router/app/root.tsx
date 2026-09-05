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
import { amplitudeAnalyticsScript } from "@heyo-sh/heyo-docs/integrations/analytics/amplitude";
import { clarityBootstrapScript } from "@heyo-sh/heyo-docs/integrations/analytics/clarity";
import { clearbitAnalyticsScript } from "@heyo-sh/heyo-docs/integrations/analytics/clearbit";
import { fathomAnalyticsScript } from "@heyo-sh/heyo-docs/integrations/analytics/fathom";
import {
  googleAnalyticsBootstrapScript,
  googleAnalyticsScript,
} from "@heyo-sh/heyo-docs/integrations/analytics/google-analytics";
import {
  googleTagManagerBootstrapScript,
  googleTagManagerNoScriptUrl,
} from "@heyo-sh/heyo-docs/integrations/analytics/google-tag-manager";
import { heapBootstrapScript } from "@heyo-sh/heyo-docs/integrations/analytics/heap";
import { hotjarBootstrapScript } from "@heyo-sh/heyo-docs/integrations/analytics/hotjar";
import {
  logRocketBootstrapScript,
  logRocketScript,
} from "@heyo-sh/heyo-docs/integrations/analytics/logrocket";
import {
  mixpanelBootstrapScript,
  mixpanelScript,
} from "@heyo-sh/heyo-docs/integrations/analytics/mixpanel";
import {
  openpanelBootstrapScript,
  openpanelScript,
} from "@heyo-sh/heyo-docs/integrations/analytics/openpanel";
import { openReplayBootstrapScript } from "@heyo-sh/heyo-docs/integrations/analytics/openreplay";
import { osanoConsentScript } from "@heyo-sh/heyo-docs/integrations/consent/osano";
import {
  transcendConsentScript,
  transcendGoogleConsentModeDefaultsScript,
} from "@heyo-sh/heyo-docs/integrations/consent/transcend";
import { pirschAnalyticsScript } from "@heyo-sh/heyo-docs/integrations/analytics/pirsch";
import { plausibleAnalyticsScript } from "@heyo-sh/heyo-docs/integrations/analytics/plausible";
import {
  posthogApiHost,
  posthogBootstrapScript,
  posthogScript,
} from "@heyo-sh/heyo-docs/integrations/analytics/posthog";
import { rybbitAnalyticsScript } from "@heyo-sh/heyo-docs/integrations/analytics/rybbit";
import {
  swetrixBootstrapScript,
  swetrixScript,
} from "@heyo-sh/heyo-docs/integrations/analytics/swetrix";
import { chaskiqBootstrapScript } from "@heyo-sh/heyo-docs/integrations/support/chaskiq";
import { chatwootBootstrapScript } from "@heyo-sh/heyo-docs/integrations/support/chatwoot";
import {
  frontChatBootstrapScript,
  frontChatScript,
} from "@heyo-sh/heyo-docs/integrations/support/front";
import { intercomBootstrapScript } from "@heyo-sh/heyo-docs/integrations/support/intercom";
import { papercupsBootstrapScript } from "@heyo-sh/heyo-docs/integrations/support/papercups";
import { typebotBootstrapScript } from "@heyo-sh/heyo-docs/integrations/support/typebot";
import { umamiAnalyticsScript } from "@heyo-sh/heyo-docs/integrations/analytics/umami";
import {
  zammadBootstrapScript,
  zammadChatScript,
} from "@heyo-sh/heyo-docs/integrations/support/zammad";
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
const transcend = config.integrations.consent.transcend
  ? transcendConsentScript(config.integrations.consent.transcend)
  : undefined;
const transcendGoogleConsentDefaults =
  transcend &&
  (config.integrations.analytics.ga4 || config.integrations.analytics.gtm)
    ? transcendGoogleConsentModeDefaultsScript()
    : undefined;
const adobe = config.integrations.analytics.adobe
  ? adobeAnalyticsScript(config.integrations.analytics.adobe)
  : undefined;
const amplitude = config.integrations.analytics.amplitude
  ? amplitudeAnalyticsScript(config.integrations.analytics.amplitude)
  : undefined;
const clarity = config.integrations.analytics.clarity
  ? clarityBootstrapScript()
  : undefined;
const clearbit = config.integrations.analytics.clearbit
  ? clearbitAnalyticsScript(config.integrations.analytics.clearbit)
  : undefined;
const fathom = config.integrations.analytics.fathom
  ? fathomAnalyticsScript(config.integrations.analytics.fathom)
  : undefined;
const googleAnalytics = config.integrations.analytics.ga4
  ? googleAnalyticsScript(config.integrations.analytics.ga4)
  : undefined;
const googleAnalyticsBootstrap = googleAnalytics
  ? googleAnalyticsBootstrapScript()
  : undefined;
const googleTagManager = config.integrations.analytics.gtm
  ? googleTagManagerBootstrapScript()
  : undefined;
const googleTagManagerNoScript = config.integrations.analytics.gtm
  ? googleTagManagerNoScriptUrl(config.integrations.analytics.gtm)
  : undefined;
const heap = config.integrations.analytics.heap
  ? heapBootstrapScript()
  : undefined;
const hotjar = config.integrations.analytics.hotjar
  ? hotjarBootstrapScript()
  : undefined;
const logRocket = config.integrations.analytics.logrocket
  ? logRocketScript()
  : undefined;
const logRocketBootstrap = logRocket ? logRocketBootstrapScript() : undefined;
const mixpanel = config.integrations.analytics.mixpanel
  ? mixpanelScript()
  : undefined;
const mixpanelBootstrap = mixpanel ? mixpanelBootstrapScript() : undefined;
const openpanel = config.integrations.analytics.openpanel
  ? openpanelScript()
  : undefined;
const openpanelBootstrap = openpanel ? openpanelBootstrapScript() : undefined;
const openReplay = config.integrations.analytics.openreplay
  ? openReplayBootstrapScript()
  : undefined;
const pirsch = config.integrations.analytics.pirsch
  ? pirschAnalyticsScript(config.integrations.analytics.pirsch)
  : undefined;
const plausible = config.integrations.analytics.plausible
  ? plausibleAnalyticsScript(config.integrations.analytics.plausible)
  : undefined;
const posthog = config.integrations.analytics.posthog
  ? posthogScript(config.integrations.analytics.posthog)
  : undefined;
const posthogBootstrap = posthog ? posthogBootstrapScript() : undefined;
const posthogHost = config.integrations.analytics.posthog
  ? posthogApiHost(config.integrations.analytics.posthog)
  : undefined;
const rybbit = config.integrations.analytics.rybbit
  ? rybbitAnalyticsScript(config.integrations.analytics.rybbit)
  : undefined;
const swetrix = config.integrations.analytics.swetrix
  ? swetrixScript()
  : undefined;
const swetrixBootstrap = swetrix ? swetrixBootstrapScript() : undefined;
const umami = config.integrations.analytics.umami
  ? umamiAnalyticsScript(config.integrations.analytics.umami)
  : undefined;
const intercom = config.integrations.support.intercom
  ? intercomBootstrapScript()
  : undefined;
const front = config.integrations.support.front ? frontChatScript() : undefined;
const frontBootstrap = front ? frontChatBootstrapScript() : undefined;
const chatwoot = config.integrations.support.chatwoot
  ? chatwootBootstrapScript()
  : undefined;
const chaskiq = config.integrations.support.chaskiq
  ? chaskiqBootstrapScript()
  : undefined;
const papercups = config.integrations.support.papercups
  ? papercupsBootstrapScript()
  : undefined;
const typebot = config.integrations.support.typebot
  ? typebotBootstrapScript()
  : undefined;
const zammad = config.integrations.support.zammad
  ? zammadChatScript(config.integrations.support.zammad)
  : undefined;
const zammadBootstrap = zammad ? zammadBootstrapScript() : undefined;

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {transcendGoogleConsentDefaults && (
          <script
            dangerouslySetInnerHTML={{
              __html: transcendGoogleConsentDefaults,
            }}
          />
        )}
        {transcend && (
          <script data-cfasync={transcend.dataCfasync} src={transcend.src} />
        )}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        {osano && <script src={osano.src} />}
        {googleTagManager && (
          <script
            data-google-tag-manager-container-id={
              config.integrations.analytics.gtm?.containerId
            }
            dangerouslySetInnerHTML={{ __html: googleTagManager }}
          />
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: getThemeScript(THEME_STORAGE_KEY, config.mode),
          }}
        />
        {adobe && <script async={adobe.async} src={adobe.src} />}
        {amplitude && <script src={amplitude.src} />}
        {clarity && (
          <script
            data-clarity-project-id={
              config.integrations.analytics.clarity?.projectId
            }
            dangerouslySetInnerHTML={{ __html: clarity }}
          />
        )}
        {clearbit && <script src={clearbit.src} />}
        {fathom && (
          <script
            data-site={fathom.siteId}
            data-spa={fathom.spa}
            defer={fathom.defer}
            src={fathom.src}
          />
        )}
        {googleAnalytics && googleAnalyticsBootstrap && (
          <>
            <script async={googleAnalytics.async} src={googleAnalytics.src} />
            <script
              data-google-analytics-measurement-id={
                config.integrations.analytics.ga4?.measurementId
              }
              dangerouslySetInnerHTML={{ __html: googleAnalyticsBootstrap }}
            />
          </>
        )}
        {heap && (
          <script
            data-heap-environment-id={
              config.integrations.analytics.heap?.environmentId
            }
            dangerouslySetInnerHTML={{ __html: heap }}
          />
        )}
        {hotjar && (
          <script
            data-hotjar-site-id={config.integrations.analytics.hotjar?.siteId}
            data-hotjar-snippet-version={
              config.integrations.analytics.hotjar?.snippetVersion
            }
            dangerouslySetInnerHTML={{ __html: hotjar }}
          />
        )}
        {logRocket && logRocketBootstrap && (
          <>
            <script crossOrigin={logRocket.crossOrigin} src={logRocket.src} />
            <script
              data-logrocket-app-id={
                config.integrations.analytics.logrocket?.appId
              }
              dangerouslySetInnerHTML={{ __html: logRocketBootstrap }}
            />
          </>
        )}
        {mixpanel && mixpanelBootstrap && (
          <>
            <script src={mixpanel.src} />
            <script
              data-mixpanel-project-token={
                config.integrations.analytics.mixpanel?.projectToken
              }
              dangerouslySetInnerHTML={{ __html: mixpanelBootstrap }}
            />
          </>
        )}
        {openpanel && openpanelBootstrap && (
          <>
            <script
              data-openpanel-api-url={
                config.integrations.analytics.openpanel?.apiUrl
              }
              data-openpanel-client-id={
                config.integrations.analytics.openpanel?.clientId
              }
              dangerouslySetInnerHTML={{ __html: openpanelBootstrap }}
            />
            <script
              async={openpanel.async}
              defer={openpanel.defer}
              src={openpanel.src}
            />
          </>
        )}
        {openReplay && (
          <script
            data-openreplay-ingest-point={
              config.integrations.analytics.openreplay?.ingestPoint
            }
            data-openreplay-project-key={
              config.integrations.analytics.openreplay?.projectKey
            }
            dangerouslySetInnerHTML={{ __html: openReplay }}
          />
        )}
        {pirsch && (
          <script
            data-code={pirsch.code}
            defer={pirsch.defer}
            src={pirsch.src}
          />
        )}
        {plausible && (
          <script
            data-domain={plausible.domain}
            defer={plausible.defer}
            src={plausible.src}
          />
        )}
        {posthog && posthogBootstrap && posthogHost && (
          <>
            <script src={posthog.src} />
            <script
              data-posthog-api-host={posthogHost}
              data-posthog-project-api-key={
                config.integrations.analytics.posthog?.projectApiKey
              }
              dangerouslySetInnerHTML={{ __html: posthogBootstrap }}
            />
          </>
        )}
        {rybbit && (
          <script
            data-site-id={rybbit.siteId}
            defer={rybbit.defer}
            src={rybbit.src}
          />
        )}
        {umami && (
          <script
            data-website-id={umami.websiteId}
            defer={umami.defer}
            src={umami.src}
          />
        )}
        {chaskiq && (
          <script
            data-chaskiq-app-id={config.integrations.support.chaskiq?.appId}
            data-chaskiq-base-url={config.integrations.support.chaskiq?.baseUrl}
            data-chaskiq-ws-url={config.integrations.support.chaskiq?.wsUrl}
            dangerouslySetInnerHTML={{ __html: chaskiq }}
          />
        )}
        {papercups && (
          <script
            data-papercups-base-url={
              config.integrations.support.papercups?.baseUrl
            }
            data-papercups-inbox={config.integrations.support.papercups?.inbox}
            data-papercups-token={config.integrations.support.papercups?.token}
            dangerouslySetInnerHTML={{ __html: papercups }}
          />
        )}
        {typebot && (
          <script
            data-heyo-typebot
            data-typebot-api-host={config.integrations.support.typebot?.apiHost}
            data-typebot-id={config.integrations.support.typebot?.typebot}
            dangerouslySetInnerHTML={{ __html: typebot }}
            type="module"
          />
        )}
        <Meta />
        <Links />
      </head>
      <body>
        {googleTagManagerNoScript && (
          <noscript>
            <iframe
              height="0"
              src={googleTagManagerNoScript}
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
              width="0"
            />
          </noscript>
        )}
        <ThemeProvider
          defaultTheme={config.mode}
          storageKey={THEME_STORAGE_KEY}
        >
          {children}
          <ScrollRestoration />
          <Scripts />
        </ThemeProvider>
        {swetrix && swetrixBootstrap && (
          <>
            <script defer={swetrix.defer} src={swetrix.src} />
            <script
              data-swetrix-api-url={
                config.integrations.analytics.swetrix?.apiUrl
              }
              data-swetrix-project-id={
                config.integrations.analytics.swetrix?.projectId
              }
              dangerouslySetInnerHTML={{ __html: swetrixBootstrap }}
            />
          </>
        )}
        {intercom && (
          <script
            data-intercom-app-id={config.integrations.support.intercom?.appId}
            data-intercom-api-base={
              config.integrations.support.intercom?.apiBase
            }
            dangerouslySetInnerHTML={{ __html: intercom }}
          />
        )}
        {front && frontBootstrap && (
          <>
            <script src={front.src} />
            <script
              data-front-chat-id={config.integrations.support.front?.chatId}
              dangerouslySetInnerHTML={{ __html: frontBootstrap }}
            />
          </>
        )}
        {chatwoot && (
          <script
            data-chatwoot-base-url={
              config.integrations.support.chatwoot?.baseUrl
            }
            data-chatwoot-website-token={
              config.integrations.support.chatwoot?.websiteToken
            }
            dangerouslySetInnerHTML={{ __html: chatwoot }}
          />
        )}
        {zammad && zammadBootstrap && (
          <>
            <script src={zammad.src} />
            <script
              data-zammad-chat-id={config.integrations.support.zammad?.chatId}
              dangerouslySetInnerHTML={{ __html: zammadBootstrap }}
            />
          </>
        )}
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
