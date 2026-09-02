import { expect, test } from "bun:test";

import { heyoDocs, validateConfig } from "../src/config";
import { adobeAnalyticsScript } from "../src/integrations/analytics/adobe";
import { osanoConsentScript } from "../src/integrations/consent/osano";
import { intercomBootstrapScript } from "../src/integrations/support/intercom";

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
        new URL("../src/integrations/support/intercom.ts", import.meta.url),
      ),
      schema: "intercomSupportSchema",
      sourceOfTruth: "developers.intercom.com",
    },
    {
      source: Bun.file(
        new URL("../src/integrations/consent/osano.ts", import.meta.url),
      ),
      schema: "osanoConsentSchema",
      sourceOfTruth: "docs.osano.com",
    },
  ];

  for (const provider of providers) {
    const source = await provider.source.text();
    const escapedSourceOfTruth = provider.sourceOfTruth.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    expect(source).toContain(
      `Source of truth: https://${provider.sourceOfTruth}`,
    );
    expect(source).toMatch(
      new RegExp(
        `Source of truth: https://${escapedSourceOfTruth}[\\s\\S]*?export const ${provider.schema}`,
      ),
    );
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
        },
        support: { intercom: { appId: "abc123" } },
        consent: {
          osano: {
            scriptUrl: "https://cmp.osano.com/tenant/site/osano.js",
          },
        },
      },
    }).integrations,
  ).toEqual({
    analytics: {
      adobe: {
        launchUrl:
          "https://assets.adobedtm.com/launch-EN93497c30fdf0424eb678d5f4ffac66dc.min.js",
      },
    },
    support: { intercom: { appId: "abc123" } },
    consent: {
      osano: { scriptUrl: "https://cmp.osano.com/tenant/site/osano.js" },
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

  const script = intercomBootstrapScript();
  expect(script).toContain('getAttribute("data-intercom-app-id")');
  expect(script).toContain(
    'new URL(encodeURIComponent(appId),"https://widget.intercom.io/widget/")',
  );
  expect(script).toContain('w.addEventListener("load",l,false)');
});
