import { expect, test } from "bun:test";

import { heyoDocs, validateConfig } from "../src/config";
import { adobeAnalyticsScript } from "../src/integrations/analytics/adobe";
import { osanoConsentScript } from "../src/integrations/consent/osano";
import { intercomBootstrapScript } from "../src/integrations/support/intercom";

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

  const script = intercomBootstrapScript({ appId: "abc123" });
  expect(script).toContain('window.intercomSettings={"app_id":"abc123"}');
  expect(script).toContain("https://widget.intercom.io/widget/abc123");
  expect(script).toContain('w.addEventListener("load",l,false)');
});
