import type { DocsIntegrations } from "../types";

import { adobeAnalyticsScript } from "../integrations/analytics/adobe";
import { amplitudeAnalyticsScript } from "../integrations/analytics/amplitude";
import { clarityBootstrapScript } from "../integrations/analytics/clarity";
import { clearbitAnalyticsScript } from "../integrations/analytics/clearbit";
import { fathomAnalyticsScript } from "../integrations/analytics/fathom";
import {
  googleAnalyticsBootstrapScript,
  googleAnalyticsScript,
} from "../integrations/analytics/google-analytics";
import {
  googleTagManagerBootstrapScript,
  googleTagManagerNoScriptUrl,
} from "../integrations/analytics/google-tag-manager";
import { heapBootstrapScript } from "../integrations/analytics/heap";
import { hotjarBootstrapScript } from "../integrations/analytics/hotjar";
import {
  logRocketBootstrapScript,
  logRocketScript,
} from "../integrations/analytics/logrocket";
import {
  mixpanelBootstrapScript,
  mixpanelScript,
} from "../integrations/analytics/mixpanel";
import {
  openpanelBootstrapScript,
  openpanelScript,
} from "../integrations/analytics/openpanel";
import { openReplayBootstrapScript } from "../integrations/analytics/openreplay";
import { osanoConsentScript } from "../integrations/consent/osano";
import {
  transcendConsentScript,
  transcendGoogleConsentModeDefaultsScript,
} from "../integrations/consent/transcend";
import { pirschAnalyticsScript } from "../integrations/analytics/pirsch";
import { plausibleAnalyticsScript } from "../integrations/analytics/plausible";
import {
  posthogApiHost,
  posthogBootstrapScript,
  posthogScript,
} from "../integrations/analytics/posthog";
import { rybbitAnalyticsScript } from "../integrations/analytics/rybbit";
import {
  swetrixBootstrapScript,
  swetrixScript,
} from "../integrations/analytics/swetrix";
import { chaskiqBootstrapScript } from "../integrations/support/chaskiq";
import { chatwootBootstrapScript } from "../integrations/support/chatwoot";
import {
  frontChatBootstrapScript,
  frontChatScript,
} from "../integrations/support/front";
import { intercomBootstrapScript } from "../integrations/support/intercom";
import { papercupsBootstrapScript } from "../integrations/support/papercups";
import { typebotBootstrapScript } from "../integrations/support/typebot";
import { umamiAnalyticsScript } from "../integrations/analytics/umami";
import {
  zammadBootstrapScript,
  zammadChatScript,
} from "../integrations/support/zammad";

/**
 * Renders all configured browser integrations once, in their required consent →
 * analytics → support order. Framework adapters only choose the document slot;
 * they never have to duplicate provider snippets.
 */
export function IntegrationScripts({
  integrations,
  placement,
}: {
  integrations: DocsIntegrations;
  placement: "head" | "body";
}) {
  const osano = integrations.consent.osano
    ? osanoConsentScript(integrations.consent.osano)
    : undefined;
  const transcend = integrations.consent.transcend
    ? transcendConsentScript(integrations.consent.transcend)
    : undefined;
  const transcendGoogleConsentDefaults =
    transcend && (integrations.analytics.ga4 || integrations.analytics.gtm)
      ? transcendGoogleConsentModeDefaultsScript()
      : undefined;
  const adobe = integrations.analytics.adobe
    ? adobeAnalyticsScript(integrations.analytics.adobe)
    : undefined;
  const amplitude = integrations.analytics.amplitude
    ? amplitudeAnalyticsScript(integrations.analytics.amplitude)
    : undefined;
  const clarity = integrations.analytics.clarity
    ? clarityBootstrapScript()
    : undefined;
  const clearbit = integrations.analytics.clearbit
    ? clearbitAnalyticsScript(integrations.analytics.clearbit)
    : undefined;
  const fathom = integrations.analytics.fathom
    ? fathomAnalyticsScript(integrations.analytics.fathom)
    : undefined;
  const googleAnalytics = integrations.analytics.ga4
    ? googleAnalyticsScript(integrations.analytics.ga4)
    : undefined;
  const googleAnalyticsBootstrap = googleAnalytics
    ? googleAnalyticsBootstrapScript()
    : undefined;
  const googleTagManager = integrations.analytics.gtm
    ? googleTagManagerBootstrapScript()
    : undefined;
  const googleTagManagerNoScript = integrations.analytics.gtm
    ? googleTagManagerNoScriptUrl(integrations.analytics.gtm)
    : undefined;
  const heap = integrations.analytics.heap ? heapBootstrapScript() : undefined;
  const hotjar = integrations.analytics.hotjar
    ? hotjarBootstrapScript()
    : undefined;
  const logRocket = integrations.analytics.logrocket
    ? logRocketScript()
    : undefined;
  const logRocketBootstrap = logRocket ? logRocketBootstrapScript() : undefined;
  const mixpanel = integrations.analytics.mixpanel
    ? mixpanelScript()
    : undefined;
  const mixpanelBootstrap = mixpanel ? mixpanelBootstrapScript() : undefined;
  const openpanel = integrations.analytics.openpanel
    ? openpanelScript()
    : undefined;
  const openpanelBootstrap = openpanel ? openpanelBootstrapScript() : undefined;
  const openReplay = integrations.analytics.openreplay
    ? openReplayBootstrapScript()
    : undefined;
  const pirsch = integrations.analytics.pirsch
    ? pirschAnalyticsScript(integrations.analytics.pirsch)
    : undefined;
  const plausible = integrations.analytics.plausible
    ? plausibleAnalyticsScript(integrations.analytics.plausible)
    : undefined;
  const posthog = integrations.analytics.posthog
    ? posthogScript(integrations.analytics.posthog)
    : undefined;
  const posthogBootstrap = posthog ? posthogBootstrapScript() : undefined;
  const posthogHost = integrations.analytics.posthog
    ? posthogApiHost(integrations.analytics.posthog)
    : undefined;
  const rybbit = integrations.analytics.rybbit
    ? rybbitAnalyticsScript(integrations.analytics.rybbit)
    : undefined;
  const swetrix = integrations.analytics.swetrix ? swetrixScript() : undefined;
  const swetrixBootstrap = swetrix ? swetrixBootstrapScript() : undefined;
  const umami = integrations.analytics.umami
    ? umamiAnalyticsScript(integrations.analytics.umami)
    : undefined;
  const intercom = integrations.support.intercom
    ? intercomBootstrapScript()
    : undefined;
  const front = integrations.support.front ? frontChatScript() : undefined;
  const frontBootstrap = front ? frontChatBootstrapScript() : undefined;
  const chatwoot = integrations.support.chatwoot
    ? chatwootBootstrapScript()
    : undefined;
  const chaskiq = integrations.support.chaskiq
    ? chaskiqBootstrapScript()
    : undefined;
  const papercups = integrations.support.papercups
    ? papercupsBootstrapScript()
    : undefined;
  const typebot = integrations.support.typebot
    ? typebotBootstrapScript()
    : undefined;
  const zammad = integrations.support.zammad
    ? zammadChatScript(integrations.support.zammad)
    : undefined;
  const zammadBootstrap = zammad ? zammadBootstrapScript() : undefined;

  if (placement === "head")
    return (
      <>
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
        <meta name="color-scheme" content="light dark" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        {osano && <script src={osano.src} />}
        {googleTagManager && (
          <script
            data-google-tag-manager-container-id={
              integrations.analytics.gtm?.containerId
            }
            dangerouslySetInnerHTML={{ __html: googleTagManager }}
          />
        )}
        {adobe && <script async={adobe.async} src={adobe.src} />}
        {amplitude && <script src={amplitude.src} />}
        {clarity && (
          <script
            data-clarity-project-id={integrations.analytics.clarity?.projectId}
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
                integrations.analytics.ga4?.measurementId
              }
              dangerouslySetInnerHTML={{ __html: googleAnalyticsBootstrap }}
            />
          </>
        )}
        {heap && (
          <script
            data-heap-environment-id={
              integrations.analytics.heap?.environmentId
            }
            dangerouslySetInnerHTML={{ __html: heap }}
          />
        )}
        {hotjar && (
          <script
            data-hotjar-site-id={integrations.analytics.hotjar?.siteId}
            data-hotjar-snippet-version={
              integrations.analytics.hotjar?.snippetVersion
            }
            dangerouslySetInnerHTML={{ __html: hotjar }}
          />
        )}
        {logRocket && logRocketBootstrap && (
          <>
            <script crossOrigin={logRocket.crossOrigin} src={logRocket.src} />
            <script
              data-logrocket-app-id={integrations.analytics.logrocket?.appId}
              dangerouslySetInnerHTML={{ __html: logRocketBootstrap }}
            />
          </>
        )}
        {mixpanel && mixpanelBootstrap && (
          <>
            <script src={mixpanel.src} />
            <script
              data-mixpanel-project-token={
                integrations.analytics.mixpanel?.projectToken
              }
              dangerouslySetInnerHTML={{ __html: mixpanelBootstrap }}
            />
          </>
        )}
        {openpanel && openpanelBootstrap && (
          <>
            <script
              data-openpanel-api-url={integrations.analytics.openpanel?.apiUrl}
              data-openpanel-client-id={
                integrations.analytics.openpanel?.clientId
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
              integrations.analytics.openreplay?.ingestPoint
            }
            data-openreplay-project-key={
              integrations.analytics.openreplay?.projectKey
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
                integrations.analytics.posthog?.projectApiKey
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
            data-chaskiq-app-id={integrations.support.chaskiq?.appId}
            data-chaskiq-base-url={integrations.support.chaskiq?.baseUrl}
            data-chaskiq-ws-url={integrations.support.chaskiq?.wsUrl}
            dangerouslySetInnerHTML={{ __html: chaskiq }}
          />
        )}
        {papercups && (
          <script
            data-papercups-base-url={integrations.support.papercups?.baseUrl}
            data-papercups-inbox={integrations.support.papercups?.inbox}
            data-papercups-token={integrations.support.papercups?.token}
            dangerouslySetInnerHTML={{ __html: papercups }}
          />
        )}
        {typebot && (
          <script
            data-heyo-typebot
            data-typebot-api-host={integrations.support.typebot?.apiHost}
            data-typebot-id={integrations.support.typebot?.typebot}
            dangerouslySetInnerHTML={{ __html: typebot }}
            type="module"
          />
        )}
      </>
    );

  return (
    <>
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
      {swetrix && swetrixBootstrap && (
        <>
          <script defer={swetrix.defer} src={swetrix.src} />
          <script
            data-swetrix-api-url={integrations.analytics.swetrix?.apiUrl}
            data-swetrix-project-id={integrations.analytics.swetrix?.projectId}
            dangerouslySetInnerHTML={{ __html: swetrixBootstrap }}
          />
        </>
      )}
      {intercom && (
        <script
          data-intercom-app-id={integrations.support.intercom?.appId}
          data-intercom-api-base={integrations.support.intercom?.apiBase}
          dangerouslySetInnerHTML={{ __html: intercom }}
        />
      )}
      {front && frontBootstrap && (
        <>
          <script src={front.src} />
          <script
            data-front-chat-id={integrations.support.front?.chatId}
            dangerouslySetInnerHTML={{ __html: frontBootstrap }}
          />
        </>
      )}
      {chatwoot && (
        <script
          data-chatwoot-base-url={integrations.support.chatwoot?.baseUrl}
          data-chatwoot-website-token={
            integrations.support.chatwoot?.websiteToken
          }
          dangerouslySetInnerHTML={{ __html: chatwoot }}
        />
      )}
      {zammad && zammadBootstrap && (
        <>
          <script src={zammad.src} />
          <script
            data-zammad-chat-id={integrations.support.zammad?.chatId}
            dangerouslySetInnerHTML={{ __html: zammadBootstrap }}
          />
        </>
      )}
    </>
  );
}
