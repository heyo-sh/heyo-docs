import { expect, test } from "bun:test";

import { heyoDocs, validateConfig } from "../src/config";
import { adobeAnalyticsScript } from "../src/integrations/analytics/adobe";
import { amplitudeAnalyticsScript } from "../src/integrations/analytics/amplitude";
import { clarityBootstrapScript } from "../src/integrations/analytics/clarity";
import { clearbitAnalyticsScript } from "../src/integrations/analytics/clearbit";
import { fathomAnalyticsScript } from "../src/integrations/analytics/fathom";
import {
  googleAnalyticsBootstrapScript,
  googleAnalyticsScript,
} from "../src/integrations/analytics/google-analytics";
import {
  googleTagManagerBootstrapScript,
  googleTagManagerNoScriptUrl,
} from "../src/integrations/analytics/google-tag-manager";
import { heapBootstrapScript } from "../src/integrations/analytics/heap";
import { hotjarBootstrapScript } from "../src/integrations/analytics/hotjar";
import {
  logRocketBootstrapScript,
  logRocketScript,
} from "../src/integrations/analytics/logrocket";
import {
  mixpanelBootstrapScript,
  mixpanelScript,
} from "../src/integrations/analytics/mixpanel";
import {
  openpanelBootstrapScript,
  openpanelScript,
} from "../src/integrations/analytics/openpanel";
import { openReplayBootstrapScript } from "../src/integrations/analytics/openreplay";
import { osanoConsentScript } from "../src/integrations/consent/osano";
import {
  transcendConsentScript,
  transcendGoogleConsentModeDefaultsScript,
} from "../src/integrations/consent/transcend";
import { pirschAnalyticsScript } from "../src/integrations/analytics/pirsch";
import { plausibleAnalyticsScript } from "../src/integrations/analytics/plausible";
import {
  posthogApiHost,
  posthogBootstrapScript,
  posthogScript,
} from "../src/integrations/analytics/posthog";
import { rybbitAnalyticsScript } from "../src/integrations/analytics/rybbit";
import {
  swetrixBootstrapScript,
  swetrixScript,
} from "../src/integrations/analytics/swetrix";
import { chaskiqBootstrapScript } from "../src/integrations/support/chaskiq";
import { chatwootBootstrapScript } from "../src/integrations/support/chatwoot";
import {
  frontChatBootstrapScript,
  frontChatScript,
} from "../src/integrations/support/front";
import { intercomBootstrapScript } from "../src/integrations/support/intercom";
import { papercupsBootstrapScript } from "../src/integrations/support/papercups";
import { typebotBootstrapScript } from "../src/integrations/support/typebot";
import { umamiAnalyticsScript } from "../src/integrations/analytics/umami";
import {
  zammadBootstrapScript,
  zammadChatScript,
} from "../src/integrations/support/zammad";

test("keeps an official source of truth directly above every provider schema", async () => {
  const providers = [
    {
      source: Bun.file(
        new URL("../src/integrations/analytics/adobe.ts", import.meta.url),
      ),
      schema: "adobeAnalyticsSchema",
      sourceOfTruth: "experienceleague.adobe.com",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/analytics/amplitude.ts", import.meta.url),
      ),
      schema: "amplitudeAnalyticsSchema",
      sourceOfTruth: "www.amplitude.com",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/analytics/clarity.ts", import.meta.url),
      ),
      schema: "clarityAnalyticsSchema",
      sourceOfTruth: "learn.microsoft.com",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/analytics/clearbit.ts", import.meta.url),
      ),
      schema: "clearbitAnalyticsSchema",
      sourceOfTruth: "help.clearbit.com",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/analytics/fathom.ts", import.meta.url),
      ),
      schema: "fathomAnalyticsSchema",
      sourceOfTruth: "usefathom.com",
    },
    {
      source: Bun.file(
        new URL(
          "../src/integrations/analytics/google-analytics.ts",
          import.meta.url,
        ),
      ),
      schema: "googleAnalyticsSchema",
      sourceOfTruth: "support.google.com",
    },
    {
      source: Bun.file(
        new URL(
          "../src/integrations/analytics/google-tag-manager.ts",
          import.meta.url,
        ),
      ),
      schema: "googleTagManagerSchema",
      sourceOfTruth: "support.google.com",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/analytics/heap.ts", import.meta.url),
      ),
      schema: "heapAnalyticsSchema",
      sourceOfTruth: "developers.heap.io",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/analytics/hotjar.ts", import.meta.url),
      ),
      schema: "hotjarAnalyticsSchema",
      sourceOfTruth: "help.hotjar.com",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/analytics/logrocket.ts", import.meta.url),
      ),
      schema: "logRocketAnalyticsSchema",
      sourceOfTruth: "docs.logrocket.com",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/analytics/mixpanel.ts", import.meta.url),
      ),
      schema: "mixpanelAnalyticsSchema",
      sourceOfTruth: "github.com",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/analytics/openpanel.ts", import.meta.url),
      ),
      schema: "openpanelAnalyticsSchema",
      sourceOfTruth: "openpanel.dev",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/analytics/openreplay.ts", import.meta.url),
      ),
      schema: "openReplayAnalyticsSchema",
      sourceOfTruth: "docs.openreplay.com",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/analytics/pirsch.ts", import.meta.url),
      ),
      schema: "pirschAnalyticsSchema",
      sourceOfTruth: "docs.pirsch.io",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/analytics/plausible.ts", import.meta.url),
      ),
      schema: "plausibleAnalyticsSchema",
      sourceOfTruth: "plausible.io",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/analytics/posthog.ts", import.meta.url),
      ),
      schema: "posthogAnalyticsSchema",
      sourceOfTruth: "posthog.com",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/analytics/rybbit.ts", import.meta.url),
      ),
      schema: "rybbitAnalyticsSchema",
      sourceOfTruth: "www.rybbit.io",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/analytics/swetrix.ts", import.meta.url),
      ),
      schema: "swetrixAnalyticsSchema",
      sourceOfTruth: "swetrix.com",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/analytics/umami.ts", import.meta.url),
      ),
      schema: "umamiAnalyticsSchema",
      sourceOfTruth: "docs.umami.is",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/support/intercom.ts", import.meta.url),
      ),
      schema: "intercomSupportSchema",
      sourceOfTruth: "developers.intercom.com",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/support/front.ts", import.meta.url),
      ),
      schema: "frontSupportSchema",
      sourceOfTruth: "help.front.com",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/support/chatwoot.ts", import.meta.url),
      ),
      schema: "chatwootSupportSchema",
      sourceOfTruth: "www.chatwoot.com",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/support/chaskiq.ts", import.meta.url),
      ),
      schema: "chaskiqSupportSchema",
      sourceOfTruth: "dev.chaskiq.io",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/support/papercups.ts", import.meta.url),
      ),
      schema: "papercupsSupportSchema",
      sourceOfTruth: "github.com",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/support/typebot.ts", import.meta.url),
      ),
      schema: "typebotSupportSchema",
      sourceOfTruth: "docs.typebot.com",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/support/zammad.ts", import.meta.url),
      ),
      schema: "zammadSupportSchema",
      sourceOfTruth: "admin-docs.zammad.org",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/consent/osano.ts", import.meta.url),
      ),
      schema: "osanoConsentSchema",
      sourceOfTruth: "docs.osano.com",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/consent/transcend.ts", import.meta.url),
      ),
      schema: "transcendConsentSchema",
      sourceOfTruth: "docs.transcend.io",
    },
  ];

  for (const provider of providers) {
    const source = await provider.source.text();
    const sourceOfTruth = `Source of truth: https://${provider.sourceOfTruth}`;
    const schemaDeclaration = `export const ${provider.schema}`;
    const schemaIndex = source.indexOf(schemaDeclaration);
    const documentationBlockStart = source.lastIndexOf("/**", schemaIndex);
    const documentationBlock = source.slice(
      documentationBlockStart,
      schemaIndex,
    );

    expect(schemaIndex).toBeGreaterThan(-1);
    expect(documentationBlockStart).toBeGreaterThan(-1);
    expect(documentationBlock).toContain(sourceOfTruth);
    expect(documentationBlock.trimEnd().endsWith("*/")).toBe(true);
  }
});

test("normalises integrations into their purpose-specific categories", () => {
  expect(
    heyoDocs({
      content: "./content",
      integrations: {
        analytics: {
          adobe: {
            launchUrl:
              "https://assets.adobedtm.com/launch-EN93497c30fdf0424eb678d5f4ffac66dc.min.js",
          },
          amplitude: { apiKey: "amplitude-public-key" },
          clarity: { projectId: "abc123" },
          clearbit: { publishableKey: "pk_clearbit" },
          fathom: { siteId: "ABCDE12" },
          ga4: { measurementId: "G-ABC123" },
          gtm: { containerId: "GTM-ABC123" },
          heap: { environmentId: "heap-environment" },
          hotjar: { siteId: 123456, snippetVersion: 6 },
          logrocket: { appId: "heyo/docs" },
          mixpanel: { projectToken: "mixpanel-project-token" },
          openpanel: {
            clientId: "cl_openpanel",
            apiUrl: "https://analytics.example.com",
          },
          openreplay: {
            projectKey: "openreplay-project-key",
            ingestPoint: "https://replay.example.com/ingest",
          },
          pirsch: { identificationCode: "pirsch_code" },
          plausible: { domain: "docs.example.com" },
          posthog: {
            projectApiKey: "phc_abc123",
            apiHost: "https://eu.i.posthog.com",
          },
          rybbit: {
            siteId: "rybbit-site-id",
            scriptUrl: "https://analytics.example.com/api/script.js",
          },
          swetrix: {
            projectId: "swetrix-project-id",
            apiUrl: "https://analytics.example.com/backend/v1/log",
          },
          umami: {
            websiteId: "umami-website-id",
            scriptUrl: "https://analytics.example.com/script.js",
          },
        },
        support: {
          chaskiq: {
            appId: "chaskiq-app-id",
            baseUrl: "https://chat.example.com",
          },
          chatwoot: {
            baseUrl: "https://chatwoot.example.com",
            websiteToken: "chatwoot-website-token",
          },
          front: { chatId: "front-chat-id" },
          intercom: {
            appId: "abc123",
            apiBase: "https://api-iam.eu.intercom.io",
          },
          papercups: { token: "papercups-token", inbox: "support" },
          typebot: {
            typebot: "support-bot",
            apiHost: "https://typebot.example.com",
          },
          zammad: { baseUrl: "https://zammad.example.com", chatId: 1 },
        },
        consent: {
          transcend: { bundleId: "transcend_bundle-id" },
        },
      },
    }).integrations,
  ).toEqual({
    analytics: {
      adobe: {
        launchUrl:
          "https://assets.adobedtm.com/launch-EN93497c30fdf0424eb678d5f4ffac66dc.min.js",
      },
      amplitude: { apiKey: "amplitude-public-key" },
      clarity: { projectId: "abc123" },
      clearbit: { publishableKey: "pk_clearbit" },
      fathom: { siteId: "ABCDE12" },
      ga4: { measurementId: "G-ABC123" },
      gtm: { containerId: "GTM-ABC123" },
      heap: { environmentId: "heap-environment" },
      hotjar: { siteId: 123456, snippetVersion: 6 },
      logrocket: { appId: "heyo/docs" },
      mixpanel: { projectToken: "mixpanel-project-token" },
      openpanel: {
        clientId: "cl_openpanel",
        apiUrl: "https://analytics.example.com",
      },
      openreplay: {
        projectKey: "openreplay-project-key",
        ingestPoint: "https://replay.example.com/ingest",
      },
      pirsch: { identificationCode: "pirsch_code" },
      plausible: { domain: "docs.example.com" },
      posthog: {
        projectApiKey: "phc_abc123",
        apiHost: "https://eu.i.posthog.com",
      },
      rybbit: {
        siteId: "rybbit-site-id",
        scriptUrl: "https://analytics.example.com/api/script.js",
      },
      swetrix: {
        projectId: "swetrix-project-id",
        apiUrl: "https://analytics.example.com/backend/v1/log",
      },
      umami: {
        websiteId: "umami-website-id",
        scriptUrl: "https://analytics.example.com/script.js",
      },
    },
    support: {
      chaskiq: {
        appId: "chaskiq-app-id",
        baseUrl: "https://chat.example.com",
      },
      chatwoot: {
        baseUrl: "https://chatwoot.example.com",
        websiteToken: "chatwoot-website-token",
      },
      front: { chatId: "front-chat-id" },
      intercom: {
        appId: "abc123",
        apiBase: "https://api-iam.eu.intercom.io",
      },
      papercups: { token: "papercups-token", inbox: "support" },
      typebot: {
        typebot: "support-bot",
        apiHost: "https://typebot.example.com",
      },
      zammad: { baseUrl: "https://zammad.example.com", chatId: 1 },
    },
    consent: {
      transcend: { bundleId: "transcend_bundle-id" },
    },
  });
});

test("rejects unknown, insecure, and malformed integration configuration", () => {
  expect(() =>
    validateConfig({
      content: "./content",
      integrations: {
        analytics: { adobe: { launchUrl: "http://example.com" } },
      },
    }),
  ).toThrow(/HTTPS/);
  expect(() =>
    validateConfig({
      content: "./content",
      integrations: {
        consent: { osano: { scriptUrl: "https://example.com/osano.js" } },
      },
    }),
  ).toThrow(/cmp\.osano\.com/);
  expect(() =>
    validateConfig({
      content: "./content",
      integrations: {
        analytics: { ga4: { measurementId: "UA-12345" } },
      },
    }),
  ).toThrow(/GA4/);
  expect(() =>
    validateConfig({
      content: "./content",
      integrations: {
        analytics: { clearbit: { publishableKey: "sk_secret" } },
      },
    }),
  ).toThrow(/publishableKey/);
  expect(() =>
    validateConfig({
      content: "./content",
      integrations: { analytics: { posthog: { projectApiKey: "secret" } } },
    }),
  ).toThrow(/projectApiKey/);
  expect(() =>
    validateConfig({
      content: "./content",
      integrations: {
        analytics: {
          umami: {
            websiteId: "umami-website-id",
            scriptUrl: "http://analytics.example.com/script.js",
          },
        },
      },
    }),
  ).toThrow(/Umami scriptUrl/);
  expect(() =>
    validateConfig({
      content: "./content",
      integrations: {
        analytics: {
          openreplay: {
            projectKey: "openreplay-project-key",
            ingestPoint: "https://replay.example.com/ingest?token=secret",
          },
        },
      },
    }),
  ).toThrow(/OpenReplay ingestPoint/);
  expect(() =>
    validateConfig({
      content: "./content",
      integrations: {
        support: {
          chatwoot: { baseUrl: "http://chat.example.com", websiteToken: "x" },
        },
      },
    }),
  ).toThrow(/Chatwoot baseUrl/);
  expect(() =>
    validateConfig({
      content: "./content",
      integrations: {
        support: {
          intercom: {
            appId: "abc123",
            apiBase: "https://api.intercom.example",
          },
        },
      },
    } as never),
  ).toThrow(/Invalid option/);
  expect(() =>
    validateConfig({
      content: "./content",
      integrations: {
        consent: {
          osano: { scriptUrl: "https://cmp.osano.com/tenant/site/osano.js" },
          transcend: { bundleId: "bundle" },
        },
      },
    }),
  ).toThrow(/Only one consent manager/);
  expect(() =>
    validateConfig({
      content: "./content",
      integrations: { consent: { transcend: { bundleId: "bundle/id" } } },
    }),
  ).toThrow(/bundleId/);
  expect(() =>
    validateConfig({
      content: "./content",
      integrations: { analytics: { unknown: {} } },
    } as never),
  ).toThrow();
});

test("emits each provider's isolated browser integration", () => {
  expect(
    adobeAnalyticsScript({
      launchUrl: "https://assets.adobedtm.com/launch-example.min.js",
    }),
  ).toEqual({
    async: true,
    src: "https://assets.adobedtm.com/launch-example.min.js",
  });
  expect(
    osanoConsentScript({
      scriptUrl: "https://cmp.osano.com/tenant/site/osano.js",
    }),
  ).toEqual({ src: "https://cmp.osano.com/tenant/site/osano.js" });
  expect(transcendConsentScript({ bundleId: "transcend_bundle-id" })).toEqual({
    dataCfasync: "false",
    src: "https://transcend-cdn.com/cm/transcend_bundle-id/airgap.js",
  });
  expect(transcendGoogleConsentModeDefaultsScript()).toContain(
    'gtag("set","developer_id.dODQ2Mj",true)',
  );
  expect(transcendGoogleConsentModeDefaultsScript()).toContain(
    'analytics_storage:"denied"',
  );

  const script = intercomBootstrapScript();
  expect(script).toContain('getAttribute("data-intercom-app-id")');
  expect(script).toContain('getAttribute("data-intercom-api-base")');
  expect(script).toContain("api_base:apiBase");
  expect(script).toContain('"https://api-iam.intercom.io"');
  expect(script).toContain(
    'new URL(encodeURIComponent(appId),"https://widget.intercom.io/widget/")',
  );
  expect(script).toContain('i("boot",settings)');
  expect(script).toContain("h.pushState=function()");
  expect(script).toContain(
    'w.addEventListener("popstate",onRouteChange,false)',
  );
  expect(script).toContain('w.addEventListener("load",l,false)');

  expect(frontChatScript()).toEqual({
    src: "https://chat-assets.frontapp.com/v1/chat.bundle.js",
  });
  expect(frontChatBootstrapScript()).toContain("data-front-chat-id");
  expect(frontChatBootstrapScript()).toContain('FrontChat("init"');
  expect(chatwootBootstrapScript()).toContain("data-chatwoot-website-token");
  expect(chatwootBootstrapScript()).toContain('"/packs/js/sdk.js"');
  expect(chaskiqBootstrapScript()).toContain("data-chaskiq-app-id");
  expect(chaskiqBootstrapScript()).toContain("ChaskiqMessengerEncrypted");
  expect(chaskiqBootstrapScript()).toContain("data:{}");
  expect(papercupsBootstrapScript()).toContain("data-papercups-token");
  expect(papercupsBootstrapScript()).toContain("https://app.papercups.io");
  expect(typebotBootstrapScript()).toContain("data-heyo-typebot");
  expect(typebotBootstrapScript()).toContain("Typebot.initBubble");
  expect(
    zammadChatScript({ baseUrl: "https://zammad.example.com", chatId: 1 }),
  ).toEqual({
    src: "https://zammad.example.com/assets/chat/chat-no-jquery.js",
  });
  expect(zammadBootstrapScript()).toContain("data-zammad-chat-id");
  expect(zammadBootstrapScript()).toContain("new window.ZammadChat");

  expect(amplitudeAnalyticsScript({ apiKey: "public-key" })).toEqual({
    src: "https://cdn.amplitude.com/script/public-key.js",
  });
  expect(clarityBootstrapScript()).toContain(
    'getAttribute("data-clarity-project-id")',
  );
  expect(clarityBootstrapScript()).toContain("https://www.clarity.ms/tag/");
  expect(clearbitAnalyticsScript({ publishableKey: "pk_clearbit" })).toEqual({
    src: "https://tag.clearbitscripts.com/v1/pk_clearbit/tags.js",
  });
  expect(fathomAnalyticsScript({ siteId: "ABCDE12" })).toEqual({
    defer: true,
    siteId: "ABCDE12",
    spa: "auto",
    src: "https://cdn.usefathom.com/script.js",
  });
  expect(googleAnalyticsScript({ measurementId: "G-ABC123" })).toEqual({
    async: true,
    src: "https://www.googletagmanager.com/gtag/js?id=G-ABC123",
  });
  expect(googleAnalyticsBootstrapScript()).toContain(
    'getAttribute("data-google-analytics-measurement-id")',
  );
  expect(googleTagManagerBootstrapScript()).toContain(
    'getAttribute("data-google-tag-manager-container-id")',
  );
  expect(googleTagManagerNoScriptUrl({ containerId: "GTM-ABC123" })).toBe(
    "https://www.googletagmanager.com/ns.html?id=GTM-ABC123",
  );
  expect(heapBootstrapScript()).toContain(
    'getAttribute("data-heap-environment-id")',
  );
  expect(heapBootstrapScript()).toContain(
    "https://cdn.us.heap-api.com/config/",
  );
  expect(hotjarBootstrapScript()).toContain(
    'getAttribute("data-hotjar-site-id")',
  );
  expect(hotjarBootstrapScript()).toContain("https://static.hotjar.com/");
  expect(logRocketScript()).toEqual({
    crossOrigin: "anonymous",
    src: "https://cdn.logr-in.com/LogRocket.min.js",
  });
  expect(logRocketBootstrapScript()).toContain(
    'getAttribute("data-logrocket-app-id")',
  );
  expect(mixpanelScript()).toEqual({
    src: "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js",
  });
  expect(mixpanelBootstrapScript()).toContain(
    'getAttribute("data-mixpanel-project-token")',
  );
  expect(mixpanelBootstrapScript()).toContain('track_pageview:"url-with-path"');
  expect(openpanelScript()).toEqual({
    async: true,
    defer: true,
    src: "https://openpanel.dev/op1.js",
  });
  expect(openpanelBootstrapScript()).toContain(
    'getAttribute("data-openpanel-client-id")',
  );
  expect(openpanelBootstrapScript()).toContain("trackScreenViews:true");
  expect(openpanelBootstrapScript()).toContain("trackOutgoingLinks:true");
  expect(openpanelBootstrapScript()).toContain("trackAttributes:true");
  expect(openReplayBootstrapScript()).toContain(
    'getAttribute("data-openreplay-project-key")',
  );
  expect(openReplayBootstrapScript()).toContain(
    "https://static.openreplay.com/latest/openreplay.js",
  );
  expect(pirschAnalyticsScript({ identificationCode: "pirsch_code" })).toEqual({
    code: "pirsch_code",
    defer: true,
    src: "https://api.pirsch.io/pa.js",
  });
  expect(plausibleAnalyticsScript({ domain: "docs.example.com" })).toEqual({
    defer: true,
    domain: "docs.example.com",
    src: "https://plausible.io/js/script.js",
  });
  expect(posthogScript({ projectApiKey: "phc_abc123" })).toEqual({
    src: "https://us.i.posthog.com/static/array.js",
  });
  expect(
    posthogApiHost({
      projectApiKey: "phc_abc123",
      apiHost: "https://eu.i.posthog.com",
    }),
  ).toBe("https://eu.i.posthog.com");
  expect(posthogBootstrapScript()).toContain(
    'getAttribute("data-posthog-project-api-key")',
  );
  expect(posthogBootstrapScript()).toContain(
    'capture_pageview:"history_change"',
  );
  expect(posthogBootstrapScript()).toContain(
    'external_scripts_inject_target:"head"',
  );
  expect(rybbitAnalyticsScript({ siteId: "rybbit-site-id" })).toEqual({
    defer: true,
    siteId: "rybbit-site-id",
    src: "https://app.rybbit.io/api/script.js",
  });
  expect(swetrixScript()).toEqual({
    defer: true,
    src: "https://swetrix.org/swetrix.js",
  });
  expect(swetrixBootstrapScript()).toContain(
    'getAttribute("data-swetrix-project-id")',
  );
  expect(swetrixBootstrapScript()).toContain("trackViews()");
  expect(
    umamiAnalyticsScript({
      websiteId: "umami-website-id",
      scriptUrl: "https://analytics.example.com/script.js",
    }),
  ).toEqual({
    defer: true,
    src: "https://analytics.example.com/script.js",
    websiteId: "umami-website-id",
  });
});

test("wires each browser integration into every framework template", async () => {
  const templates = [
    Bun.file(new URL("../../../examples/next/app/layout.tsx", import.meta.url)),
    Bun.file(
      new URL("../../../examples/react-router/app/root.tsx", import.meta.url),
    ),
    Bun.file(
      new URL(
        "../../../examples/astro/src/layouts/docs-layout.astro",
        import.meta.url,
      ),
    ),
  ];
  const integrations = [
    "amplitude",
    "clarity",
    "clearbit",
    "fathom",
    "google-analytics",
    "google-tag-manager",
    "heap",
    "hotjar",
    "logrocket",
    "mixpanel",
    "openpanel",
    "openreplay",
    "pirsch",
    "plausible",
    "posthog",
    "rybbit",
    "swetrix",
    "umami",
  ];
  const supportIntegrations = [
    "chaskiq",
    "chatwoot",
    "front",
    "intercom",
    "papercups",
    "typebot",
    "zammad",
  ];

  for (const template of templates) {
    const source = await template.text();

    for (const integration of integrations) {
      expect(source).toContain(`integrations/analytics/${integration}`);
    }
    for (const integration of supportIntegrations) {
      expect(source).toContain(`integrations/support/${integration}`);
    }

    expect(source).toContain("integrations/consent/transcend");
    expect(source).toContain("data-cfasync");
    expect(source).toContain("transcendGoogleConsentModeDefaultsScript");
    expect(source.indexOf("transcendGoogleConsentDefaults &&")).toBeLessThan(
      source.indexOf("data-cfasync"),
    );
    expect(source).toContain("data-front-chat-id");
    expect(source).toContain("data-chatwoot-website-token");
    expect(source).toContain("data-chaskiq-app-id");
    expect(source).toContain("data-papercups-token");
    expect(source).toContain("data-heyo-typebot");
    expect(source).toContain("data-zammad-chat-id");
    expect(source).toContain("data-google-tag-manager-container-id");
    expect(source).toContain("googleTagManagerNoScript");
    expect(source).toContain("data-hotjar-site-id");
    expect(source).toContain("data-logrocket-app-id");
    expect(source).toContain("data-mixpanel-project-token");
    expect(source).toContain("data-openpanel-client-id");
    expect(source).toContain("data-openreplay-project-key");
    expect(source).toContain("data-posthog-project-api-key");
    expect(source).toContain("data-swetrix-project-id");
    expect(source).toContain("data-website-id");
    expect(source).toContain("data-intercom-api-base");

    const bodyIndex = source.indexOf("<body");
    expect(bodyIndex).toBeGreaterThan(-1);
    expect(source.indexOf("data-swetrix-project-id")).toBeGreaterThan(
      bodyIndex,
    );
    for (const supportScript of [
      "data-intercom-app-id",
      "data-front-chat-id",
      "data-chatwoot-website-token",
      "data-zammad-chat-id",
    ]) {
      expect(source.indexOf(supportScript)).toBeGreaterThan(bodyIndex);
    }
  }
});
